const express = require("express")
const router = express.Router()
const Booking = require("../models/Booking.js")
const Service = require("../models/Service.js")
const { logAction } = require("../utils/logger.js")

// GET /api/bookings - List all bookings with related data
router.get("/", async (req, res) => {
	try {
		const { start_date, end_date, month, year } = req.query
		const organizationId = req.organizationId // From auth middleware

		let query = { organizationId }
		let bookings = []

		if (start_date && end_date) {
			query.start_time = {
				$gte: new Date(start_date),
				$lte: new Date(end_date),
			}
		}

		if (month && year) {
			query.start_time = {
				$gte: new Date(year, month - 1, 1),
				$lte: new Date(year, month, 0, 23, 59, 59),
			}
		}

		bookings = await Booking.find(query)
			.populate("employee_id", "name")
			.populate("client_id", "full_name phone notes")
			.populate("services", "name duration price")
			.sort({ start_time: 1 })

		const formattedBookings = bookings.map((booking) => ({
			_id: booking._id,
			startTime: booking.start_time,
			endTime: booking.end_time,
			price: booking.price,
			notes: booking.notes,
			employee: {
				_id: booking.employee_id._id,
				name: booking.employee_id.name,
			},
			client: {
				_id: booking.client_id._id,
				name: booking.client_id.full_name,
				phone: booking.client_id.phone,
				notes: booking.client_id.notes,
			},
			services: booking.services,
			created_at: booking.createdAt,
			updated_at: booking.updatedAt,
		}))

		res.json(formattedBookings)
	} catch (error) {
		console.error("Error fetching bookings:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// GET /api/bookings/:id - Get single booking
router.get("/:id", async (req, res) => {
	try {
		const booking = await Booking.findOne({
			_id: req.params.id,
			organizationId: req.organizationId,
		})
			.populate("employee_id", "name")
			.populate("client_id", "full_name phone")
			.populate("services", "name duration price")

		if (!booking) {
			return res
				.status(404)
				.json({ error: "Резервацијата не е пронајдена" })
		}

		const formattedBooking = {
			id: booking._id,
			startTime: booking.start_time,
			endTime: booking.end_time,
			price: booking.price,
			notes: booking.notes,
			employee: {
				id: booking.employee_id._id,
				name: booking.employee_id.name,
			},
			client: {
				id: booking.client_id._id,
				name: booking.client_id.full_name,
				phone: booking.client_id.phone,
			},
			services: booking.services,
			created_at: booking.createdAt,
			updated_at: booking.updatedAt,
		}

		res.json(formattedBooking)
	} catch (error) {
		console.error("Error fetching booking:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// POST /api/bookings - Create new booking with multiple services
router.post("/", async (req, res) => {
	try {
		const organizationId = req.organizationId // From auth middleware

		const {
			employee_id,
			client_id,
			start_time,
			end_time,
			service_ids,
			total_price,
			notes,
		} = req.body

		// Validation
		if (
			!employee_id ||
			!client_id ||
			!start_time ||
			!end_time ||
			!service_ids ||
			!Array.isArray(service_ids) ||
			service_ids.length === 0
		) {
			return res.status(400).json({
				error: "employee_id, client_id, start_time, end_time и service_ids се задолжителни",
			})
		}

		// Check for overlapping bookings
		const overlappingBooking = await Booking.findOne({
			organizationId, // FILTER BY ORGANIZATION
			employee_id,
			$or: [
				{
					start_time: { $lt: new Date(end_time) },
					end_time: { $gt: new Date(start_time) },
				},
				{
					start_time: {
						$gte: new Date(start_time),
						$lt: new Date(end_time),
					},
				},
			],
		})

		if (overlappingBooking) {
			return res
				.status(400)
				.json({ error: "Служителот не е слободен во ова време" })
		}

		// Create booking
		const booking = new Booking({
			organizationId,
			employee_id,
			client_id,
			start_time: new Date(start_time),
			end_time: new Date(end_time),
			services: service_ids,
			price: total_price,
			notes: notes || "",
		})

		await booking.save()

		// Populate the booking with related data
		await booking.populate("employee_id", "name")
		await booking.populate("client_id", "full_name phone")
		await booking.populate("services", "name duration price")

		const formattedBooking = {
			id: booking._id,
			startTime: booking.start_time,
			endTime: booking.end_time,
			price: booking.price,
			notes: booking.notes,
			employee: {
				id: booking.employee_id._id,
				name: booking.employee_id.name,
			},
			client: {
				id: booking.client_id._id,
				name: booking.client_id.full_name,
				phone: booking.client_id.phone,
			},
			services: booking.services,
			created_at: booking.createdAt,
			updated_at: booking.updatedAt,
		}

		try {
			await logAction(req, {
				action: "Креирање",
				entityType: "термин",
				entityId: booking._id,
				details: `клиент: ${formattedBooking.client.name}, тел: ${
					formattedBooking.client.phone
				} служител: ${
					formattedBooking.employee.name
				} термин:${formattedBooking.startTime.toLocaleString("mk-MK")}`,
			})
		} catch {}

		res.status(201).json(formattedBooking)
	} catch (error) {
		console.error("Error creating booking:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// DELETE /api/bookings/:id - Delete booking
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params

		const prevBooking = await Booking.findOne({
			_id: id,
			organizationId: req.organizationId,
		})
			.populate("employee_id", "name")
			.populate("client_id", "full_name phone")
			.populate("services", "name duration price")

		if (!prevBooking) {
			return res
				.status(404)
				.json({ error: "Резервацијата не е пронајдена" })
		}

		const booking = await Booking.findByIdAndDelete(id)

		try {
			await logAction(req, {
				action: "Бришење",
				entityType: "термин",
				entityId: id,
				details: `клиент: ${prevBooking.client_id.full_name}, тел: ${
					prevBooking.client_id.phone
				}, служител: ${
					prevBooking.employee_id.name
				}, термин: ${prevBooking.start_time.toLocaleString("mk-MK")}`,
			})
		} catch {}

		res.json({ message: "Резервацијата е избришана" })
	} catch (error) {
		console.error("Error deleting booking:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

module.exports = router
