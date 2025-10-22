const mongoose = require("mongoose")

const serviceSchema = new mongoose.Schema(
	{
		organizationId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Organization",
			required: true,
			index: true, // Important for query performance
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		duration: {
			type: Number,
			required: true,
			min: 1,
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
		isHidden: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model("Service", serviceSchema)
