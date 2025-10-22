const express = require("express")
const router = express.Router()
const Employee = require("../models/Employee.js")
const Booking = require("../models/Booking.js")
const { logAction } = require("../utils/logger.js")

// GET /api/employees - List only active if query parameter not provided
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

		const employees = await Employee.find(filter).sort({ createdAt: -1 })
		res.json(employees)
	} catch (error) {
		console.error("Error fetching employees:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// GET /api/employees/available - Check employee availability for a time slot (only visible employees)
router.get("/available", async (req, res) => {
	try {
		const { start_time, end_time } = req.query
		if (!start_time || !end_time) {
			return res.status(400).json({
				error: "Времето за почеток и крај на услугата се задолжителни",
			})
		}

		const organizationId = req.organizationId // From auth middleware
		if (!organizationId) {
			return res.status(400).json({
				error: "Идентификатор на организација е задолжителен",
			})
		}

		// Get all employees
		const employees = await Employee.find({
			isHidden: false,
			organizationId,
		})

		const busyEmployees = await Booking.find({
			organizationId,
			start_time: { $lt: new Date(end_time) },
			end_time: { $gt: new Date(start_time) },
		}).distinct("employee_id")

		const employeesWithAvailability = employees.map((e) => ({
			...e.toObject(),
			available: !busyEmployees.some((id) => id.equals(e._id)),
		}))

		res.json(employeesWithAvailability)
	} catch (error) {
		console.error("Error checking employee availability:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// GET /api/employees/:id - Get single employee (even if hidden)
router.get("/:id", async (req, res) => {
	try {
		const employee = await Employee.findOne({
			_id: req.params.id,
			organizationId: req.organizationId,
		})

		if (!employee) {
			return res.status(404).json({ error: "Служителот не е пронајден" })
		}

		res.json(employee)
	} catch (error) {
		console.error("Error fetching employee:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// POST /api/employees - Create new employee
router.post("/", async (req, res) => {
	try {
		const { name } = req.body
		if (!name || name.trim() === "") {
			return res
				.status(400)
				.json({ error: "Полето за име е задолжително" })
		}

		const organizationId = req.organizationId // From auth middleware
		if (!organizationId) {
			return res.status(400).json({
				error: "Идентификатор на организација е задолжителен",
			})
		}

		const employee = new Employee({ name: name.trim(), organizationId })
		await employee.save()

		try {
			await logAction(req, {
				action: "Креирање",
				entityType: "служител",
				entityId: employee._id,
				details: `име: ${employee.name}`,
			})
		} catch {}

		res.status(201).json(employee)
	} catch (error) {
		console.error("Error creating employee:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// PUT /api/employees/:id - Update employee
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params
		const { name, isHidden } = req.body

		if (!name || name.trim() === "" || isHidden === undefined) {
			return res.status(400).json({
				error: "Полињата за име и за активност на служителот се задолжителни",
			})
		}

		const prevEmployee = await Employee.findById(id)
		if (!prevEmployee) {
			return res.status(404).json({ error: "Служителот не е пронајден" })
		}
		if (
			prevEmployee.organizationId.toString() !==
			req.organizationId.toString()
		) {
			return res
				.status(403)
				.json({ error: "Немате пристап до овој служител" })
		}

		const employee = await Employee.findByIdAndUpdate(
			id,
			{ name: name.trim() },
			{ new: true, runValidators: true }
		)

		if (!employee) {
			return res.status(404).json({ error: "Служителот не е пронајден" })
		}

		try {
			await logAction(req, {
				action: "Уредување",
				entityType: "служител",
				entityId: employee._id,
				details: `име: ${prevEmployee.name}->${employee.name}`,
			})
		} catch {}

		res.json(employee)
	} catch (error) {
		console.error("Error updating employee:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// DELETE /api/employees/:id - Soft delete employee (mark as hidden)
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params
		// Check if employee belongs to user's organization
		const employee = await Employee.findOne({
			_id: id,
			organizationId: req.organizationId,
		})
		if (!employee) {
			return res.status(404).json({ error: "Служителот не е пронајден" })
		}

		const futureBookings = await Booking.countDocuments({
			employee_id: id,
			end_time: { $gt: new Date() },
		})

		if (futureBookings > 0) {
			return res.status(400).json({
				error: "Не може да се избрише служител со претстојни резервации",
			})
		}

		await Employee.findByIdAndUpdate(id, { isHidden: true }, { new: true })

		try {
			await logAction(req, {
				action: "Бришење",
				entityType: "служител",
				entityId: employee._id,
				details: `име: ${employee.name}`,
			})
		} catch {}

		res.json({ message: "Служителот е избришан" })
	} catch (error) {
		console.error("Error deleting employee:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

// PATCH /api/employees/:id/restore - Restore hidden employee
router.patch("/:id/restore", async (req, res) => {
	try {
		const { id } = req.params

		const employee = await Employee.findOneAndUpdate(
			{ _id: id, organizationId: req.organizationId },
			{ isHidden: false },
			{ new: true }
		)

		if (!employee) {
			return res.status(404).json({ error: "Служителот не е пронајден" })
		}

		try {
			await logAction(req, {
				action: "Враќање",
				entityType: "служител",
				entityId: employee._id,
				details: `име: ${employee.name}`,
			})
		} catch {}

		res.json({ message: "Служителот е вратен", employee })
	} catch (error) {
		console.error("Error restoring employee:", error)
		res.status(500).json({ error: "Грешка во серверот" })
	}
})

module.exports = router
