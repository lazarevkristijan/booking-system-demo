const mongoose = require("mongoose")
require("dotenv").config()

const MONGODB_URI = process.env.MONGODB_URI

const connectDB = async () => {
	try {
		await mongoose.connect(MONGODB_URI)
		console.log("Connected to MongoDB")
	} catch (e) {
		console.error("MongoDB connection error:", e)
		process.exit(1)
	}
}

mongoose.connection.on("disconnected", () => {
	console.log("MongoDB disconnected")
})

module.exports = connectDB
