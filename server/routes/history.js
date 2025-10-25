const express = require("express")
const router = express.Router()
const History = require("../models/History.js")

// GET /api/history?entityType=&action=&page=1&limit=50
router.get("/", async (req, res) => {
	try {
		const { entityType, action, page = 1, limit = 50 } = req.query
		const q = {}
		if (entityType) q.entityType = entityType
		if (action) q.action = action

		const organizationId = req.organizationId // From auth middleware
		if (!organizationId) {
			return res.status(400).json({
				error: req.t("validation.organizationRequired"),
			})
		}
		q.organizationId = organizationId

		const pageNum = Math.max(parseInt(page) || 1, 1)
		const pageSize = Math.min(Math.max(parseInt(limit) || 50, 1), 200)

		const [items, total] = await Promise.all([
			History.find(q)
				.sort({ createdAt: -1 })
				.skip((pageNum - 1) * pageSize)
				.limit(pageSize)
				.select("-__v")
				.lean(),
			History.countDocuments(q),
		])

		res.json({
			items,
			page: pageNum,
			limit: pageSize,
			total,
		})
	} catch (error) {
		console.error("Error fetching history:", error)
		res.status(500).json({ error: req.t("errors.serverError") })
	}
})

module.exports = router
