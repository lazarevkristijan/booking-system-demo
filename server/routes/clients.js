const express = require("express")
const router = express.Router()
const Booking = require("../models/Booking.js")
const Client = require("../models/Client.js")
const { logAction } = require("../utils/logger.js")

// GET /api/clients - List only active if query parameter not provided
router.get("/", async (req, res) => {
	try {
		const { q, showHidden } = req.query
		let query = showHidden === "true" ? {} : { isHidden: false }

		if (q) {
			query.full_name = { $regex: q, $options: "i" }
		}

		const clients = await Client.find(query).sort({ full_name: 1 })

		res.json(clients)
	} catch (error) {
		console.error("Error fetching clients:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// GET /api/clients/all/history - Get all clients history (including hidden)
router.get("/all/history", async (req, res) => {
	try {
		const bookings = await Booking.find()
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
		const client = await Client.findById(req.params.id)

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
		const client = await Client.findById(id)
		if (!client) {
			return res.status(404).json({ error: "Клиентот не е пронајден" })
		}

		// Get booking history with services and employee info
		const bookings = await Booking.find({ client_id: id })
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
		if (!phone || phone.trim() === "" || isNaN(phone)) {
			return res.status(400).json({
				error: "Полето за телефон е задолжително и треба да содржи само бројки 0-9 без празни места",
			})
		}
		if (await Client.findOne({ phone: phone })) {
			return res.status(400).json({
				error: "Веќе постои клиент со овој телефонски број",
			})
		}

		const client = new Client({
			full_name: full_name.trim(),
			phone: phone.trim(),
			notes: notes || "",
		})

		await client.save()

		try {
			await logAction(req, {
				action: "Креирање",
				entityType: "клиент",
				entityId: client._id,
				details: `име: ${client.full_name}, тел: ${client.phone}`,
			})
		} catch {}

		res.json(client)
	} catch (error) {
		console.error("Error creating client:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// PUT /api/clients/:id - Update client
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params
		const { full_name, phone, notes, isHidden } = req.body

		// Validation
		if (!full_name || full_name.trim() === "" || isHidden === undefined) {
			return res.status(400).json({
				error: "Полињата за име и за активност на клиентот се задолжителни",
			})
		}
		if (!phone || phone.trim() === "" || isNaN(phone)) {
			return res.status(400).json({
				error: "Полето за телефон е задолжително и треба да содржи само бројки 0-9 без празни места",
			})
		}

		clientFromId = await Client.findOne({ _id: id })

		if (clientFromId.phone !== phone) {
			if (await Client.findOne({ phone: phone })) {
				return res.status(400).json({
					error: "Веќе постои клиент со овој телефонски број",
				})
			}
		}

		const prevClient = await Client.findById(id)

		const client = await Client.findByIdAndUpdate(
			id,
			{
				full_name: full_name.trim(),
				phone: phone.trim(),
				isHidden: isHidden,
				notes: notes || "",
			},
			{ new: true, runValidators: true }
		)

		if (!client) {
			return res.status(404).json({ error: "Клиентот не е пронајден" })
		}

		try {
			await logAction(req, {
				action: "Уредување",
				entityType: "клиент",
				entityId: client._id,
				details: `име: ${prevClient.full_name}->${client.full_name}, тел: ${prevClient.phone}->${client.phone}, бел: ${prevClient.notes}->${client.notes}`,
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

		// Check if client has future bookings
		const futureBookings = await Booking.countDocuments({
			client_id: id,
			end_time: { $gt: new Date() },
		})

		if (futureBookings > 0) {
			return res.status(400).json({
				error: "Не може да се избрише клиент со претстојни резервации",
			})
		}

		const client = await Client.findByIdAndUpdate(
			id,
			{ isHidden: true },
			{ new: true }
		)

		if (!client) {
			return res.status(404).json({ error: "Клиентот не е пронајден" })
		}

		try {
			await logAction(req, {
				action: "Бришење",
				entityType: "клиент",
				entityId: client._id,
				details: client.full_name,
			})
		} catch {}

		res.json({ message: "Клиентот е избришан" })
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
			id,
			{ isHidden: false },
			{ new: true }
		)

		if (!client) {
			return res.status(404).json({ error: "Клиентот не е пронајден" })
		}

		try {
			await logAction(req, {
				action: "Враќање",
				entityType: "клиент",
				entityId: client._id,
				details: client.full_name,
			})
		} catch {}

		res.json({ message: "Клиентот е вратен", client })
	} catch (error) {
		console.error("Error restoring client:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

module.exports = router
