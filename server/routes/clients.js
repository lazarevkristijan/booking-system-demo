const express = require("express")
const router = express.Router()
const Booking = require("../models/Booking.js")
const Client = require("../models/Client.js")
const { logAction } = require("../utils/logger.js")

// GET /api/clients - List only active if query parameter not provided
router.get("/", async (req, res) => {
	try {
		const { q, showHidden, page = 1, limit = 50 } = req.query
		let query = showHidden === "true" ? {} : { isHidden: false }

		// Search by name or phone
		if (q) {
			query.$or = [
				{ full_name: { $regex: q, $options: "i" } },
				{ phone: { $regex: q, $options: "i" } },
			]
		}

		const organizationId = req.organizationId // From auth middleware
		if (!organizationId) {
			return res.status(400).json({
				error: req.t("validation.organizationRequired"),
			})
		}

		query.organizationId = organizationId

		// Calculate pagination
		const pageNum = Math.max(parseInt(page), 1)
		const limitNum = Math.min(Math.max(parseInt(limit), 1), 100) // max 100 per page
		const skip = (pageNum - 1) * limitNum

		// Execute query with pagination
		const [clients, total] = await Promise.all([
			Client.find(query)
				.sort({ full_name: 1 })
				.skip(skip)
				.limit(limitNum)
				.lean(), // lean() for better performance
			Client.countDocuments(query),
		])

		res.json({
			clients,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total,
				totalPages: Math.ceil(total / limitNum),
				hasMore: pageNum * limitNum < total,
			},
		})
	} catch (error) {
		console.error("Error fetching clients:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// GET /api/clients/all/history - Get all clients history (including hidden)
router.get("/all/history", async (req, res) => {
	try {
		const organizationId = req.organizationId // From auth middleware
		if (!organizationId) {
			return res.status(400).json({
				error: "Идентификатор на организација е задолжителен",
			})
		}

		const bookings = await Booking.find({ organizationId })
			.populate("employee_id", "name isHidden")
			.populate("services", "name isHidden")
			.populate("client_id", "full_name phone isHidden")
			.sort({ start_time: -1 })

		const history = bookings.map((booking) => ({
			id: booking._id,
			start_time: booking.start_time,
			end_time: booking.end_time,
			services: booking.services.map((service) => ({
				name: service.name,
				isHidden: service.isHidden,
			})),
			employee: {
				name: booking.employee_id.name,
				isHidden: booking.employee_id.isHidden,
			},
			price: booking.price,
			notes: booking.notes,
			client_id: booking.client_id._id,
			client: {
				full_name: booking.client_id.full_name,
				isHidden: booking.client_id.isHidden,
			},
		}))

		res.json(history)
	} catch (error) {
		console.error("Error fetching history:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// GET /api/clients/:id - Get single client (even if hidden)
router.get("/:id", async (req, res) => {
	try {
		const client = await Client.findOne({
			_id: req.params.id,
			organizationId: req.organizationId,
		})

		if (!client) {
			return res
				.status(404)
				.json({ error: req.t("errors.clientNotFound") })
		}

		res.json(client)
	} catch (error) {
		console.error("Error fetching client:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// GET /api/clients/:id/history - Get client booking history (even if hidden)
router.get("/:id/history", async (req, res) => {
	try {
		const { id } = req.params

		// First verify client exists
		const client = await Client.findOne({
			_id: req.params.id,
			organizationId: req.organizationId,
		})

		if (!client) {
			return res
				.status(404)
				.json({ error: req.t("errors.clientNotFound") })
		}

		// Get booking history with services and employee info
		const bookings = await Booking.find({
			client_id: id,
			organizationId: req.organizationId,
		})
			.populate("employee_id", "name isHidden")
			.populate("services", "name isHidden")
			.sort({ start_time: -1 })

		const history = bookings.map((booking) => ({
			id: booking._id,
			start_time: booking.start_time,
			end_time: booking.end_time,
			services: booking.services.map((service) => ({
				name: service.name,
				isHidden: service.isHidden,
			})),
			employee: {
				name: booking.employee_id.name,
				isHidden: booking.employee_id.isHidden,
			},
			price: booking.price,
			notes: booking.notes,
		}))

		res.json(history)
	} catch (error) {
		console.error("Error fetching client history:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// POST /api/clients - Create new client
router.post("/", async (req, res) => {
	try {
		const { full_name, phone, notes } = req.body

		// Validation
		if (!full_name || full_name.trim() === "") {
			return res
				.status(400)
				.json({ error: req.t("validation.nameRequired") })
		}
		if (!phone || phone.trim() === "" || isNaN(phone)) {
			return res.status(400).json({
				error: req.t("validation.phoneRequired"),
			})
		}

		const organizationId = req.organizationId // From auth middleware
		if (!organizationId) {
			return res.status(400).json({
				error: req.t("validation.organizationRequired"),
			})
		}
		if (await Client.findOne({ phone: phone, organizationId })) {
			return res.status(400).json({
				error: req.t("errors.clientPhoneExists"),
			})
		}

		const client = new Client({
			full_name: full_name.trim(),
			phone: phone.trim(),
			notes: notes || "",
			organizationId,
		})

		await client.save()

		try {
			await logAction(req, {
				action: req.t("actions.create"),
				entityType: req.t("entities.client"),
				entityId: client._id,
				details: `${req.t("entities.name")}: ${
					client.full_name
				}, ${req.t("entities.phone")}: ${client.phone}`,
			})
		} catch {}

		res.json(client)
	} catch (error) {
		console.error("Error creating client:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// PUT /api/clients/:id - Update client
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params
		const { full_name, phone, notes, isHidden } = req.body

		if (!full_name || full_name.trim() === "" || isHidden === undefined) {
			return res.status(400).json({
				error: req.t("validation.clientFieldsRequired"),
			})
		}
		if (!phone || phone.trim() === "" || isNaN(phone)) {
			return res.status(400).json({
				error: req.t("validation.phoneRequired"),
			})
		}

		clientFromId = await Client.findOne({ _id: id })
		// SECURITY: Verify client belongs to user's organization
		if (!clientFromId) {
			return res
				.status(404)
				.json({ error: req.t("errors.clientNotFound") })
		}
		if (
			clientFromId.organizationId.toString() !==
			req.organizationId.toString()
		) {
			return res
				.status(403)
				.json({ error: req.t("errors.noAccessToClient") })
		}

		if (clientFromId.phone !== phone) {
			if (
				await Client.findOne({
					phone: phone,
					organizationId: req.organizationId,
				})
			) {
				return res.status(400).json({
					error: req.t("errors.clientPhoneExists"),
				})
			}
		}

		const prevClient = await Client.findById(id)

		const client = await Client.findByIdAndUpdate(
			id,
			{
				full_name: full_name.trim(),
				phone: phone.trim(),
				notes: notes || "",
			},
			{ new: true, runValidators: true }
		)

		if (!client) {
			return res
				.status(404)
				.json({ error: req.t("errors.clientNotFound") })
		}

		try {
			await logAction(req, {
				action: req.t("actions.update"),
				entityType: req.t("entities.client"),
				entityId: client._id,
				details: `${req.t("entities.name")}: ${prevClient.full_name}->${
					client.full_name
				}, ${req.t("entities.phone")}: ${prevClient.phone}->${
					client.phone
				}`,
			})
		} catch {}

		res.json(client)
	} catch (error) {
		console.error("Error updating client:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// DELETE /api/clients/:id - Soft delete client (mark as hidden)
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params
		// Check if employee belongs to user's organization
		const client = await Employee.findOne({
			_id: id,
			organizationId: req.organizationId,
		})

		if (!employee) {
			return res
				.status(404)
				.json({ error: req.t("errors.clientNotFound") })
		}
		// Check if client has future bookings
		const futureBookings = await Booking.countDocuments({
			client_id: id,
			end_time: { $gt: new Date() },
		})

		if (futureBookings > 0) {
			return res.status(400).json({
				error: req.t("errors.clientHasBookings"),
			})
		}

		await Client.findByIdAndUpdate(id, { isHidden: true }, { new: true })

		try {
			await logAction(req, {
				action: req.t("actions.delete"),
				entityType: req.t("entities.client"),
				entityId: client._id,
				details: client.full_name,
			})
		} catch {}

		res.json({ message: req.t("success.clientDeleted") })
	} catch (error) {
		console.error("Error deleting client:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

// PATCH /api/clients/:id/restore - Restore hidden client
router.patch("/:id/restore", async (req, res) => {
	try {
		const { id } = req.params

		const client = await Client.findByIdAndUpdate(
			{ _id: id, organizationId: req.organizationId },
			{ isHidden: false },
			{ new: true }
		)

		if (!client) {
			return res
				.status(404)
				.json({ error: req.t("errors.clientNotFound") })
		}

		try {
			await logAction(req, {
				action: req.t("actions.restore"),
				entityType: req.t("entities.client"),
				entityId: client._id,
				details: client.full_name,
			})
		} catch {}

		res.json({ message: req.t("success.clientRestored"), client })
	} catch (error) {
		console.error("Error restoring client:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

module.exports = router
