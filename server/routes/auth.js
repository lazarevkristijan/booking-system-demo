const express = require("express")
const router = express.Router()
const User = require("../models/User.js")
const jwt = require("jsonwebtoken")
const { cookieSettings, cookieSettingsNoAge } = require("../constants.js")
const { logAction } = require("../utils/logger.js")

router.post("/login", async (req, res) => {
	const { username, password } = req.body
	const user = await User.findOne({ username })

	if (!user)
		return res
			.status(401)
			.json({ error: "Невалидно потребителско име или парола" })

	if (password != user.password)
		return res
			.status(401)
			.json({ error: "Невалидно потребителско име или парола" })

	const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
		expiresIn: "3d",
	})

	res.cookie("token", token, {
		...cookieSettings,
	})

	try {
		await logAction(
			{ userId: user._id },
			{
				action: "вход",
				entityType: "система",
				entityId: user._id,
				details: {},
			}
		)
	} catch {}

	res.json({ message: "Logged in successfully!" })
})

router.get("/logout", async (req, res) => {
	try {
		res.clearCookie("token", {
			...cookieSettingsNoAge,
		})

		res.json({ message: "Успешен изход от системата!" })
	} catch (err) {
		console.error("Logout eror: " + err)
		res.status(500).json({ error: "Изхода от системата не беше успешен" })
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

module.exports = router

router.get("/me", async (req, res) => {
	const token = req.cookies?.token

	if (!token) {
		return res.status(401).json({ error: "No token provided" })
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		const user = await User.findById(decoded.id).select("username")

		if (!user) {
			return res.status(404).json({ error: "User not found" })
		}

		res.json({ username: user.username })
	} catch (err) {
		return res.status(401).json({ error: "Invalid token" })
	}
})
