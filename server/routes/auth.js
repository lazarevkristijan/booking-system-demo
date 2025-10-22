const express = require("express")
const router = express.Router()
const User = require("../models/User.js")
const jwt = require("jsonwebtoken")
const { cookieSettings, cookieSettingsNoAge } = require("../constants.js")
const { logAction } = require("../utils/logger.js")
const bcrypt = require("bcrypt")

router.post("/login", async (req, res) => {
	const { username, password } = req.body
	const user = await User.findOne({ username }).populate(
		"organizationId",
		"name slug isActive"
	)

	if (!user)
		return res
			.status(401)
			.json({ error: "Невалидно корисничко име или лозинка" })

	// ✅ USE BCRYPT TO COMPARE PASSWORDS
	const isPasswordValid = await bcrypt.compare(password, user.password)

	if (!isPasswordValid) {
		return res
			.status(401)
			.json({ error: "Невалидно корисничко име или лозинка" })
	}

	if (!user.organizationId.isActive) {
		return res.status(403).json({ error: "Организацијата е деактивирана" })
	}

	const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
		expiresIn: "3d",
	})

	res.cookie("token", token, {
		...cookieSettings,
	})

	try {
		await logAction(
			{ userId: user._id, organizationId: user.organizationId._id },
			{
				action: "Најава",
				entityType: "систем",
				entityId: user._id,
				details: {},
			}
		)
	} catch {}

	res.json({
		message: "Успешно најавување!",
		organization: {
			name: user.organizationId.name,
			slug: user.organizationId.slug,
		},
	})
})

router.get("/logout", async (req, res) => {
	try {
		res.clearCookie("token", {
			...cookieSettingsNoAge,
		})

		res.json({ message: "Успешна одјава од системот!" })
	} catch (err) {
		console.error("Logout error: " + err)
		res.status(500).json({ error: "Одјавата не беше успешна" })
	}
})

router.get("/session", async (req, res) => {
	const token = req.cookies?.token

	if (!token) {
		return res.json({ authenticated: false })
	}

	try {
		jwt.verify(token, process.env.JWT_SECRET)
		res.json({ authenticated: true })
	} catch (err) {
		res.json({ authenticated: false })
	}
})

router.get("/me", async (req, res) => {
	const token = req.cookies?.token

	if (!token) {
		return res.status(401).json({ error: "Не е пренесен токен" })
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		const user = await User.findById(decoded.id)
			.select("username role")
			.populate("organizationId", "name slug")

		if (!user) {
			return res.status(404).json({ error: "Корисникот не е пронајден" })
		}

		res.json({
			username: user.username,
			role: user.role,
			organization: {
				name: user.organizationId.name,
				slug: user.organizationId.slug,
			},
		})
	} catch (err) {
		return res.status(401).json({ error: "Невалиден токен" })
	}
})

module.exports = router
