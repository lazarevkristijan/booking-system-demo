import { useTranslation } from "react-i18next"
import { Languages } from "lucide-react"
import { useState } from "react"

export const LanguageSwitcher = () => {
	const { i18n, t } = useTranslation()
	const [isOpen, setIsOpen] = useState(false)

	const languages = [
		{ code: "en", name: t("settings.english"), flag: "🇬🇧" },
		{ code: "mk", name: t("settings.macedonian"), flag: "🇲🇰" },
		{ code: "bg", name: t("settings.bulgarian"), flag: "🇧🇬" },
	]

	const currentLanguage =
		languages.find((lang) => lang.code === i18n.language) || languages[0]

	const changeLanguage = (langCode) => {
		i18n.changeLanguage(langCode)
		setIsOpen(false)
		// Axios will automatically send the language in headers (we'll set this up)
	}

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
				aria-label={t("settings.changeLanguage")}
			>
				<Languages className="h-5 w-5 text-slate-600" />
				<span className="text-sm font-medium text-slate-700">
					{currentLanguage.flag} {currentLanguage.name}
				</span>
			</button>

			{isOpen && (
				<>
					<div
						className="fixed inset-0 z-10"
						onClick={() => setIsOpen(false)}
					/>
					<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
						{languages.map((lang) => (
							<button
								key={lang.code}
								onClick={() => changeLanguage(lang.code)}
								className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${
									i18n.language === lang.code
										? "bg-slate-100 font-medium"
										: ""
								}`}
							>
								<span className="text-lg">{lang.flag}</span>
								<span>{lang.name}</span>
							</button>
						))}
					</div>
				</>
			)}
		</div>
	)
}
