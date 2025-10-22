const mongoose = require("mongoose")

const employeeSchema = new mongoose.Schema(
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
		isHidden: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model("Employee", employeeSchema)
