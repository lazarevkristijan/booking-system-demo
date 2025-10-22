const User = require("../models/User.js")
const History = require("../models/History.js")

const logAction = async (req, { action, entityType, entityId, details }) => {
	try {
		const userId = req.userId
		const organizationId = req.organizationId

		if (!userId || !organizationId) {
			console.warn("Missing userId or organizationId for logging")
			return
		}

		const user = await User.findById(userId).select("username")

		const historyEntry = new History({
			organizationId,
			action,
			entityType,
			entityId,
			userId,
			username: user?.username || "Непознат",
			details,
		})

		await historyEntry.save()
	} catch (e) {
		// do not crash the main flow; logging best-effort
		console.error("error while logging history:", e?.message || e)
	}
}

module.exports = { logAction }
