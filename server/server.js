const express = require("express")
const cors = require("cors")
require("dotenv").config()
const routes = require("./routes/index.js")
const connectDB = require("./db.js")
const cookieParser = require("cookie-parser")
const authMiddleWare = require("./middleware/authCheck.js")

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

// Mount API routes
app.use("/api", routes)

// 404 handler
app.use("*", authMiddleWare, (req, res) => {
	res.status(404).json({
		error: "Тој линк не постои",
		path: req.originalUrl,
		method: req.method,
	})
})

// Start server
app.listen(PORT, () => {
	console.log(`Hair Salon Booking API server running on port ${PORT}`)
})

module.exports = app
