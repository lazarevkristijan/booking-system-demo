const express = require("express")
const router = express.Router()
const User = require("../models/User.js")
const Organization = require("../models/Organization.js")
const bcrypt = require("bcrypt")
const { logAction } = require("../utils/logger.js")

// Middleware for superadmin only
const requireSuperAdmin = (req, res, next) => {
	if (req.userRole !== "superadmin") {
		return res.status(403).json({ error: "Само за супер администратори" })
	}
	next()
}

// GET all users across all organizations
router.get("/users", requireSuperAdmin, async (req, res) => {
	try {
		const { organizationId, page = 1, limit = 50 } = req.query

		let query = {}
		if (organizationId) {
			query.organizationId = organizationId
		}

		const pageNum = Math.max(parseInt(page), 1)
		const limitNum = Math.min(Math.max(parseInt(limit), 1), 100)
		const skip = (pageNum - 1) * limitNum

		const [users, total] = await Promise.all([
			User.find(query)
				.select("-password")
				.populate("organizationId", "name slug")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limitNum)
				.lean(),
			User.countDocuments(query),
		])

		res.json({
			users,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total,
				totalPages: Math.ceil(total / limitNum),
				hasMore: pageNum * limitNum < total,
			},
		})
	} catch (error) {
		console.error("Error fetching users:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// POST create user in any organization
router.post("/users", requireSuperAdmin, async (req, res) => {
	try {
		const { username, password, role, organizationId } = req.body

		// Validation
		if (!username || username.trim() === "") {
			return res
				.status(400)
				.json({ error: "Корисничко име е задолжително" })
		}
		if (!password || password.length < 4) {
			return res
				.status(400)
				.json({ error: "Лозинката мора да има најмалку 4 знаци" })
		}
		if (role && !["superadmin", "admin", "user"].includes(role)) {
			return res.status(400).json({ error: "Невалидна улога" })
		}
		if (role !== "superadmin" && !organizationId) {
			return res.status(400).json({
				error: "Организација е задолжителна за корисници кои не се супер администратори",
			})
		}

		// Check if username exists
		const existingUser = await User.findOne({ username: username.trim() })
		if (existingUser) {
			return res
				.status(400)
				.json({ error: "Корисничкото име веќе постои" })
		}

		// Verify organization exists
		if (organizationId) {
			const org = await Organization.findById(organizationId)
			if (!org) {
				return res
					.status(404)
					.json({ error: "Организацијата не е пронајдена" })
			}
		}

		const hashedPassword = await bcrypt.hash(password, 10)

		const user = new User({
			username: username.trim(),
			password: hashedPassword,
			organizationId: role === "superadmin" ? null : organizationId,
			role: role || "user",
		})

		await user.save()

		const userResponse = await User.findById(user._id)
			.select("-password")
			.populate("organizationId", "name slug")

		res.status(201).json(userResponse)
	} catch (error) {
		console.error("Error creating user:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// PUT update any user
router.put("/users/:id", requireSuperAdmin, async (req, res) => {
	try {
		const { id } = req.params
		const { username, password, role, organizationId } = req.body

		const existingUser = await User.findById(id)
		if (!existingUser) {
			return res.status(404).json({ error: "Корисникот не е пронајден" })
		}

		// Check username uniqueness
		if (username && existingUser.username !== username.trim()) {
			const duplicate = await User.findOne({
				username: username.trim(),
				_id: { $ne: id },
			})
			if (duplicate) {
				return res
					.status(400)
					.json({ error: "Корисничкото име веќе постои" })
			}
		}

		const updateData = {
			username: username ? username.trim() : existingUser.username,
			role: role || existingUser.role,
			organizationId:
				role === "superadmin"
					? null
					: organizationId || existingUser.organizationId,
		}

		if (password && password.length >= 4) {
			updateData.password = await bcrypt.hash(password, 10)
		}

		const user = await User.findByIdAndUpdate(id, updateData, {
			new: true,
			runValidators: true,
		})
			.select("-password")
			.populate("organizationId", "name slug")

		res.json(user)
	} catch (error) {
		console.error("Error updating user:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// DELETE any user
router.delete("/users/:id", requireSuperAdmin, async (req, res) => {
	try {
		const { id } = req.params

		// Prevent deleting yourself
		if (id === req.userId.toString()) {
			return res
				.status(400)
				.json({ error: "Не можете да се избришете себеси" })
		}

		const user = await User.findByIdAndDelete(id)
		if (!user) {
			return res.status(404).json({ error: "Корисникот не е пронајден" })
		}

		res.json({ message: "Корисникот е успешно избришан" })
	} catch (error) {
		console.error("Error deleting user:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

module.exports = router
