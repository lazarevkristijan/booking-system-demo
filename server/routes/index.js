const express = require("express")
const router = express.Router()

// Import all route modules
const authMiddleware = require("../middleware/authCheck.js")
const employeesRoutes = require("./employees.js")
const servicesRoutes = require("./services.js")
const clientsRoutes = require("./clients.js")
const bookingsRoutes = require("./bookings.js")
const authRoutes = require("./auth.js")
const historyRoutes = require("./history.js")
const organizationsRoutes = require("./organizations.js")
const usersRoutes = require("./users.js")
const superadminRoutes = require("./superadmin.js") // ✅ ADD THIS

// Mount routes
router.use("/employees", authMiddleware, employeesRoutes)
router.use("/services", authMiddleware, servicesRoutes)
router.use("/clients", authMiddleware, clientsRoutes)
router.use("/bookings", authMiddleware, bookingsRoutes)
router.use("/history", authMiddleware, historyRoutes)
router.use("/auth", authRoutes)
router.use("/organizations", authMiddleware, organizationsRoutes)
router.use("/users", authMiddleware, usersRoutes)
router.use("/superadmin", authMiddleware, superadminRoutes) // ✅ ADD THIS

module.exports = router
