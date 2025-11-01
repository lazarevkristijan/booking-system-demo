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
		res.status(500).json({ error: "Грешка во серверот" })
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
			return res.status(404).json({ error: "Услугата не е пронајдена" })
		}

		res.json(service)
	} catch (error) {
		console.error("Error fetching service:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// POST /api/services - Create new service
router.post("/", async (req, res) => {
	try {
		const { name, duration, price } = req.body
		if (!name || name.trim() === "") {
			return res.status(400).json({ error: "Името е задолжително" })
		}
		if (duration == null || isNaN(duration) || duration <= 0) {
			return res.status(400).json({
				error: "Траењето мора да биде валиден број поголем од 0",
			})
		}
		if (price == null || isNaN(price) || price < 0) {
			return res.status(400).json({
				error: "Цената мора да биде валиден број поголем или еднаков на 0",
			})
		}

		const organizationId = req.organizationId // From auth middleware
		if (!organizationId) {
			return res.status(400).json({
				error: "Идентификатор на организација е задолжителен",
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
				action: "Креирање",
				entityType: "Услуга",
				entityId: service._id,
				details: `Услуга: ${service.name}, Цена: ${service.price}ден., Траење: ${service.duration}мин.`,
			})
		} catch {}

		res.status(201).json(service)
	} catch (error) {
		console.error("Error creating service:", error)
		res.status(500).json({ error: "Грешка во серверот" })
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
				error: "Сите полиња за услугата се задолжителни",
			})
		}
		if (duration == null || isNaN(duration) || duration <= 0) {
			return res.status(400).json({
				error: "Траењето мора да биде валиден број поголем од 0",
			})
		}
		if (price == null || isNaN(price) || price < 0) {
			return res.status(400).json({
				error: "Цената мора да биде валиден број поголем или еднаков на 0",
			})
		}

		const prevService = await Service.findById(id)
		// SECURITY: Verify service belongs to user's organization
		if (!prevService) {
			return res.status(404).json({ error: "Услугата не е пронајдена" })
		}
		if (
			prevService.organizationId.toString() !==
			req.organizationId.toString()
		) {
			return res
				.status(403)
				.json({ error: "Немате пристап до оваа услуга" })
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
			return res.status(404).json({ error: "Услугата не е пронајдена" })
		}

		try {
			await logAction(req, {
				action: "Ажурирање",
				entityType: "Услуга",
				entityId: service._id,
				details: `Име: ${prevService.name}->${service.name}, Цена: ${prevService.price}->${service.price}ден., Траење: ${prevService.duration}->${service.duration}мин.`,
			})
		} catch {}

		res.json(service)
	} catch (error) {
		console.error("Error updating service:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// DELETE /api/services/:id - Soft delete service (mark as hidden)
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params

		const service = await Service.findOne({
			_id: id,
			organizationId: req.organizationId,
		})

		if (!service) {
			return res.status(404).json({ error: "Услугата не е пронајдена" })
		}

		// Check if service has active bookings
		const activeBookings = await Booking.countDocuments({
			services: id,
			end_time: { $gt: new Date() },
		})

		if (activeBookings > 0) {
			return res.status(400).json({
				error: "Услугата има активни резервации и не може да се избрише",
			})
		}

		await Service.findByIdAndUpdate(id, { isHidden: true }, { new: true })

		try {
			await logAction(req, {
				action: "Бришење",
				entityType: "Услуга",
				entityId: id,
				details: service.name,
			})
		} catch {}

		res.json({ message: "Услугата е успешно избришана" })
	} catch (error) {
		console.error("Error deleting service:", error)
		res.status(500).json({ error: "Грешка во серверот" })
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
			return res.status(404).json({ error: "Услугата не е пронајдена" })
		}

		try {
			await logAction(req, {
				action: "Враќање",
				entityType: "Услуга",
				entityId: id,
				details: service.name,
			})
		} catch {}

		res.json({ message: "Услугата е успешно вратена", service })
	} catch (error) {
		console.error("Error restoring service:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

module.exports = router
