import { useState } from "react"
import { CrudTable } from "../components/CrudTable"
import { X, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
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
import { useQuery, useQueryClient } from "@tanstack/react-query"

export const ClientsPage = () => {
	const queryClient = useQueryClient()

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1)

	// Fetch clients with pagination
	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["clients_paginated", currentPage],
		queryFn: () => getClients(currentPage, 99999),
		keepPreviousData: true,
	})

	const clients = data?.clients || []
	const pagination = data?.pagination || {}

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
		staleTime: 1000 * 60 * 5,
	})

	const columns = [
		{ key: "full_name", label: "Име и презиме", type: "text" },
		{ key: "phone", label: "Телефон", type: "phone" },
		{ key: "notes", label: "Белешки", type: "text" },
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
				`Дали сте сигурни дека сакате да го избришете ${client.full_name}?`
			)
		) {
			await deleteClientFromClientsPage(client, clients, () => {
				queryClient.invalidateQueries(["clients_paginated"])
			})
		}
	}

	const handleViewHistory = (client) => {
		setSelectedClient(client)
		setShowHistoryModal(true)
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (selectedClient) {
			await patchEditClient(selectedClient, formData, clients, () => {
				queryClient.invalidateQueries(["clients_paginated"])
			})
		} else {
			await postNewClientFromPage(formData, clients, () => {
				queryClient.invalidateQueries(["clients_paginated"])
				// Optionally go to last page where new client would be
			})
		}

		setShowModal(false)
		setFormData({ full_name: "", phone: "", notes: "" })
		setSelectedClient(null)
	}

	const getTotalSpent = (clientId) => {
		const history = getSingleClientHistory(allHistory, clientId)
		return history.reduce((total, booking) => total + booking.price, 0)
	}

	const mkMonthNames = [
		"Јануари",
		"Февруари",
		"Март",
		"Април",
		"Мај",
		"Јуни",
		"Јули",
		"Август",
		"Септември",
		"Октомври",
		"Ноември",
		"Декември",
	]

	// Format date in Macedonian
	const formatDateTimeMK = (dateString) => {
		const date = new Date(dateString)
		const day = date.getDate()
		const month = mkMonthNames[date.getMonth()]
		const year = date.getFullYear()
		const hours = String(date.getHours()).padStart(2, "0")
		const minutes = String(date.getMinutes()).padStart(2, "0")

		return `${day} ${month} ${year}, ${hours}:${minutes}`
	}

	if (isLoading) {
		return (
			<div className="p-4 sm:p-6">
				<div className="max-w-6xl mx-auto">
					<div className="animate-pulse space-y-4">
						<div className="h-8 bg-slate-200 rounded w-1/4"></div>
						<div className="h-96 bg-slate-200 rounded"></div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="p-4 sm:p-6">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="mb-6">
					<h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-poppins">
						Клиенти
					</h1>
					<p className="text-slate-600 mt-1 text-sm sm:text-base">
						Управување со вашите клиенти
					</p>
				</div>

				{/* Info Bar with Pagination */}
				<div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					{/* Pagination Controls */}
					{pagination.totalPages > 1 && (
						<div className="flex items-center gap-2">
							<button
								onClick={() =>
									setCurrentPage((p) => Math.max(1, p - 1))
								}
								disabled={pagination.page === 1 || isFetching}
								className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
							>
								<ChevronLeft className="h-4 w-4 mr-1" />
								Претходна
							</button>
							<span className="text-sm text-slate-600 px-2">
								{pagination.page} / {pagination.totalPages}
							</span>
							<button
								onClick={() => setCurrentPage((p) => p + 1)}
								disabled={!pagination.hasMore || isFetching}
								className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
							>
								Следна
								<ChevronRight className="h-4 w-4 ml-1" />
							</button>
						</div>
					)}
				</div>

				{/* CrudTable - handles search debouncing internally */}
				<CrudTable
					title="Сите Клиенти"
					data={clients}
					columns={columns}
					onAdd={handleAdd}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onView={handleViewHistory}
					searchPlaceholder="Пребарај по име, телефон или белешки..."
					addButtonText="Додади Клиент"
				/>

				{/* Edit/Add Modal */}
				{showModal && (
					<div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
						<div
							className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75"
							onClick={() => setShowModal(false)}
						/>
						<div className="relative w-full max-w-lg mx-auto bg-white rounded-lg sm:rounded-xl shadow-xl transform transition-all">
							{/* Header */}
							<div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200">
								<h3 className="text-base sm:text-lg font-semibold text-slate-800 font-poppins truncate">
									{selectedClient
										? "Уреди Клиент"
										: "Додади Клиент"}
								</h3>
								<button
									onClick={() => setShowModal(false)}
									className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
									aria-label="close modal"
								>
									<X className="h-6 w-6" />
								</button>
							</div>

							{/* Form */}
							<form
								onSubmit={handleSubmit}
								className="px-4 sm:px-6 py-6 space-y-4"
							>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										Име и Презиме *
									</label>
									<input
										type="text"
										required
										value={formData.full_name}
										onChange={(e) =>
											setFormData({
												...formData,
												full_name: e.target.value,
											})
										}
										className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
										placeholder="Внесете име и презиме"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										Телефонски број *
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
										className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
										placeholder="Внесете телефонски број"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										Белешки
									</label>
									<textarea
										value={formData.notes}
										onChange={(e) =>
											setFormData({
												...formData,
												notes: e.target.value,
											})
										}
										maxLength={100}
										className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
										placeholder="Внесете белешки (опционално)"
										rows={3}
									/>
									<p className="text-right text-xs text-slate-500 mt-1">
										{formData.notes?.length || 0}/100
									</p>
								</div>

								{/* Footer */}
								<div className="flex items-center justify-end gap-3 pt-4">
									<button
										type="button"
										onClick={() => {
											setShowModal(false)
											setSelectedClient(null)
											setFormData({
												full_name: "",
												phone: "",
												notes: "",
											})
										}}
										className="px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 min-h-[44px]"
									>
										Откажи
									</button>
									<button
										type="submit"
										className="px-4 py-3 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 min-h-[44px]"
									>
										{selectedClient ? "Зачувај" : "Додади"}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* History Modal */}
				{showHistoryModal && selectedClient && (
					<div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
						<div
							className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75"
							onClick={() => setShowHistoryModal(false)}
						/>
						<div className="relative w-full max-w-2xl mx-auto bg-white rounded-lg sm:rounded-xl shadow-xl transform transition-all">
							{/* Header */}
							<div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200">
								<div className="flex-1 min-w-0">
									<h3 className="text-base sm:text-lg font-semibold text-slate-800 font-poppins truncate">
										Историја на Резервации
									</h3>
									<p className="text-sm text-slate-600 mt-1 truncate">
										{selectedClient.full_name} •{" "}
										{selectedClient.phone}
									</p>
								</div>
								<button
									onClick={() => {
										setShowHistoryModal(false)
										setSelectedClient(null)
									}}
									className="p-2 text-slate-400 hover:text-slate-600 transition-colors ml-4"
									aria-label="close modal"
								>
									<X className="h-6 w-6" />
								</button>
							</div>

							{/* Content */}
							<div className="px-4 sm:px-6 py-6 max-h-[60vh] overflow-y-auto">
								{(() => {
									const history = getSingleClientHistory(
										allHistory,
										selectedClient._id
									)
									const totalSpent = getTotalSpent(
										selectedClient._id
									)

									if (history.length === 0) {
										return (
											<div className="text-center py-12">
												<Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
												<p className="text-slate-500">
													Нема резервации за овој
													клиент
												</p>
											</div>
										)
									}

									return (
										<>
											<div className="mb-4 p-4 bg-slate-50 rounded-lg">
												<div className="text-sm font-medium text-slate-700">
													Вкупно потрошено:
												</div>
												<div className="text-2xl font-bold text-slate-800">
													{totalSpent.toFixed(2)} ден.
												</div>
												<div className="text-sm text-slate-600 mt-1">
													{history.length} резервации
												</div>
											</div>

											<div className="space-y-3">
												{history.map((booking) => (
													<div
														key={booking.id}
														className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
													>
														<div className="flex items-start justify-between mb-2">
															<div className="font-medium text-slate-800">
																{formatDateTimeMK(
																	booking.start_time
																)}
															</div>
															<div className="font-semibold text-slate-800">
																{booking.price.toFixed(
																	2
																)}{" "}
																ден.
															</div>
														</div>
														<div className="text-sm text-slate-600">
															<div className="mb-1">
																<span className="font-medium">
																	Услуги:
																</span>{" "}
																{booking.services
																	.map(
																		(s) =>
																			s.name
																	)
																	.join(", ")}
															</div>
															<div>
																<span className="font-medium">
																	Служител:
																</span>{" "}
																{
																	booking
																		.employee
																		.name
																}
															</div>
															{booking.notes && (
																<div className="mt-2 text-slate-500 italic">
																	"
																	{
																		booking.notes
																	}
																	"
																</div>
															)}
														</div>
													</div>
												))}
											</div>
										</>
									)
								})()}
							</div>

							{/* Footer */}
							<div className="flex items-center justify-end px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50">
								<button
									onClick={() => {
										setShowHistoryModal(false)
										setSelectedClient(null)
									}}
									className="px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 min-h-[44px]"
								>
									Затвори
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
