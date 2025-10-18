const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema(
	{
		employee_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Employee",
			required: true,
		},
		client_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Client",
			required: true,
		},
		start_time: {
			type: Date,
			required: true,
		},
		end_time: {
			type: Date,
			required: true,
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
		services: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Service",
				required: true,
			},
		],
		notes: {
			type: String,
			required: false,
			trim: true,
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model("Booking", bookingSchema)
