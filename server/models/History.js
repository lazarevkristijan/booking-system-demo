const mongoose = require("mongoose")

const historySchema = new mongoose.Schema(
	{
		action: {
			type: String, // 'create' | 'update' | 'delete' | 'restore' | 'login' etc.
			required: true,
		},
		entityType: {
			type: String, // 'booking' | 'client' | 'service' | 'employee'
			required: true,
		},
		entityId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		username: {
			type: String, // snapshot for convenience
		},
		details: {
			type: Object, // arbitrary metadata: changed fields, payload, etc.
		},
	},
	{ timestamps: true }
)

module.exports = mongoose.model("History", historySchema)
