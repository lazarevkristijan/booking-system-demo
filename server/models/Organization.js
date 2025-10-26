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
			default: "Europe/Skopje",
			required: true,
			trim: true,
		},
		bookingInterval: {
			type: Number,
			enum: [15, 30],
			default: 15,
			required: true,
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model("Organization", organizationSchema)
