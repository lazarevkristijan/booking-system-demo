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
		displayStartTime: {
			type: String,
			default: "08:00",
			required: true,
			validate: {
				validator: function (v) {
					if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(v)) return false
					const [, minutes] = v.split(":").map(Number)
					return [0, 15, 30, 45].includes(minutes)
				},
				message: (props) =>
					`${props.value} is not a valid time format (HH:MM)!`,
			},
		},
		displayEndTime: {
			type: String,
			default: "20:00",
			required: true,
			validate: {
				validator: function (v) {
					if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(v)) return false
					const [, minutes] = v.split(":").map(Number)
					return [0, 15, 30, 45].includes(minutes)
				},
				message: (props) =>
					`${props.value} is not a valid time format (HH:MM)!`,
			},
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model("Organization", organizationSchema)
