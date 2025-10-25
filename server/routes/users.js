const express = require("express")
const router = express.Router()
const User = require("../models/User.js")
const { logAction } = require("../utils/logger.js")
const bcrypt = require("bcrypt")

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
	if (req.userRole !== "admin") {
		return res.status(403).json({
			error: req.t("errors.adminOnly"),
		})
	}
	next()
}

// GET /api/users - List all users in the organization (admin only)
router.get("/", requireAdmin, async (req, res) => {
	try {
		const organizationId = req.organizationId

		const users = await User.find({ organizationId })
			.select("-password")
			.populate("organizationId", "name slug")
			.sort({ createdAt: -1 })

		res.json(users)
	} catch (error) {
		console.error("Error fetching users:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// GET /api/users/:id - Get single user (admin only)
router.get("/:id", requireAdmin, async (req, res) => {
	try {
		const user = await User.findOne({
			_id: req.params.id,
			organizationId: req.organizationId,
		})
			.select("-password")
			.populate("organizationId", "name slug")

		if (!user) {
			return res.status(404).json({ error: req.t("errors.userNotFound") })
		}

		res.json(user)
	} catch (error) {
		console.error("Error fetching user:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// POST /api/users - Create new user (admin only)
router.post("/", requireAdmin, async (req, res) => {
	try {
		const { username, password, role } = req.body
		const organizationId = req.organizationId

		// Validation
		if (!username || username.trim() === "") {
			return res.status(400).json({
				error: req.t("validation.usernameRequired"),
			})
		}
		if (!password || password.length < 4) {
			return res.status(400).json({
				error: req.t("validation.passwordMinLength"),
			})
		}
		if (role && !["admin", "user"].includes(role)) {
			return res.status(400).json({
				error: req.t("validation.invalidRole"),
			})
		}

		// Check if username already exists
		const existingUser = await User.findOne({ username: username.trim() })
		if (existingUser) {
			return res.status(400).json({
				error: req.t("errors.usernameExists"),
			})
		}

		// Hash password (recommended for production)
		const hashedPassword = await bcrypt.hash(password, 10)

		const user = new User({
			username: username.trim(),
			password: hashedPassword,
			organizationId,
			role: role || "user",
		})

		await user.save()

		try {
			await logAction(req, {
				action: req.t("actions.create"),
				entityType: req.t("entities.user"),
				entityId: user._id,
				details: `${req.t("entities.user")}: ${user.username}, ${req.t(
					"entities.role"
				)}: ${user.role}`,
			})
		} catch {}

		// Return user without password
		const userResponse = user.toObject()
		delete userResponse.password

		res.status(201).json(userResponse)
	} catch (error) {
		console.error("Error creating user:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// PUT /api/users/:id - Update user (admin only)
router.put("/:id", requireAdmin, async (req, res) => {
	try {
		const { id } = req.params
		const { username, password, role } = req.body

		// Validation
		if (!username || username.trim() === "") {
			return res.status(400).json({
				error: req.t("validation.usernameRequired"),
			})
		}
		if (role && !["admin", "user"].includes(role)) {
			return res.status(400).json({
				error: req.t("validation.invalidRole"),
			})
		}

		// Verify user belongs to admin's organization
		const existingUser = await User.findOne({
			_id: id,
			organizationId: req.organizationId,
		})

		if (!existingUser) {
			return res.status(404).json({ error: req.t("errors.userNotFound") })
		}

		// Check if username is taken by another user
		if (existingUser.username !== username.trim()) {
			const duplicateUser = await User.findOne({
				username: username.trim(),
				_id: { $ne: id },
			})
			if (duplicateUser) {
				return res.status(400).json({
					error: req.t("errors.usernameExists"),
				})
			}
		}

		// Build update object
		const updateData = {
			username: username.trim(),
			role: role || existingUser.role,
		}

		// Only update password if provided
		if (password && password.length >= 4) {
			const hashedPassword = await bcrypt.hash(password, 10)
			updateData.password = hashedPassword
		}

		const user = await User.findByIdAndUpdate(id, updateData, {
			new: true,
			runValidators: true,
		}).select("-password")

		try {
			await logAction(req, {
				action: req.t("actions.update"),
				entityType: req.t("entities.user"),
				entityId: user._id,
				details: `${req.t("entities.user")}: ${
					existingUser.username
				}->${user.username}, ${req.t("entities.role")}: ${
					existingUser.role
				}->${user.role}`,
			})
		} catch {}

		res.json(user)
	} catch (error) {
		console.error("Error updating user:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// DELETE /api/users/:id - Delete user (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
	try {
		const { id } = req.params

		// Prevent self-deletion
		if (id === req.userId.toString()) {
			return res.status(400).json({
				error: req.t("errors.cannotDeleteSelf"),
			})
		}

		const user = await User.findOne({
			_id: id,
			organizationId: req.organizationId,
		})

		if (!user) {
			return res.status(404).json({ error: req.t("errors.userNotFound") })
		}

		await User.findByIdAndDelete(id)

		try {
			await logAction(req, {
				action: req.t("actions.delete"),
				entityType: req.t("entities.user"),
				entityId: id,
				details: `${req.t("entities.user")}: ${user.username}`,
			})
		} catch {}

		res.json({ message: req.t("success.userDeleted") })
	} catch (error) {
		console.error("Error deleting user:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

module.exports = router
