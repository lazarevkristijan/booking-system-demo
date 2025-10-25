const express = require("express")
const router = express.Router()
const Booking = require("../models/Booking.js")
const Organization = require("../models/Organization.js")
const { logAction } = require("../utils/logger.js")
const {
	convertOrgTimezoneToUTC,
	convertUTCToOrgTimezone,
} = require("../utils/timezone.js")

// GET /api/bookings - List all bookings with related data
router.get("/", async (req, res) => {
	try {
		const { start_date, end_date, month, year } = req.query
		const organizationId = req.organizationId // From auth middleware

		const organization = await Organization.findById(organizationId)
		const timezone = organization?.timezone || "UTC"

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
			startTime: convertUTCToOrgTimezone(booking.start_time, timezone),
			endTime: convertUTCToOrgTimezone(booking.end_time, timezone),
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
			created_at: convertUTCToOrgTimezone(booking.createdAt, timezone),
			updated_at: convertUTCToOrgTimezone(booking.updatedAt, timezone),
		}))

		res.json(formattedBookings)
	} catch (error) {
		console.error("Error fetching bookings:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// GET /api/bookings/:id - Get single booking
router.get("/:id", async (req, res) => {
	try {
		const organizationId = req.organizationId

		// Get organization timezone
		const organization = await Organization.findById(organizationId)
		const timezone = organization?.timezone || "UTC"

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
				.json({ error: req.t("errors.bookingNotFound") })
		}

		const formattedBooking = {
			id: booking._id,
			startTime: convertUTCToOrgTimezone(booking.start_time, timezone),
			endTime: convertUTCToOrgTimezone(booking.end_time, timezone),
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
			created_at: convertUTCToOrgTimezone(booking.createdAt, timezone),
			updated_at: convertUTCToOrgTimezone(booking.updatedAt, timezone),
		}

		res.json(formattedBooking)
	} catch (error) {
		console.error("Error fetching booking:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// POST /api/bookings - Create new booking with multiple services
router.post("/", async (req, res) => {
	try {
		const organizationId = req.organizationId // From auth middleware

		// Get organization timezone
		const organization = await Organization.findById(organizationId)
		const timezone = organization?.timezone || "UTC"

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
				error: req.t("validation.bookingFieldsRequired"),
			})
		}

		// Convert incoming times from organization timezone to UTC
		const startTimeUTC = convertOrgTimezoneToUTC(start_time, timezone)
		const endTimeUTC = convertOrgTimezoneToUTC(end_time, timezone)

		// Check for overlapping bookings
		const overlappingBooking = await Booking.findOne({
			organizationId, // FILTER BY ORGANIZATION
			employee_id,
			$or: [
				{
					start_time: { $lt: endTimeUTC },
					end_time: { $gt: startTimeUTC },
				},
				{
					start_time: {
						$gte: startTimeUTC,
						$lt: endTimeUTC,
					},
				},
			],
		})

		if (overlappingBooking) {
			return res
				.status(400)
				.json({ error: req.t("errors.employeeNotAvailable") })
		}

		// Check for overlapping bookings - CLIENT
		const overlappingClientBooking = await Booking.findOne({
			organizationId,
			client_id,
			$or: [
				{
					start_time: { $lt: endTimeUTC },
					end_time: { $gt: startTimeUTC },
				},
				{
					start_time: {
						$gte: startTimeUTC,
						$lt: endTimeUTC,
					},
				},
			],
		})

		if (overlappingClientBooking) {
			return res
				.status(400)
				.json({ error: req.t("errors.clientHasBooking") })
		}

		// Create booking with UTC times
		const booking = new Booking({
			organizationId,
			employee_id,
			client_id,
			start_time: startTimeUTC,
			end_time: endTimeUTC,
			services: service_ids,
			price: total_price,
			notes: notes || "",
		})

		await booking.save()

		// Populate the booking with related data
		await booking.populate("employee_id", "name")
		await booking.populate("client_id", "full_name phone")
		await booking.populate("services", "name duration price")

		// Return with times converted back to organization timezone
		const formattedBooking = {
			id: booking._id,
			startTime: convertUTCToOrgTimezone(booking.start_time, timezone),
			endTime: convertUTCToOrgTimezone(booking.end_time, timezone),
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
			created_at: convertUTCToOrgTimezone(booking.createdAt, timezone),
			updated_at: convertUTCToOrgTimezone(booking.updatedAt, timezone),
		}

		try {
			await logAction(req, {
				action: req.t("actions.create"),
				entityType: req.t("entities.booking"),
				entityId: booking._id,
				details: `${req.t("entities.client")}: ${
					formattedBooking.client.name
				}, ${req.t("entities.phone")}: ${
					formattedBooking.client.phone
				} ${req.t("entities.employee")}: ${
					formattedBooking.employee.name
				} ${req.t(
					"entities.appointment"
				)}:${formattedBooking.startTime.toLocaleString(
					req.t("common.locale")
				)}`,
			})
		} catch {}

		res.status(201).json(formattedBooking)
	} catch (error) {
		console.error("Error creating booking:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// PUT /api/bookings/:id - Update/Move existing booking
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params
		const organizationId = req.organizationId // From auth middleware

		// Get organization timezone
		const organization = await Organization.findById(organizationId)
		const timezone = organization?.timezone || "UTC"

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
				error: req.t("validation.bookingFieldsRequired"),
			})
		}

		// Check if booking exists
		const existingBooking = await Booking.findOne({
			_id: id,
			organizationId,
		})
			.populate("employee_id", "name")
			.populate("client_id", "full_name phone")
			.populate("services", "name duration price")

		if (!existingBooking) {
			return res
				.status(404)
				.json({ error: req.t("errors.bookingNotFound") })
		}

		// Convert incoming times from organization timezone to UTC
		const startTimeUTC = convertOrgTimezoneToUTC(start_time, timezone)
		const endTimeUTC = convertOrgTimezoneToUTC(end_time, timezone)

		// Check for overlapping bookings with EMPLOYEE (excluding current booking)
		const overlappingEmployeeBooking = await Booking.findOne({
			organizationId,
			employee_id,
			_id: { $ne: id }, // Exclude current booking
			$or: [
				{
					start_time: { $lt: endTimeUTC },
					end_time: { $gt: startTimeUTC },
				},
				{
					start_time: {
						$gte: startTimeUTC,
						$lt: endTimeUTC,
					},
				},
			],
		})

		if (overlappingEmployeeBooking) {
			return res
				.status(400)
				.json({ error: req.t("errors.employeeNotAvailable") })
		}

		// Check for overlapping bookings with CLIENT (excluding current booking)
		const overlappingClientBooking = await Booking.findOne({
			organizationId,
			client_id,
			_id: { $ne: id }, // Exclude current booking
			$or: [
				{
					start_time: { $lt: endTimeUTC },
					end_time: { $gt: startTimeUTC },
				},
				{
					start_time: {
						$gte: startTimeUTC,
						$lt: endTimeUTC,
					},
				},
			],
		})

		if (overlappingClientBooking) {
			return res
				.status(400)
				.json({ error: req.t("errors.clientHasBooking") })
		}

		// Update booking with UTC times
		existingBooking.employee_id = employee_id
		existingBooking.client_id = client_id
		existingBooking.start_time = startTimeUTC
		existingBooking.end_time = endTimeUTC
		existingBooking.services = service_ids
		existingBooking.price = total_price
		existingBooking.notes = notes || ""

		await existingBooking.save()

		// Populate the updated booking with related data
		await existingBooking.populate("employee_id", "name")
		await existingBooking.populate("client_id", "full_name phone")
		await existingBooking.populate("services", "name duration price")

		// Return with times converted back to organization timezone
		const formattedBooking = {
			id: existingBooking._id,
			startTime: convertUTCToOrgTimezone(
				existingBooking.start_time,
				timezone
			),
			endTime: convertUTCToOrgTimezone(
				existingBooking.end_time,
				timezone
			),
			price: existingBooking.price,
			notes: existingBooking.notes,
			employee: {
				id: existingBooking.employee_id._id,
				name: existingBooking.employee_id.name,
			},
			client: {
				id: existingBooking.client_id._id,
				name: existingBooking.client_id.full_name,
				phone: existingBooking.client_id.phone,
			},
			services: existingBooking.services,
			created_at: convertUTCToOrgTimezone(
				existingBooking.createdAt,
				timezone
			),
			updated_at: convertUTCToOrgTimezone(
				existingBooking.updatedAt,
				timezone
			),
		}

		try {
			await logAction(req, {
				action: req.t("actions.update"),
				entityType: req.t("entities.booking"),
				entityId: existingBooking._id,
				details: `${req.t("entities.client")}: ${
					formattedBooking.client.name
				}, ${req.t("entities.phone")}: ${
					formattedBooking.client.phone
				}, ${req.t("entities.employee")}: ${
					formattedBooking.employee.name
				}, ${req.t(
					"entities.appointment"
				)}: ${formattedBooking.startTime.toLocaleString(
					req.t("common.locale")
				)}`,
			})
		} catch {}

		res.json(formattedBooking)
	} catch (error) {
		console.error("Error updating booking:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
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
				.json({ error: req.t("errors.bookingNotFound") })
		}

		const booking = await Booking.findByIdAndDelete(id)

		try {
			await logAction(req, {
				action: req.t("actions.delete"),
				entityType: req.t("entities.booking"),
				entityId: id,
				details: `${req.t("entities.client")}: ${
					prevBooking.client_id.full_name
				}, ${req.t("entities.phone")}: ${
					prevBooking.client_id.phone
				}, ${req.t("entities.employee")}: ${
					prevBooking.employee_id.name
				}, ${req.t(
					"entities.appointment"
				)}: ${prevBooking.start_time.toLocaleString(
					req.t("common.locale")
				)}`,
			})
		} catch {}

		res.json({ message: req.t("success.bookingDeleted") })
	} catch (error) {
		console.error("Error deleting booking:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

module.exports = router
