const jwt = require("jsonwebtoken")
const { cookieSettings } = require("../constants.js")
const User = require("../models/User.js")

const authMiddleWare = async (req, res, next) => {
	const token = req.cookies?.token

	if (!token) {
		return res
			.status(401)
			.json({ error: "Unauthorized: No token provided" })
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)

		const user = await User.findById(decoded.id).select(
			"organizationId role"
		)

		if (!user) {
			return res.status(401).json({ error: "Корисникот не е пронајден" })
		}

		const extendedToken = jwt.sign(
			{ id: decoded.id },
			process.env.JWT_SECRET,
			{ expiresIn: "3d" }
		)

		req.userId = decoded?.id
		req.organizationId = user.organizationId
		req.userRole = user.role

		res.cookie("token", extendedToken, {
			...cookieSettings,
		})

		next()
	} catch (err) {
		return res.status(401).json({ error: "Unauthorized: Invalid token" })
	}
}

module.exports = authMiddleWare
