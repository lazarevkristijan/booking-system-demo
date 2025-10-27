// client/src/pages/OrganizationSettingsPage.jsx
import { useState, useEffect } from "react"
import { Save, Clock, AlertTriangle } from "lucide-react"
import { useOrganization } from "../contexts/OrganizationContext"
import axios from "axios"
import { SERVER_API } from "../constants"

export const OrganizationSettingsPage = () => {
	const { organization, refreshOrganization } = useOrganization()
	const [bookingInterval, setBookingInterval] = useState(15)
	const [displayStartTime, setDisplayStartTime] = useState("08:00")
	const [displayEndTime, setDisplayEndTime] = useState("20:00")
	const [saving, setSaving] = useState(false)
	const [message, setMessage] = useState(null)

	useEffect(() => {
		if (organization?.bookingInterval) {
			setBookingInterval(organization.bookingInterval)
		}
		if (organization?.displayStartTime) {
			setDisplayStartTime(organization.displayStartTime)
		}
		if (organization?.displayEndTime) {
			setDisplayEndTime(organization.displayEndTime)
		}
	}, [organization])

	const handleSave = async () => {
		if (!organization?.id) return

		// Validate times
		const [startHour, startMin] = displayStartTime.split(":").map(Number)
		const [endHour, endMin] = displayEndTime.split(":").map(Number)
		const startMinutes = startHour * 60 + startMin
		const endMinutes = endHour * 60 + endMin

		if (startMinutes >= endMinutes) {
			setMessage({
				type: "error",
				text: "Почетното време мора да биде пред крајното време",
			})
			return
		}

		setSaving(true)
		setMessage(null)

		try {
			await axios.patch(
				`${SERVER_API}/organizations/${organization.id}/settings`,
				{
					bookingInterval,
					displayStartTime,
					displayEndTime,
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

	const hasChanges =
		bookingInterval !== organization?.bookingInterval ||
		displayStartTime !== (organization?.displayStartTime || "08:00") ||
		displayEndTime !== (organization?.displayEndTime || "20:00")

	return (
		<div className="p-4 sm:p-6">
			<div className="max-w-3xl mx-auto">
				<h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6">
					Подесувања на Организација
				</h1>

				<div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6">
					{/* Booking Interval Section */}
					<div className="border-b pb-6">
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

						{bookingInterval !== organization?.bookingInterval && (
							<div className="mt-4 p-4 bg-amber-50 border border-amber-300 rounded-lg">
								<div className="flex items-start gap-3">
									<AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
									<div className="flex-1">
										<p className="text-sm font-semibold text-amber-900 mb-2">
											Внимание при промена на интервалот
										</p>
										<p className="text-sm text-amber-800 mb-2">
											Промената од 15 на 30 минути ќе
											значи дека{" "}
											<strong>
												нема да можете да креирате нови
												термини на "непарни" 15-минутни
												интервали
											</strong>{" "}
											(на пр. 10:15, 10:45).
										</p>
										<p className="text-sm text-amber-800">
											Промената на интервалот може да
											влијае на приказот на постоечките
											термини.
										</p>
									</div>
								</div>
							</div>
						)}

						<div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
							<p className="text-sm text-green-800">
								<strong>Тековен Интервал:</strong>{" "}
								{organization?.bookingInterval || 15} минути
							</p>
						</div>
					</div>

					{/* Display Time Range Section */}
					<div className="border-b pb-6">
						<h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
							<Clock className="h-5 w-5 mr-2 text-blue-600" />
							Работно Време - Приказ на Термини
						</h2>
						<p className="text-sm text-slate-600 mb-4">
							Изберете од кое до кое време да се прикажуваат
							термините во дневниот и неделниот преглед на
							календарот. Термините надвор од ова време нема да се
							прикажуваат во календарот, но ќе останат зачувани.
						</p>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-2">
									Почетно Време
								</label>
								<input
									type="time"
									value={displayStartTime}
									onChange={(e) =>
										setDisplayStartTime(e.target.value)
									}
									step={900}
									className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-2">
									Крајно Време
								</label>
								<input
									type="time"
									value={displayEndTime}
									onChange={(e) =>
										setDisplayEndTime(e.target.value)
									}
									step={900}
									className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
								/>
							</div>
						</div>

						<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<p className="text-sm text-blue-800">
								<strong>Тековно Работно Време:</strong>{" "}
								{organization?.displayStartTime || "08:00"} -{" "}
								{organization?.displayEndTime || "20:00"}
							</p>
						</div>

						<div className="mt-4 p-4 bg-amber-50 border border-amber-300 rounded-lg">
							<div className="flex items-start gap-3">
								<AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
								<div className="flex-1">
									<p className="text-sm font-semibold text-amber-900 mb-2">
										Напомена
									</p>
									<p className="text-sm text-amber-800">
										Постоечките термини надвор од избраниот
										временски опсег{" "}
										<strong>нема да се прикажуваат</strong>{" "}
										во календарот, но ќе останат зачувани во
										системот. Ако имате термини надвор од
										работното време, ќе видите
										предупредување.
									</p>
								</div>
							</div>
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
						disabled={saving || !hasChanges}
						className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
					>
						<Save className="h-5 w-5 mr-2" />
						{saving ? "Зачувување..." : "Зачувај Подесувања"}
					</button>
				</div>
			</div>
		</div>
	)
}
