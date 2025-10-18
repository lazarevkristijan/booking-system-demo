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

		const employees = await Employee.find(filter).sort({ createdAt: -1 })
		res.json(employees)
	} catch (error) {
		console.error("Error fetching employees:", error)
		res.status(500).json({ error: "Грешка в сървъра" })
	}
})

// GET /api/employees/available - Check employee availability for a time slot (only visible employees)
router.get("/available", async (req, res) => {
	try {
		const { start_time, end_time } = req.query

		if (!start_time || !end_time) {
			return res.status(400).json({
				error: "време за начало и край на услуга са задължителни",
			})
		}

		// Get all employees
		const employees = await Employee.find({ isHidden: false })

		const busyEmployees = await Booking.find({
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
		res.status(500).json({ error: "Грешка в сървъра" })
	}
})

// GET /api/employees/:id - Get single employee (even if hidden)
router.get("/:id", async (req, res) => {
	try {
		const employee = await Employee.findById(req.params.id)

		if (!employee) {
			return res
				.status(404)
				.json({ error: "Този служител не беше намерен" })
		}

		res.json(employee)
	} catch (error) {
		console.error("Error fetching employee:", error)
		res.status(500).json({ error: "Грешка в сървъра" })
	}
})

// POST /api/employees - Create new employee
router.post("/", async (req, res) => {
	try {
		const { name } = req.body

		if (!name || name.trim() === "") {
			return res
				.status(400)
				.json({ error: "Полето за име е задължително" })
		}

		const employee = new Employee({ name: name.trim() })
		await employee.save()

		try {
			await logAction(req, {
				action: "създаване",
				entityType: "служител",
				entityId: employee._id,
				details: `име: ${employee.name}`,
			})
		} catch {}

		res.status(201).json(employee)
	} catch (error) {
		console.error("Error creating employee:", error)
		res.status(500).json({ error: "Грешка в сървъра" })
	}
})

// PUT /api/employees/:id - Update employee
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params
		const { name, isHidden } = req.body

		if (!name || name.trim() === "" || isHidden === undefined) {
			return res.status(400).json({
				error: "Полетата за име и за активност на служителя са задължителни",
			})
		}

		const prevEmployee = await Employee.findById(id)

		const employee = await Employee.findByIdAndUpdate(
			id,
			{ name: name.trim(), isHidden },
			{ new: true, runValidators: true }
		)

		if (!employee) {
			return res.status(404).json({ error: "Служителя не беше намерен" })
		}

		try {
			await logAction(req, {
				action: "редактиране",
				entityType: "служител",
				entityId: employee._id,
				details: `име: ${prevEmployee.name}->${employee.name}`,
			})
		} catch {}

		res.json(employee)
	} catch (error) {
		console.error("Error updating employee:", error)
		res.status(500).json({ error: "Грешка в сървъра" })
	}
})

// DELETE /api/employees/:id - Soft delete employee (mark as hidden)
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params

		const futureBookings = await Booking.countDocuments({
			employee_id: id,
			end_time: { $gt: new Date() },
		})

		if (futureBookings > 0) {
			return res.status(400).json({
				error: "Не може да се изтрие служител с предстоящи резервации",
			})
		}

		const employee = await Employee.findByIdAndUpdate(
			id,
			{ isHidden: true },
			{ new: true }
		)

		if (!employee) {
			return res.status(404).json({ error: "Служителя не е намерен" })
		}

		try {
			await logAction(req, {
				action: "изтриване",
				entityType: "служител",
				entityId: employee._id,
				details: `име: ${employee.name}`,
			})
		} catch {}

		res.json({ message: "Служителя е изтрит" })
	} catch (error) {
		console.error("Error deleting employee:", error)
		res.status(500).json({ error: "Грешка в сървъра" })
	}
})

// PATCH /api/employees/:id/restore - Restore hidden employee
router.patch("/:id/restore", async (req, res) => {
	try {
		const { id } = req.params

		const employee = await Employee.findByIdAndUpdate(
			id,
			{ isHidden: false },
			{ new: true }
		)

		if (!employee) {
			return res.status(404).json({ error: "Служителя не е намерен" })
		}

		try {
			await logAction(req, {
				action: "възстановяване",
				entityType: "служител",
				entityId: employee._id,
				details: `име: ${employee.name}`,
			})
		} catch {}

		res.json({ message: "Employee restored successfully", employee })
	} catch (error) {
		console.error("Error restoring employee:", error)
		res.status(500).json({ error: "Грешка в сървъра" })
	}
})

module.exports = router
