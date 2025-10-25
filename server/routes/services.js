const express = require("express")
const router = express.Router()
const Service = require("../models/Service.js")
const Booking = require("../models/Booking.js")
const { logAction } = require("../utils/logger.js")

// GET /api/services - List only active if query parameter not provided
router.get("/", async (req, res) => {
	try {
		const { showHidden } = req.query
		const filter = showHidden === "true" ? {} : { isHidden: false }

		const organizationId = req.organizationId // From auth middleware
		if (!organizationId) {
			return res.status(400).json({
				error: "Идентификатор на организација е задолжителен",
			})
		}

		filter.organizationId = organizationId

		const services = await Service.aggregate([
			{ $match: filter },
			{
				$sort: {
					createdAt: -1, // newest first — change to 1 if you want oldest first
				},
			},
		])

		res.json(services)
	} catch (error) {
		console.error("Error fetching services:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// GET /api/services/:id - Get single service (even if hidden)
router.get("/:id", async (req, res) => {
	try {
		const service = await Service.findOne({
			_id: req.params.id,
			organizationId: req.organizationId,
		})

		if (!service) {
			return res
				.status(404)
				.json({ error: req.t("errors.serviceNotFound") })
		}

		res.json(service)
	} catch (error) {
		console.error("Error fetching service:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// POST /api/services - Create new service
router.post("/", async (req, res) => {
	try {
		const { name, duration, price } = req.body
		if (!name || name.trim() === "") {
			return res
				.status(400)
				.json({ error: req.t("validation.nameRequired") })
		}
		if (duration == null || isNaN(duration) || duration <= 0) {
			return res.status(400).json({
				error: req.t("validation.durationInvalid"),
			})
		}
		if (price == null || isNaN(price) || price < 0) {
			return res
				.status(400)
				.json({ error: req.t("validation.priceInvalid") })
		}

		const organizationId = req.organizationId // From auth middleware
		if (!organizationId) {
			return res.status(400).json({
				error: req.t("validation.organizationRequired"),
			})
		}
		const service = new Service({
			name: name.trim(),
			duration: parseInt(duration),
			price: parseFloat(price),
			organizationId,
		})

		await service.save()

		try {
			await logAction(req, {
				action: req.t("actions.create"),
				entityType: req.t("entities.service"),
				entityId: service._id,
				details: `${req.t("entities.service")}: ${
					service.name
				}, ${req.t("entities.price")}: ${service.price}${req.t(
					"common.currency"
				)}, ${req.t("entities.duration")}: ${service.duration}${req.t(
					"common.minutes"
				)}`,
			})
		} catch {}

		res.status(201).json(service)
	} catch (error) {
		console.error("Error creating service:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// PUT /api/services/:id - Update service
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params
		const { name, duration, price, isHidden } = req.body

		// Validation
		if (!name || name.trim() === "" || isHidden === undefined) {
			return res.status(400).json({
				error: req.t("validation.serviceFieldsRequired"),
			})
		}
		if (duration == null || isNaN(duration) || duration <= 0) {
			return res.status(400).json({
				error: req.t("validation.durationInvalid"),
			})
		}
		if (price == null || isNaN(price) || price < 0) {
			return res
				.status(400)
				.json({ error: req.t("validation.priceInvalid") })
		}

		const prevService = await Service.findById(id)
		// SECURITY: Verify service belongs to user's organization
		if (!prevService) {
			return res
				.status(404)
				.json({ error: req.t("errors.serviceNotFound") })
		}
		if (
			prevService.organizationId.toString() !==
			req.organizationId.toString()
		) {
			return res
				.status(403)
				.json({ error: req.t("errors.noAccessToService") })
		}

		const service = await Service.findByIdAndUpdate(
			id,
			{
				name: name.trim(),
				duration: parseInt(duration),
				price: parseFloat(price),
			},
			{ new: true, runValidators: true }
		)

		if (!service) {
			return res
				.status(404)
				.json({ error: req.t("errors.serviceNotFound") })
		}

		try {
			await logAction(req, {
				action: req.t("actions.update"),
				entityType: req.t("entities.service"),
				entityId: service._id,
				details: `${req.t("entities.name")}: ${prevService.name}->${
					service.name
				}, ${req.t("entities.price")}: ${prevService.price}->${
					service.price
				}${req.t("common.currency")}, ${req.t("entities.duration")}: ${
					prevService.duration
				}->${service.duration}${req.t("common.minutes")}`,
			})
		} catch {}

		res.json(service)
	} catch (error) {
		console.error("Error updating service:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// DELETE /api/services/:id - Soft delete service (mark as hidden)
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params

		const service = await Employee.findOne({
			_id: id,
			organizationId: req.organizationId,
		})

		if (!service) {
			return res
				.status(404)
				.json({ error: req.t("errors.serviceNotFound") })
		}

		// Check if service has active bookings
		const activeBookings = await Booking.countDocuments({
			services: id,
			end_time: { $gt: new Date() },
		})

		if (activeBookings > 0) {
			return res.status(400).json({
				error: req.t("errors.serviceHasBookings"),
			})
		}

		await Service.findByIdAndUpdate(id, { isHidden: true }, { new: true })

		try {
			await logAction(req, {
				action: req.t("actions.delete"),
				entityType: req.t("entities.service"),
				entityId: id,
				details: service.name,
			})
		} catch {}

		res.json({ message: req.t("success.serviceDeleted") })
	} catch (error) {
		console.error("Error deleting service:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// PATCH /api/services/:id/restore - Restore hidden service
router.patch("/:id/restore", async (req, res) => {
	try {
		const { id } = req.params

		const service = await Service.findByIdAndUpdate(
			{ _id: id, organizationId: req.organizationId },
			{ isHidden: false },
			{ new: true }
		)

		if (!service) {
			return res
				.status(404)
				.json({ error: req.t("errors.serviceNotFound") })
		}

		try {
			await logAction(req, {
				action: req.t("actions.restore"),
				entityType: req.t("entities.service"),
				entityId: id,
				details: service.name,
			})
		} catch {}

		res.json({ message: req.t("success.serviceRestored"), service })
	} catch (error) {
		console.error("Error restoring service:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

module.exports = router
