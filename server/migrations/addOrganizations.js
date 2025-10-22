// server/migrations/addOrganizations.js
const mongoose = require("mongoose")
require("dotenv").config()

const Organization = require("../models/Organization.js")
const User = require("../models/User.js")
const Employee = require("../models/Employee.js")
const Service = require("../models/Service.js")
const Client = require("../models/Client.js")
const Booking = require("../models/Booking.js")
const History = require("../models/History.js")

async function migrate() {
	try {
		await mongoose.connect(process.env.MONGODB_URI)
		console.log("Connected to MongoDB")

		// Create default organization
		const defaultOrg = new Organization({
			name: "Default Organization",
			slug: "default",
			isActive: true,
		})
		await defaultOrg.save()
		console.log("Created default organization:", defaultOrg._id)

		// Update all users
		await User.updateMany(
			{ organizationId: { $exists: false } },
			{ $set: { organizationId: defaultOrg._id, role: "user" } }
		)
		console.log("Updated users")

		// Update all employees
		await Employee.updateMany(
			{ organizationId: { $exists: false } },
			{ $set: { organizationId: defaultOrg._id } }
		)
		console.log("Updated employees")

		// Update all services
		await Service.updateMany(
			{ organizationId: { $exists: false } },
			{ $set: { organizationId: defaultOrg._id } }
		)
		console.log("Updated services")

		// Update all clients
		await Client.updateMany(
			{ organizationId: { $exists: false } },
			{ $set: { organizationId: defaultOrg._id } }
		)
		console.log("Updated clients")

		// Update all bookings
		await Booking.updateMany(
			{ organizationId: { $exists: false } },
			{ $set: { organizationId: defaultOrg._id } }
		)
		console.log("Updated bookings")

		// Update all history
		await History.updateMany(
			{ organizationId: { $exists: false } },
			{ $set: { organizationId: defaultOrg._id } }
		)
		console.log("Updated history")

		console.log("Migration completed successfully!")
		process.exit(0)
	} catch (error) {
		console.error("Migration error:", error)
		process.exit(1)
	}
}

migrate()
