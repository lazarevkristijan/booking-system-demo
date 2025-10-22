const mongoose = require("mongoose")

const clientSchema = new mongoose.Schema(
	{
		organizationId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Organization",
			required: true,
			index: true, // Important for query performance
		},
		full_name: {
			type: String,
			required: true,
			trim: true,
		},
		phone: {
			type: String,
			required: true,
			trim: true,
		},
		notes: {
			type: String,
			required: false,
			trim: true,
			maxlength: 100,
			default: "",
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

clientSchema.index({ organizationId: 1, phone: 1 }, { unique: true })

// INDEXES for search performance
clientSchema.index({ organizationId: 1, full_name: 1 }) // Search by name
clientSchema.index({ organizationId: 1, isHidden: 1 }) // Filter by hidden status
clientSchema.index({ full_name: "text", phone: "text" }) // Text search (optional, more advanced)

module.exports = mongoose.model("Client", clientSchema)
