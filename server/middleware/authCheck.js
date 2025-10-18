const jwt = require("jsonwebtoken")
const { cookieSettings } = require("../constants.js")

const authMiddleWare = (req, res, next) => {
	const token = req.cookies?.token

	if (!token) {
		return res
			.status(401)
			.json({ error: "Unauthorized: No token provided" })
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)

		const extendedToken = jwt.sign(
			{ id: decoded.id },
			process.env.JWT_SECRET,
			{ expiresIn: "3d" }
		)

		req.userId = decoded?.id

		res.cookie("token", extendedToken, {
			...cookieSettings,
		})

		next()
	} catch (err) {
		return res.status(401).json({ error: "Unauthorized: Invalid token" })
	}
}

module.exports = authMiddleWare
