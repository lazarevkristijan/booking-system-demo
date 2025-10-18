const cookieSettings = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "Strict",
	maxAge: 3 * 24 * 60 * 60 * 1000,
	path: "/",
}

const cookieSettingsNoAge = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "Strict",
	path: "/",
}

module.exports = { cookieSettings, cookieSettingsNoAge }
