// client/src/pages/OrganizationSettingsPage.jsx
import { useState, useEffect } from "react"
import { Save, Clock } from "lucide-react"
import { useOrganization } from "../contexts/OrganizationContext"
import axios from "axios"
import { SERVER_API } from "../constants"

export const OrganizationSettingsPage = () => {
	const { organization, refreshOrganization } = useOrganization()
	const [bookingInterval, setBookingInterval] = useState(15)
	const [saving, setSaving] = useState(false)
	const [message, setMessage] = useState(null)

	useEffect(() => {
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
					bookingInterval,
				},
				{ withCredentials: true }
			)

			await refreshOrganization()
			setMessage({
				type: "success",
				text: "Подесувањата се успешно зачувани!",
			})
		} catch (error) {
			console.error("Error saving settings:", error)
			setMessage({
				type: "error",
				text:
					error.response?.data?.error ||
					"Грешка при зачувување на подесувањата",
			})
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="p-4 sm:p-6">
			<div className="max-w-3xl mx-auto">
				<h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6">
					Подесувања на Организација
				</h1>

				<div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
					<div className="mb-6 border-t pt-6">
						<h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
							<Clock className="h-5 w-5 mr-2 text-green-600" />
							Интервал на Термини
						</h2>
						<p className="text-sm text-slate-600 mb-4">
							Изберете го временскиот интервал за прикажување на
							термините во календарот (15 или 30 минути).
						</p>

						<label className="block text-sm font-medium text-slate-700 mb-2">
							Избери Интервал на Резервација
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
								<div className="text-sm">минути</div>
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
								<div className="text-sm">минути</div>
							</button>
						</div>

						<div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
							<p className="text-sm text-green-800">
								<strong>Тековен Интервал:</strong>{" "}
								{organization?.bookingInterval || 15} минути
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
							bookingInterval === organization?.bookingInterval
						}
						className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
					>
						<Save className="h-5 w-5 mr-2" />
						{saving ? "Зачувување..." : "Зачувај Подесувања"}
					</button>
				</div>
			</div>
		</div>
	)
}
