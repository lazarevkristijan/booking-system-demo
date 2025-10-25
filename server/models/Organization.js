const mongoose = require("mongoose")

const organizationSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		slug: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		timezone: {
			type: String,
			default: "UTC",
			required: true,
			trim: true,
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model("Organization", organizationSchema)
