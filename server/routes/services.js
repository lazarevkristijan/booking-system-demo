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
		const service = await Service.findById(req.params.id)

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

		// Validation
		if (!name || name.trim() === "") {
			return res
				.status(400)
				.json({ error: "Полето за име е задолжително" })
		}
		if (duration == null || isNaN(duration) || duration <= 0) {
			return res.status(400).json({
				error: "Времетраењето треба да биде број во минути",
			})
		}
		if (price == null || isNaN(price) || price < 0) {
			return res
				.status(400)
				.json({ error: "Цената треба да биде број во денари" })
		}

		const service = new Service({
			name: name.trim(),
			duration: parseInt(duration),
			price: parseFloat(price),
		})

		await service.save()

		try {
			await logAction(req, {
				action: "Креирање",
				entityType: "услуга",
				entityId: service._id,
				details: `услуга: ${service.name}, цена: ${service.price}ден, време: ${service.duration}мин`,
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
				error: "Полињата за име и за активност на услугата се задолжителни",
			})
		}
		if (duration == null || isNaN(duration) || duration <= 0) {
			return res.status(400).json({
				error: "Времетраењето треба да биде број и најмалку 1 мин.",
			})
		}
		if (price == null || isNaN(price) || price < 0) {
			return res
				.status(400)
				.json({ error: "Цената треба да биде број и најмалку 1 ден." })
		}

		const prevService = await Service.findById(id)

		const service = await Service.findByIdAndUpdate(
			id,
			{
				name: name.trim(),
				duration: parseInt(duration),
				price: parseFloat(price),
				isHidden,
			},
			{ new: true, runValidators: true }
		)

		if (!service) {
			return res.status(404).json({ error: "Услугата не е пронајдена" })
		}

		try {
			await logAction(req, {
				action: "Уредување",
				entityType: "услуга",
				entityId: service._id,
				details: `име: ${prevService.name}->${service.name}, цена: ${prevService.price}->${service.price}ден, време: ${prevService.duration}->${service.duration}мин`,
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

		// Check if service has active bookings
		const activeBookings = await Booking.countDocuments({
			services: id,
			end_time: { $gt: new Date() },
		})

		if (activeBookings > 0) {
			return res.status(400).json({
				error: "Не може да се избрише услуга со претстојни резервации",
			})
		}

		const service = await Service.findByIdAndUpdate(
			id,
			{ isHidden: true },
			{ new: true }
		)

		if (!service) {
			return res.status(404).json({ error: "Услугата не е пронајдена" })
		}

		try {
			await logAction(req, {
				action: "Бришење",
				entityType: "услуга",
				entityId: id,
				details: service.name,
			})
		} catch {}

		res.json({ message: "Услугата е избришана" })
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
			id,
			{ isHidden: false },
			{ new: true }
		)

		if (!service) {
			return res.status(404).json({ error: "Услугата не е пронајдена" })
		}

		try {
			await logAction(req, {
				action: "Враќање",
				entityType: "услуга",
				entityId: id,
				details: service.name,
			})
		} catch {}

		res.json({ message: "Услугата е вратена: ", service })
	} catch (error) {
		console.error("Error restoring service:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

module.exports = router
