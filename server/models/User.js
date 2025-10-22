const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	organizationId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Organization",
		required: true,
	},
	role: {
		type: String,
		enum: ["admin", "user", "superadmin"],
		default: "user",
	},
})

module.exports = mongoose.model("User", userSchema)
