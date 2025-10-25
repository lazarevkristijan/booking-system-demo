const express = require("express")
const cors = require("cors")
require("dotenv").config()
const routes = require("./routes/index.js")
const connectDB = require("./db.js")
const cookieParser = require("cookie-parser")
const authMiddleWare = require("./middleware/authCheck.js")
const i18n = require("./i18n/config.js") // ✅ Add
const i18nmiddleware = require("i18next-http-middleware") // ✅ Add

const app = express()
const PORT = process.env.PORT

connectDB()

app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:5173",
		credentials: true,
	})
)
app.use(cookieParser())
app.use(express.json())
app.use(i18nmiddleware.handle(i18n))

// Mount API routes
app.use("/api", routes)

// 404 handler
app.use("*", authMiddleWare, (req, res) => {
	res.status(404).json({
		error: req.t("errors.notFound"),
		path: req.originalUrl,
		method: req.method,
	})
})

// Start server
app.listen(PORT, () => {
	console.log(`Hair Salon Booking API server running on port ${PORT}`)
})

module.exports = app
