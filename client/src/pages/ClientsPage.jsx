import { useEffect, useState } from "react"
import { CrudTable } from "../components/CrudTable"
import { X, Calendar } from "lucide-react"
import axios from "axios"
axios.defaults.withCredentials = true
import {
	deleteClientFromClientsPage,
	getClients,
	getClientsBookingHystory,
	getSingleClientHistory,
	patchEditClient,
	postNewClientFromPage,
} from "../constants"
import { useQuery } from "@tanstack/react-query"

export const ClientsPage = () => {
	const [clients, setClients] = useState([])

	const { data: allClients } = useQuery({
		queryKey: ["clients"],
		queryFn: () => getClients(),
	})

	useEffect(() => {
		if (allClients) setClients(allClients)
	}, [allClients])

	const [showModal, setShowModal] = useState(false)
	const [showHistoryModal, setShowHistoryModal] = useState(false)
	const [selectedClient, setSelectedClient] = useState(null)
	const [formData, setFormData] = useState({
		full_name: "",
		phone: "",
		notes: "",
	})

	const { data: allHistory } = useQuery({
		queryKey: ["all_booking_history"],
		queryFn: getClientsBookingHystory,
	})

	const columns = [
		{ key: "full_name", label: "Име и фамилия", type: "text" },
		{ key: "phone", label: "Телефон", type: "phone" },
		{ key: "notes", label: "Бележки", type: "text" },
	]

	const handleAdd = () => {
		setSelectedClient(null)
		setFormData({ full_name: "", phone: "", notes: "" })
		setShowModal(true)
	}

	const handleEdit = (client) => {
		setSelectedClient(client)
		setFormData({
			full_name: client.full_name,
			phone: client.phone,
			notes: client.notes,
			isHidden: client.isHidden,
		})
		setShowModal(true)
	}

	const handleDelete = async (client) => {
		if (
			window.confirm(
				`Сигурни ли сте, че искате да изтриете ${client.full_name}?`
			)
		) {
			await deleteClientFromClientsPage(client, clients, setClients)
		}
	}

	const handleViewHistory = (client) => {
		setSelectedClient(client)
		setShowHistoryModal(true)
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (selectedClient) {
			await patchEditClient(selectedClient, formData, clients, setClients)
		} else {
			await postNewClientFromPage(formData, clients, setClients)
		}

		setShowModal(false)
		setFormData({ full_name: "", phone: "", notes: "" })
		setSelectedClient(null)
	}

	const getTotalSpent = (clientId) => {
		const history = getSingleClientHistory(allHistory, clientId)
		return history.reduce((total, booking) => total + booking.price, 0)
	}

	return (
		<div className="p-4 sm:p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-poppins">
						Клиенти
					</h1>
					<p className="text-slate-600 mt-1 text-sm sm:text-base">
						Управление на базата данни с клиенти и история на
						резервациите
					</p>
				</div>

				{/* CRUD Table */}
				<CrudTable
					title="База данни с клиенти"
					data={clients}
					columns={columns}
					onAdd={handleAdd}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onView={handleViewHistory}
					searchPlaceholder="Търсене на клиенти..."
					addButtonText="Добави клиент"
				/>

				{/* Add/Edit Modal */}
				{showModal && (
					<div className="fixed inset-0 z-50 overflow-y-auto">
						<div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
							<div
								className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75"
								onClick={() => setShowModal(false)}
							/>

							<div className="relative w-full max-w-md mx-auto bg-white rounded-lg sm:rounded-xl shadow-xl transform transition-all">
								<form onSubmit={handleSubmit}>
									{/* Header */}
									<div className="px-4 sm:px-6 py-4 border-b border-slate-200">
										<h3 className="text-base sm:text-lg font-semibold text-slate-800 font-poppins">
											{selectedClient
												? "Редактирай клиент"
												: "Добави нов клиент"}
										</h3>
									</div>

									{/* Content */}
									<div className="px-4 sm:px-6 py-6 space-y-4">
										<div>
											<label className="block text-sm font-medium text-slate-700 mb-2">
												Име и фамилия *
											</label>
											<input
												type="text"
												required
												value={formData.full_name}
												onChange={(e) =>
													setFormData({
														...formData,
														full_name:
															e.target.value,
													})
												}
												className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent touch-manipulation"
												placeholder="Въведете име и фамилия на клиента"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-slate-700 mb-2">
												Телефонен номер *
											</label>
											<input
												type="tel"
												required
												value={formData.phone}
												onChange={(e) =>
													setFormData({
														...formData,
														phone: e.target.value,
													})
												}
												className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent touch-manipulation"
												placeholder="Въведете телефонен номер"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-slate-700 mb-2">
												Бележки
											</label>
											<textarea
												type="text"
												value={formData.notes}
												onChange={(e) =>
													setFormData({
														...formData,
														notes: e.target.value,
													})
												}
												maxLength={100}
												className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent touch-manipulation"
											/>
											<p className="text-right">
												{formData?.notes?.length || "0"}
												/100
											</p>
										</div>
									</div>

									{/* Footer */}
									<div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50">
										<button
											type="button"
											onClick={() => setShowModal(false)}
											className="px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 touch-manipulation min-h-[44px]"
										>
											Отказ
										</button>
										<button
											type="submit"
											className="px-6 py-3 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 touch-manipulation min-h-[44px]"
										>
											{selectedClient
												? "Обнови"
												: "Създай"}{" "}
											клиент
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				)}

				{/* History Modal */}
				{showHistoryModal && selectedClient && (
					<div className="fixed inset-0 z-50 overflow-y-auto">
						<div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
							<div
								className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75"
								onClick={() => setShowHistoryModal(false)}
							/>

							<div className="relative w-full max-w-2xl mx-auto bg-white rounded-lg sm:rounded-xl shadow-xl transform transition-all">
								{/* Header */}
								<div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200">
									<div className="min-w-0 flex-1 mr-4">
										<h3 className="text-base sm:text-lg font-semibold text-slate-800 font-poppins">
											История на резервациите
										</h3>
										<p className="text-xs sm:text-sm text-slate-600 mt-1 truncate">
											{selectedClient.full_name} •{" "}
											{selectedClient.phone}
										</p>
									</div>
									<button
										onClick={() =>
											setShowHistoryModal(false)
										}
										className="p-2 text-slate-400 hover:text-slate-600 transition-colors touch-manipulation"
									>
										<X className="h-6 w-6" />
									</button>
								</div>

								{/* Stats */}
								<div className="px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-200">
									<div className="grid grid-cols-2 gap-4">
										<div className="text-center">
											<div className="text-xl sm:text-2xl font-bold text-slate-800">
												{
													getSingleClientHistory(
														allHistory,
														selectedClient._id
													).length
												}
											</div>
											<div className="text-xs sm:text-sm text-slate-600">
												Общо посещения
											</div>
										</div>
										<div className="text-center">
											<div className="text-xl sm:text-2xl font-bold text-slate-800">
												{getTotalSpent(
													selectedClient._id
												).toFixed(2)}{" "}
												лв.
											</div>
											<div className="text-xs sm:text-sm text-slate-600">
												Общо похарчено
											</div>
										</div>
									</div>
								</div>
								{/* Client Notes Section */}
								{selectedClient.notes && (
									<div className="bg-blue-50 border border-blue-200 rounded-lg p-1">
										<div className="flex items-start">
											<div className="ml-3 flex-1">
												<h4 className="text-sm font-medium text-blue-800 mb-1">
													Бележки за клиента
												</h4>
												<p className="text-sm text-blue-700 whitespace-pre-wrap">
													{selectedClient.notes}
												</p>
											</div>
										</div>
									</div>
								)}

								{/* History List */}
								<div className="px-4 sm:px-6 py-4 max-h-96 overflow-y-auto">
									{getSingleClientHistory(
										allHistory,
										selectedClient._id
									).length === 0 ? (
										<div className="text-center py-8">
											<Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
											<p className="text-slate-500 text-sm">
												Няма история на резервации
											</p>
										</div>
									) : (
										<div className="space-y-3">
											{getSingleClientHistory(
												allHistory,
												selectedClient._id
											).map((booking) => (
												<div
													key={booking.id}
													className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-lg gap-3 sm:gap-4"
												>
													<div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
														<div className="flex-shrink-0">
															<Calendar className="h-5 w-5 text-slate-400" />
														</div>
														<div className="min-w-0 flex-1">
															<div className="font-medium text-slate-800 text-sm sm:text-base">
																{Array.isArray(
																	booking.services
																)
																	? booking.services
																			.map(
																				(
																					s
																				) =>
																					s.name
																			)
																			.join(
																				", "
																			)
																	: booking.services}
															</div>
															<div className="text-xs sm:text-sm text-slate-600">
																{new Date(
																	booking.start_time
																).toLocaleDateString()}{" "}
																•{" "}
																{
																	booking
																		.employee
																		.name
																}
																{/* notes display */}
																{booking.notes && (
																	<div className="text-xs text-slate-500 mt-1 italic">
																		📝{" "}
																		{
																			booking.notes
																		}
																	</div>
																)}
															</div>
														</div>
													</div>
													<div className="text-right sm:text-left flex-shrink-0">
														<div className="font-semibold text-slate-800 text-sm sm:text-base">
															{booking.price.toFixed(
																2
															)}{" "}
															лв.
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Footer */}
								<div className="px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50">
									<button
										onClick={() =>
											setShowHistoryModal(false)
										}
										className="w-full px-4 py-3 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 touch-manipulation min-h-[44px]"
									>
										Затвори
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
