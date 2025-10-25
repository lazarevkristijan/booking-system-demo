const i18n = require("i18next")
const Backend = require("i18next-fs-backend")
const middleware = require("i18next-http-middleware")
const path = require("path")

i18n.use(Backend)
	.use(middleware.LanguageDetector)
	.init({
		fallbackLng: "en",
		preload: ["en", "mk"],
		backend: {
			loadPath: path.join(__dirname, "locales/{{lng}}.json"),
		},
		detection: {
			order: ["header", "querystring"],
			lookupHeader: "accept-language",
			lookupQuerystring: "lang",
			caches: false,
		},
	})

module.exports = i18n
