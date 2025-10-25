import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import en from "./locales/en.json"
import mk from "./locales/mk.json"
import bg from "./locales/bg.json"

const resources = {
	en: { translation: en },
	mk: { translation: mk },
	bg: { translation: bg },
}

i18n.use(LanguageDetector) // Detects user language
	.use(initReactI18next) // Passes i18n down to react-i18next
	.init({
		resources,
		fallbackLng: "en",
		lng: localStorage.getItem("language") || undefined, // Use saved language or auto-detect
		debug: false,

		detection: {
			// Order of language detection
			order: ["localStorage", "navigator", "htmlTag"],
			// Keys to lookup language from
			lookupLocalStorage: "language",
			// Cache user language
			caches: ["localStorage"],
		},

		interpolation: {
			escapeValue: false, // React already escapes values
		},

		react: {
			useSuspense: false,
		},
	})

// Listen for language changes and persist to localStorage
i18n.on("languageChanged", (lng) => {
	localStorage.setItem("language", lng)
	// Send language preference to backend for server-side translations
	document.documentElement.lang = lng
})

export default i18n
