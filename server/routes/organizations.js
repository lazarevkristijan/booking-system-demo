const express = require("express")
const router = express.Router()
const Organization = require("../models/Organization.js")
const User = require("../models/User.js")

// Middleware for superadmin only
const requireSuperAdmin = (req, res, next) => {
	if (req.userRole !== "superadmin") {
		return res.status(403).json({ error: req.t("errors.superadminOnly") })
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
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// GET single organization (superadmin only)
router.get("/:id", requireSuperAdmin, async (req, res) => {
	try {
		const organization = await Organization.findById(req.params.id)

		if (!organization) {
			return res
				.status(404)
				.json({ error: req.t("errors.organizationNotFound") })
		}

		res.json(organization)
	} catch (error) {
		console.error("Error fetching organization:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// POST create organization (superadmin only)
router.post("/", requireSuperAdmin, async (req, res) => {
	try {
		const { name, slug, timezone } = req.body

		if (!name || !slug) {
			return res
				.status(400)
				.json({ error: req.t("errors.nameAndSlugRequired") })
		}

		if (timezone) {
			const validTimezones = Intl.supportedValuesOf("timeZone")
			if (!validTimezones.includes(timezone)) {
				return res.status(400).json({
					error: "Invalid timezone provided",
				})
			}
		}

		// Check if slug already exists
		const existing = await Organization.findOne({
			slug: slug.toLowerCase(),
		})
		if (existing) {
			return res
				.status(400)
				.json({ error: req.t("errors.organizationSlugExists") })
		}

		const organization = new Organization({
			name: name.trim(),
			slug: slug.toLowerCase().trim(),
			isActive: true,
			...(timezone && { timezone }),
		})
		await organization.save()

		res.status(201).json(organization)
	} catch (error) {
		console.error("Error creating organization:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// PUT update organization (superadmin only)
router.put("/:id", requireSuperAdmin, async (req, res) => {
	try {
		const { id } = req.params
		const { name, slug, isActive, timezone } = req.body

		if (!name || !slug) {
			return res
				.status(400)
				.json({ error: req.t("errors.nameAndSlugRequired") })
		}

		if (timezone) {
			const validTimezones = Intl.supportedValuesOf("timeZone")
			if (!validTimezones.includes(timezone)) {
				return res.status(400).json({
					error: "Invalid timezone provided",
				})
			}
		}

		// Check if slug is taken by another org
		const existing = await Organization.findOne({
			slug: slug.toLowerCase(),
			_id: { $ne: id },
		})
		if (existing) {
			return res
				.status(400)
				.json({ error: req.t("errors.organizationSlugExists") })
		}

		const updateData = {
			name: name.trim(),
			slug: slug.toLowerCase().trim(),
			isActive: isActive !== undefined ? isActive : true,
		}

		// Only update timezone if provided
		if (timezone !== undefined) {
			updateData.timezone = timezone
		}

		const organization = await Organization.findByIdAndUpdate(
			id,
			updateData,
			{ new: true, runValidators: true }
		)

		if (!organization) {
			return res
				.status(404)
				.json({ error: req.t("errors.organizationNotFound") })
		}

		res.json(organization)
	} catch (error) {
		console.error("Error updating organization:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// PATCH update organization settings (admin only - for their own org)
router.patch("/:id/settings", async (req, res) => {
	try {
		const { id } = req.params
		const { timezone } = req.body

		// Check if user is admin or superadmin
		if (req.userRole !== "admin" && req.userRole !== "superadmin") {
			return res.status(403).json({ error: req.t("errors.adminOnly") })
		}

		// Verify the organization ID matches the user's organization
		// (unless they're a superadmin)
		if (
			req.userRole !== "superadmin" &&
			req.organizationId.toString() !== id
		) {
			return res
				.status(403)
				.json({ error: req.t("errors.cannotModifyOtherOrganization") })
		}

		// Validate timezone if provided
		if (timezone) {
			const validTimezones = Intl.supportedValuesOf("timeZone")
			if (!validTimezones.includes(timezone)) {
				return res.status(400).json({
					error: "Invalid timezone provided",
				})
			}
		}

		const updateData = {}
		if (timezone !== undefined) {
			updateData.timezone = timezone
		}

		const organization = await Organization.findByIdAndUpdate(
			id,
			updateData,
			{ new: true, runValidators: true }
		)

		if (!organization) {
			return res
				.status(404)
				.json({ error: req.t("errors.organizationNotFound") })
		}

		res.json(organization)
	} catch (error) {
		console.error("Error updating organization settings:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
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
				error: req.t("errors.organizationHasUsers", {
					count: userCount,
				}),
			})
		}

		const organization = await Organization.findByIdAndDelete(id)

		if (!organization) {
			return res
				.status(404)
				.json({ error: req.t("errors.organizationNotFound") })
		}

		res.json({ message: req.t("success.organizationDeleted") })
	} catch (error) {
		console.error("Error deleting organization:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

module.exports = router
