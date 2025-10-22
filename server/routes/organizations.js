const express = require("express")
const router = express.Router()
const Organization = require("../models/Organization.js")
const User = require("../models/User.js")

// Middleware for superadmin only
const requireSuperAdmin = (req, res, next) => {
	if (req.userRole !== "superadmin") {
		return res
			.status(403)
			.json({ error: "Само суперадминистратори имаат пристап" })
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
			return res.status(400).json({ error: "Име и код се задолжителни" })
		}

		// Check if slug already exists
		const existing = await Organization.findOne({
			slug: slug.toLowerCase(),
		})
		if (existing) {
			return res
				.status(400)
				.json({ error: "Организација со овој код веќе постои" })
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
			return res.status(400).json({ error: "Име и код се задолжителни" })
		}

		// Check if slug is taken by another org
		const existing = await Organization.findOne({
			slug: slug.toLowerCase(),
			_id: { $ne: id },
		})
		if (existing) {
			return res
				.status(400)
				.json({ error: "Организација со овој код веќе постои" })
		}

		const organization = await Organization.findByIdAndUpdate(
			id,
			{
				name: name.trim(),
				slug: slug.toLowerCase().trim(),
				isActive: isActive !== undefined ? isActive : true,
			},
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

// DELETE organization (superadmin only)
router.delete("/:id", requireSuperAdmin, async (req, res) => {
	try {
		const { id } = req.params

		// Check if organization has users
		const userCount = await User.countDocuments({ organizationId: id })
		if (userCount > 0) {
			return res.status(400).json({
				error: `Не може да се избрише организација со ${userCount} корисници`,
			})
		}

		const organization = await Organization.findByIdAndDelete(id)

		if (!organization) {
			return res
				.status(404)
				.json({ error: "Организацијата не е пронајдена" })
		}

		res.json({ message: "Организацијата е избришана" })
	} catch (error) {
		console.error("Error deleting organization:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

module.exports = router
