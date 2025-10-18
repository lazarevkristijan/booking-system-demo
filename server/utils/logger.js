const jwt = require("jsonwebtoken")
const User = require("../models/User.js")
const History = require("../models/History.js")

const logAction = async (req, { action, entityType, entityId, details }) => {
	try {
		const userId = req.userId
		if (!userId) return

		let username = undefined
		try {
			const user = await User.findById(userId)
			username = user?.username
		} catch (e) {
			console.error(
				`error while getting user/username from db for userId: ${userId}: ${e}`
			)
		}

		await History.create({
			action,
			entityType,
			entityId,
			userId,
			username,
			details,
		})
	} catch (e) {
		// do not crash the main flow; logging best-effort
		console.error("error while logging history:", e?.message || e)
	}
}

module.exports = { logAction }
