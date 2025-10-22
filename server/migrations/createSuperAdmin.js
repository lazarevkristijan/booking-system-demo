const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
require("dotenv").config()

const User = require("../models/User.js")

async function createSuperAdmin() {
	try {
		console.log("MONGODB URI")
		console.log(process.env.MONGODB_URI)
		await mongoose.connect(process.env.MONGODB_URI)
		console.log("Connected to MongoDB")

		// Check if superadmin already exists
		const existing = await User.findOne({ role: "superadmin" })
		if (existing) {
			console.log("⚠️  Superadmin already exists:", existing.username)
			process.exit(0)
		}

		// Create superadmin
		const username = "superadmin"
		const password = "kixMDFK88" // CHANGE THIS!
		const hashedPassword = await bcrypt.hash(password, 10)

		const superadmin = new User({
			username,
			password: hashedPassword,
			role: "superadmin",
			organizationId: 999999999999,
		})

		await superadmin.save()

		console.log("✅ Superadmin created successfully!")
		console.log("Username:", username)
		console.log("Password:", password)

		process.exit(0)
	} catch (error) {
		console.error("Migration error:", error)
		process.exit(1)
	}
}

createSuperAdmin()
