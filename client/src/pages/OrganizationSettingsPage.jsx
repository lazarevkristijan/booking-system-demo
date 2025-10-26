// client/src/pages/OrganizationSettingsPage.jsx
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Save, Clock } from "lucide-react"
import { COMMON_TIMEZONES, getTimezoneOffset } from "../utils/timezone"
import { useOrganization } from "../contexts/OrganizationContext"
import axios from "axios"
import { SERVER_API } from "../constants"

export const OrganizationSettingsPage = () => {
	const { t } = useTranslation()
	const { organization, refreshOrganization } = useOrganization()
	const [timezone, setTimezone] = useState("UTC")
	const [bookingInterval, setBookingInterval] = useState(15)
	const [saving, setSaving] = useState(false)
	const [message, setMessage] = useState(null)

	useEffect(() => {
		if (organization?.timezone) {
			setTimezone(organization.timezone)
		}
		if (organization?.bookingInterval) {
			setBookingInterval(organization.bookingInterval)
		}
	}, [organization])

	const handleSave = async () => {
		if (!organization?.id) return

		setSaving(true)
		setMessage(null)

		try {
			await axios.patch(
				`${SERVER_API}/organizations/${organization.id}/settings`,
				{
					timezone,
					bookingInterval,
				},
				{ withCredentials: true }
			)

			await refreshOrganization()
			setMessage({ type: "success", text: t("settings.saveSuccess") })
		} catch (error) {
			console.error("Error saving settings:", error)
			setMessage({
				type: "error",
				text: error.response?.data?.error || t("settings.saveError"),
			})
		} finally {
			setSaving(false)
		}
	}

	// Add offset to each timezone
	const timezonesWithOffsets = COMMON_TIMEZONES.map((tz) => ({
		...tz,
		offset: getTimezoneOffset(tz.value),
	}))

	return (
		<div className="p-4 sm:p-6">
			<div className="max-w-3xl mx-auto">
				<h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6">
					{t("settings.organizationSettings")}
				</h1>

				<div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
					<div className="mb-6">
						<h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
							<Clock className="h-5 w-5 mr-2 text-blue-600" />
							{t("settings.timezone")}
						</h2>
						<p className="text-sm text-slate-600 mb-4">
							{t("settings.timezoneDescription")}
						</p>

						<label className="block text-sm font-medium text-slate-700 mb-2">
							{t("settings.selectTimezone")}
						</label>
						<select
							value={timezone}
							onChange={(e) => setTimezone(e.target.value)}
							className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							{timezonesWithOffsets.map((tz) => (
								<option
									key={tz.value}
									value={tz.value}
								>
									{tz.label} ({tz.offset})
								</option>
							))}
						</select>

						<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<p className="text-sm text-blue-800">
								<strong>
									{t("settings.currentTimezone")}:
								</strong>{" "}
								{organization?.timezone || "UTC"}
							</p>
							<p className="text-sm text-blue-700 mt-2">
								{t("settings.timezoneNote")}
							</p>
						</div>
					</div>

					{/* NEW: Booking Interval Section */}
					<div className="mb-6 border-t pt-6">
						<h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
							<Clock className="h-5 w-5 mr-2 text-green-600" />
							{t("settings.bookingInterval")}
						</h2>
						<p className="text-sm text-slate-600 mb-4">
							{t("settings.bookingIntervalDescription")}
						</p>

						<label className="block text-sm font-medium text-slate-700 mb-2">
							{t("settings.selectBookingInterval")}
						</label>
						<div className="flex gap-4">
							<button
								onClick={() => setBookingInterval(15)}
								className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${
									bookingInterval === 15
										? "border-green-600 bg-green-50 text-green-700"
										: "border-slate-300 hover:border-slate-400"
								}`}
							>
								<div className="text-2xl font-bold">15</div>
								<div className="text-sm">
									{t("common.minutes")}
								</div>
							</button>
							<button
								onClick={() => setBookingInterval(30)}
								className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${
									bookingInterval === 30
										? "border-green-600 bg-green-50 text-green-700"
										: "border-slate-300 hover:border-slate-400"
								}`}
							>
								<div className="text-2xl font-bold">30</div>
								<div className="text-sm">
									{t("common.minutes")}
								</div>
							</button>
						</div>

						<div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
							<p className="text-sm text-green-800">
								<strong>
									{t("settings.currentInterval")}:
								</strong>{" "}
								{organization?.bookingInterval || 15}{" "}
								{t("common.minutes")}
							</p>
						</div>
					</div>

					{message && (
						<div
							className={`mb-4 p-4 rounded-lg ${
								message.type === "success"
									? "bg-green-50 border border-green-200 text-green-800"
									: "bg-red-50 border border-red-200 text-red-800"
							}`}
						>
							{message.text}
						</div>
					)}

					<button
						onClick={handleSave}
						disabled={
							saving ||
							(timezone === organization?.timezone &&
								bookingInterval ===
									organization?.bookingInterval)
						}
						className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
					>
						<Save className="h-5 w-5 mr-2" />
						{saving ? t("common.saving") : t("common.save")}
					</button>
				</div>
			</div>
		</div>
	)
}
