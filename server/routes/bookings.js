const express = require("express")
const router = express.Router()
const Booking = require("../models/Booking.js")
const Service = require("../models/Service.js")
const { logAction } = require("../utils/logger.js")

// GET /api/bookings - List all bookings with related data
router.get("/", async (req, res) => {
	try {
		const { start_date, end_date, month, year } = req.query
		let query = {}
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
		res.status(500).json({ error: "Грешка в сървъра" })
	}
})

// GET /api/bookings/:id - Get single booking
router.get("/:id", async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.id)
			.populate("employee_id", "name")
			.populate("client_id", "full_name phone")
			.populate("services", "name duration price")

		if (!booking) {
			return res.status(404).json({ error: "Резервацията не е намерена" })
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
		res.status(500).json({ error: "Грешка в сървъра" })
	}
})

// POST /api/bookings - Create new booking with multiple services
router.post("/", async (req, res) => {
	try {
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
				error: "employee_id, client_id, start_time, end_time, and service_ids са задължителни",
			})
		}

		// Check for overlapping bookings
		const overlappingBooking = await Booking.findOne({
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
				.json({ error: "Служителя не е свободен по това време" })
		}

		// Create booking
		const booking = new Booking({
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
				action: "създаване",
				entityType: "час",
				entityId: booking._id,
				details: `клиент: ${formattedBooking.client.name}, тел: ${
					formattedBooking.client.phone
				} служител: ${
					formattedBooking.employee.name
				} час:${formattedBooking.startTime.toLocaleString("bg-BG")}`,
			})
		} catch {}

		res.status(201).json(formattedBooking)
	} catch (error) {
		console.error("Error creating booking:", error)
		res.status(500).json({ error: "Грешка в сървъра" })
	}
})

// // PUT /api/bookings/:id - Update booking
// router.put("/:id", async (req, res) => {
// 	try {
// 		const { id } = req.params
// 		const {
// 			employee_id,
// 			client_id,
// 			start_time,
// 			end_time,
// 			service_ids,
// 			price,
// 			notes,
// 		} = req.body

// 		// Check if booking exists
// 		const existingBooking = await Booking.findById(id)
// 		if (!existingBooking) {
// 			return res.status(404).json({ error: "Резервацията не е наемрена" })
// 		}

// 		// Check for overlapping bookings (excluding current booking)
// 		if (employee_id && start_time && end_time) {
// 			const overlappingBooking = await Booking.findOne({
// 				_id: { $ne: id },
// 				employee_id,
// 				$or: [
// 					{
// 						start_time: { $lt: new Date(end_time) },
// 						end_time: { $gt: new Date(start_time) },
// 					},
// 					{
// 						start_time: {
// 							$gte: new Date(start_time),
// 							$lt: new Date(end_time),
// 						},
// 					},
// 				],
// 			})

// 			if (overlappingBooking) {
// 				return res
// 					.status(400)
// 					.json({ error: "Служителя не е свободен по това време" })
// 			}
// 		}

// 		// Calculate total price if services changed but price not provided
// 		let totalPrice = price
// 		if (!totalPrice && service_ids && Array.isArray(service_ids)) {
// 			const services = await Service.find({ _id: { $in: service_ids } })
// 			totalPrice = services.reduce(
// 				(sum, service) => sum + service.price,
// 				0
// 			)
// 		}

// 		// Prepare update object
// 		const updateData = {}
// 		if (employee_id) updateData.employee_id = employee_id
// 		if (client_id) updateData.client_id = client_id
// 		if (start_time) updateData.start_time = new Date(start_time)
// 		if (end_time) updateData.end_time = new Date(end_time)
// 		if (service_ids) updateData.services = service_ids
// 		if (totalPrice !== undefined) updateData.price = totalPrice
// 		if (notes !== undefined) updateData.notes = notes

// 		const prevBooking = await Booking.findById(id)
// 			.populate("employee_id", "name")
// 			.populate("client_id", "full_name phone")
// 			.populate("services", "name duration price")

// 		// Update booking
// 		const booking = await Booking.findByIdAndUpdate(id, updateData, {
// 			new: true,
// 			runValidators: true,
// 		})
// 			.populate("employee_id", "name")
// 			.populate("client_id", "full_name phone")
// 			.populate("services", "name duration price")

// 		const formattedBooking = {
// 			id: booking._id,
// 			startTime: booking.start_time,
// 			endTime: booking.end_time,
// 			price: booking.price,
// 			notes: booking.notes,
// 			employee: {
// 				id: booking.employee_id._id,
// 				name: booking.employee_id.name,
// 			},
// 			client: {
// 				id: booking.client_id._id,
// 				name: booking.client_id.full_name,
// 				phone: booking.client_id.phone,
// 			},
// 			services: booking.services,
// 			created_at: booking.createdAt,
// 			updated_at: booking.updatedAt,
// 		}

// 		try {
// 			await logAction(req, {
// 				action: "редактиране",
// 				entityType: "час",
// 				entityId: booking._id,
// 				details: `клиент: ${formattedBooking.client.name}, служител: ${formattedBooking.employee.name}, за: ${formattedBooking.startTime}`,
// 			})
// 		} catch {}

// 		res.json(formattedBooking)
// 	} catch (error) {
// 		console.error("Error updating booking:", error)
// 		res.status(500).json({ error: "Грешка в сървъра" })
// 	}
// })

// DELETE /api/bookings/:id - Delete booking
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params

		const prevBooking = await Booking.findById(id)
			.populate("employee_id", "name")
			.populate("client_id", "full_name phone")
			.populate("services", "name duration price")

		if (!prevBooking) {
			return res.status(404).json({ error: "Резервацията не е намерена" })
		}

		const booking = await Booking.findByIdAndDelete(id)

		try {
			await logAction(req, {
				action: "изтриване",
				entityType: "час",
				entityId: id,
				details: `клиент: ${prevBooking.client_id.full_name}, тел: ${
					prevBooking.client_id.phone
				}, служител: ${
					prevBooking.employee_id.name
				}, час: ${prevBooking.start_time.toLocaleString("bg-BG")}`,
			})
		} catch {}

		res.json({ message: "Резервацията е изтрита" })
	} catch (error) {
		console.error("Error deleting booking:", error)
		res.status(500).json({ error: "Грешка в сървъра" })
	}
})

module.exports = router
