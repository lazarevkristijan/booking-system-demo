const express = require("express")
const router = express.Router()
const Organization = require("../models/Organization.js")
const User = require("../models/User.js")

// Middleware for superadmin only
const requireSuperAdmin = (req, res, next) => {
	if (req.userRole !== "superadmin") {
		return res.status(403).json({ error: "Само за супер администратори" })
	}
	next()
}

// GET all organizations (superadmin only)
router.get("/", requireSuperAdmin, async (req, res) => {
	try {
		const organizations = await Organization.find().sort({ name: 1 }).lean()

		// Get user count for each organization
		const orgsWithCounts = await Promise.all(
			organizations.map(async (org) => {
				const userCount = await User.countDocuments({
					organizationId: org._id,
				})
				return {
					...org,
					userCount,
				}
			})
		)

		res.json(orgsWithCounts)
	} catch (error) {
		console.error("Error fetching organizations:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// GET single organization (superadmin only)
router.get("/:id", requireSuperAdmin, async (req, res) => {
	try {
		const organization = await Organization.findById(req.params.id)

		if (!organization) {
			return res
				.status(404)
				.json({ error: "Организацијата не е пронајдена" })
		}

		res.json(organization)
	} catch (error) {
		console.error("Error fetching organization:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// POST create organization (superadmin only)
router.post("/", requireSuperAdmin, async (req, res) => {
	try {
		const { name, slug } = req.body

		if (!name || !slug) {
			return res
				.status(400)
				.json({ error: "Името и скратеницата се задолжителни" })
		}

		// Check if slug already exists
		const existing = await Organization.findOne({
			slug: slug.toLowerCase(),
		})
		if (existing) {
			return res
				.status(400)
				.json({ error: "Скратеницата на организацијата веќе постои" })
		}

		const organization = new Organization({
			name: name.trim(),
			slug: slug.toLowerCase().trim(),
			isActive: true,
		})
		await organization.save()

		res.status(201).json(organization)
	} catch (error) {
		console.error("Error creating organization:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// PUT update organization (superadmin only)
router.put("/:id", requireSuperAdmin, async (req, res) => {
	try {
		const { id } = req.params
		const { name, slug, isActive } = req.body

		if (!name || !slug) {
			return res
				.status(400)
				.json({ error: "Името и скратеницата се задолжителни" })
		}

		// Check if slug is taken by another org
		const existing = await Organization.findOne({
			slug: slug.toLowerCase(),
			_id: { $ne: id },
		})
		if (existing) {
			return res
				.status(400)
				.json({ error: "Скратеницата на организацијата веќе постои" })
		}

		const updateData = {
			name: name.trim(),
			slug: slug.toLowerCase().trim(),
			isActive: isActive !== undefined ? isActive : true,
		}

		const organization = await Organization.findByIdAndUpdate(
			id,
			updateData,
			{ new: true, runValidators: true }
		)

		if (!organization) {
			return res
				.status(404)
				.json({ error: "Организацијата не е пронајдена" })
		}

		res.json(organization)
	} catch (error) {
		console.error("Error updating organization:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// PATCH update organization settings (admin only - for their own org)
router.patch("/:id/settings", async (req, res) => {
	try {
		const { id } = req.params
		const { bookingInterval } = req.body

		if (bookingInterval && ![15, 30].includes(bookingInterval)) {
			return res.status(400).json({
				error: "Невалиден интервал за часови. Треба да биде 15 или 30 минути.",
			})
		}

		// Check if user is admin or superadmin
		if (req.userRole !== "admin" && req.userRole !== "superadmin") {
			return res.status(403).json({ error: "Само за администратори" })
		}

		// Verify the organization ID matches the user's organization
		// (unless they're a superadmin)
		if (
			req.userRole !== "superadmin" &&
			req.organizationId.toString() !== id
		) {
			return res.status(403).json({
				error: "Не можете да менувате друга организација",
			})
		}

		const updateData = {}
		if (bookingInterval !== undefined)
			updateData.bookingInterval = bookingInterval

		const organization = await Organization.findByIdAndUpdate(
			id,
			updateData,
			{ new: true, runValidators: true }
		)

		if (!organization) {
			return res
				.status(404)
				.json({ error: "Организацијата не е пронајдена" })
		}

		res.json(organization)
	} catch (error) {
		console.error("Error updating organization settings:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// DELETE organization (superadmin only)
router.delete("/:id", requireSuperAdmin, async (req, res) => {
	try {
		const { id } = req.params

		// Check if organization has users
		const userCount = await User.countDocuments({ organizationId: id })
		if (userCount > 0) {
			return res.status(400).json({
				error: `Организацијата има ${userCount} корисници и не може да се избрише`,
			})
		}

		const organization = await Organization.findByIdAndDelete(id)

		if (!organization) {
			return res
				.status(404)
				.json({ error: "Организацијата не е пронајдена" })
		}

		res.json({ message: "Организацијата е успешно избришана" })
	} catch (error) {
		console.error("Error deleting organization:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

module.exports = router
