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
			const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

			query.$or = [
				{ full_name: { $regex: escapedQuery, $options: "i" } },
				{ phone: { $regex: escapedQuery, $options: "i" } },
			]
		}

		const organizationId = req.organizationId // From auth middleware
		if (!organizationId) {
			return res.status(400).json({
				error: "Идентификатор на организација е задолжителен",
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
		res.status(500).json({ error: "Грешка во серверот" })
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
		res.status(500).json({ error: "Грешка во серверот" })
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
			return res.status(404).json({ error: "Клиентот не е пронајден" })
		}

		res.json(client)
	} catch (error) {
		console.error("Error fetching client:", error)
		res.status(500).json({ error: "Грешка во серверот" })
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
			return res.status(404).json({ error: "Клиентот не е пронајден" })
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
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// POST /api/clients - Create new client
router.post("/", async (req, res) => {
	try {
		const { full_name, phone, notes } = req.body

		// Validation
		if (!full_name || full_name.trim() === "") {
			return res.status(400).json({ error: "Името е задолжително" })
		}

		const cleanedPhone = phone?.trim().replace(/\s/g, "") || ""

		if (!cleanedPhone || cleanedPhone === "" || isNaN(cleanedPhone)) {
			return res.status(400).json({
				error: "Телефонскиот број е задолжителен и мора да биде валиден број (броеви 0-9)",
			})
		}

		const organizationId = req.organizationId // From auth middleware
		if (!organizationId) {
			return res.status(400).json({
				error: "Идентификатор на организација е задолжителен",
			})
		}
		if (await Client.findOne({ phone: cleanedPhone, organizationId })) {
			return res.status(400).json({
				error: "Клиент со овој телефонски број веќе постои",
			})
		}

		const client = new Client({
			full_name: full_name.trim(),
			phone: cleanedPhone,
			notes: notes || "",
			organizationId,
		})

		await client.save()

		try {
			await logAction(req, {
				action: "Креирање",
				entityType: "Клиент",
				entityId: client._id,
				details: `Име: ${client.full_name}, Телефон: ${client.phone}`,
			})
		} catch {}

		res.json(client)
	} catch (error) {
		console.error("Error creating client:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// POST /api/clients/bulk - Bulk import clients
router.post("/bulk", async (req, res) => {
	try {
		const { clients: clientsToImport } = req.body

		if (!Array.isArray(clientsToImport) || clientsToImport.length === 0) {
			return res
				.status(400)
				.json({ error: "Листата на клиенти е задолжителна" })
		}

		const organizationId = req.organizationId
		if (!organizationId) {
			return res.status(400).json({
				error: "Идентификатор на организација е задолжителен",
			})
		}

		const results = {
			success: [],
			errors: [],
		}

		for (const clientData of clientsToImport) {
			const { full_name, phone, notes } = clientData

			// Validation
			if (!full_name || full_name.trim() === "") {
				results.errors.push({
					client: clientData,
					error: "Името е задолжително",
				})
				continue
			}

			const cleanedPhone = phone?.trim().replace(/\s/g, "") || ""

			if (!cleanedPhone || cleanedPhone === "" || isNaN(cleanedPhone)) {
				results.errors.push({
					client: clientData,
					error: "Невалиден телефонски број",
				})
				continue
			}

			// Check for duplicate
			const existingClient = await Client.findOne({
				phone: cleanedPhone,
				organizationId,
			})
			if (existingClient) {
				results.errors.push({
					client: clientData,
					error: "Веќе постои",
				})
				continue
			}

			try {
				const client = new Client({
					full_name: full_name.trim(),
					phone: cleanedPhone,
					notes: notes || "",
					organizationId,
				})

				await client.save()
				results.success.push(client)

				// Log action
				try {
					await logAction(req, {
						action: "Креирање (Bulk)",
						entityType: "Клиент",
						entityId: client._id,
						details: `Име: ${client.full_name}, Телефон: ${client.phone}`,
					})
				} catch {}
			} catch (error) {
				results.errors.push({
					client: clientData,
					error: error.message,
				})
			}
		}

		res.json({
			successCount: results.success.length,
			errorCount: results.errors.length,
			success: results.success,
			errors: results.errors,
		})
	} catch (error) {
		console.error("Error bulk importing clients:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// PUT /api/clients/:id - Update client
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params
		const { full_name, phone, notes, isHidden } = req.body

		if (!full_name || full_name.trim() === "" || isHidden === undefined) {
			return res.status(400).json({
				error: "Сите полиња за клиентот се задолжителни",
			})
		}

		const cleanedPhone = phone?.trim().replace(/\s/g, "") || ""

		if (!cleanedPhone || cleanedPhone === "" || isNaN(cleanedPhone)) {
			return res.status(400).json({
				error: "Телефонскиот број е задолжителен и мора да биде валиден број (броеви 0-9)",
			})
		}

		clientFromId = await Client.findOne({ _id: id })
		// SECURITY: Verify client belongs to user's organization
		if (!clientFromId) {
			return res.status(404).json({ error: "Клиентот не е пронајден" })
		}
		if (
			clientFromId.organizationId.toString() !==
			req.organizationId.toString()
		) {
			return res
				.status(403)
				.json({ error: "Немате пристап до овој клиент" })
		}

		if (clientFromId.phone !== cleanedPhone) {
			if (
				await Client.findOne({
					phone: cleanedPhone,
					organizationId: req.organizationId,
				})
			) {
				return res.status(400).json({
					error: "Клиент со овој телефонски број веќе постои",
				})
			}
		}

		const prevClient = await Client.findById(id)

		const client = await Client.findByIdAndUpdate(
			id,
			{
				full_name: full_name.trim(),
				phone: cleanedPhone,
				notes: notes || "",
			},
			{ new: true, runValidators: true }
		)

		if (!client) {
			return res.status(404).json({ error: "Клиентот не е пронајден" })
		}

		try {
			await logAction(req, {
				action: "Ажурирање",
				entityType: "Клиент",
				entityId: client._id,
				details: `Име: ${prevClient.full_name}->${client.full_name}, Телефон: ${prevClient.phone}->${client.phone}`,
			})
		} catch {}

		res.json(client)
	} catch (error) {
		console.error("Error updating client:", error)
		res.status(500).json({ error: "Грешка во серверот" })
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
			return res.status(404).json({ error: "Клиентот не е пронајден" })
		}
		// Check if client has future bookings
		const futureBookings = await Booking.countDocuments({
			client_id: id,
			end_time: { $gt: new Date() },
		})

		if (futureBookings > 0) {
			return res.status(400).json({
				error: "Клиентот има идни резервации и не може да се избрише",
			})
		}

		await Client.findByIdAndUpdate(id, { isHidden: true }, { new: true })

		try {
			await logAction(req, {
				action: "Бришење",
				entityType: "Клиент",
				entityId: client._id,
				details: client.full_name,
			})
		} catch {}

		res.json({ message: "Клиентот е успешно избришан" })
	} catch (error) {
		console.error("Error deleting client:", error)
		res.status(500).json({ error: "Грешка во серверот" })
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
			return res.status(404).json({ error: "Клиентот не е пронајден" })
		}

		try {
			await logAction(req, {
				action: "Враќање",
				entityType: "Клиент",
				entityId: client._id,
				details: client.full_name,
			})
		} catch {}

		res.json({ message: "Клиентот е успешно вратен", client })
	} catch (error) {
		console.error("Error restoring client:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

module.exports = router
