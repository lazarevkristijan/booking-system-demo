import { useState } from "react"
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
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

export const ClientsPage = () => {
	const { t } = useTranslation()
	const queryClient = useQueryClient()

	// Pagination and search state
	const [currentPage, setCurrentPage] = useState(1)
	const [searchTerm, setSearchTerm] = useState("")
	const pageSize = 50

	const [showModal, setShowModal] = useState(false)
	const [showHistoryModal, setShowHistoryModal] = useState(false)
	const [selectedClient, setSelectedClient] = useState(null)
	const [formData, setFormData] = useState({
		full_name: "",
		phone: "",
		notes: "",
	})

	// Fetch clients with pagination and search
	const { data, isFetching } = useQuery({
		queryKey: ["clients_paginated", currentPage, searchTerm],
		queryFn: () => getClients(currentPage, pageSize, searchTerm),
		keepPreviousData: true,
	})

	const clients = data?.clients || []
	const pagination = data?.pagination || { total: 0, totalPages: 0 }

	const { data: allHistory } = useQuery({
		queryKey: ["all_booking_history"],
		queryFn: getClientsBookingHystory,
		staleTime: 1000 * 60 * 5,
	})

	const columns = [
		{ key: "full_name", label: t("clients.name"), type: "text" },
		{ key: "phone", label: t("clients.phone"), type: "phone" },
		{ key: "notes", label: t("clients.notes"), type: "text" },
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
				`${t("clients.deleteConfirm")} - ${client.full_name}`
			)
		) {
			await deleteClientFromClientsPage(client, clients, () => {
				queryClient.invalidateQueries(["clients_paginated"])
			})
			queryClient.invalidateQueries(["clients"])
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
				// Optionally go to last page or stay on current
			})
		}

		queryClient.invalidateQueries(["clients"])

		setShowModal(false)
		setFormData({ full_name: "", phone: "", notes: "" })
		setSelectedClient(null)
	}

	const getTotalSpent = (clientId) => {
		const history = getSingleClientHistory(allHistory, clientId)
		return history.reduce((total, booking) => total + booking.price, 0)
	}

	// Format date with i18n
	const formatDateTimeMK = (dateString) => {
		const date = new Date(dateString)
		const day = date.getDate()
		const monthKey = [
			"january",
			"february",
			"march",
			"april",
			"may",
			"june",
			"july",
			"august",
			"september",
			"october",
			"november",
			"december",
		][date.getMonth()]
		const month = t(`months.${monthKey}`)
		const year = date.getFullYear()
		const hours = String(date.getHours()).padStart(2, "0")
		const minutes = String(date.getMinutes()).padStart(2, "0")

		return `${day} ${month} ${year}, ${hours}:${minutes}`
	}

	return (
		<div className="p-4 sm:p-6">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="mb-6">
					<h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-poppins">
						{t("clients.title")}
					</h1>
					<p className="text-slate-600 mt-1 text-sm sm:text-base">
						{t("clients.subtitle")}
					</p>
				</div>

				{/* CrudTable with server-side pagination */}
				<CrudTable
					title={t("clients.tableTitle")}
					data={clients}
					columns={columns}
					onAdd={handleAdd}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onView={handleViewHistory}
					searchPlaceholder={t("clients.searchPlaceholder")}
					addButtonText={t("clients.addClient")}
					// Server-side pagination props
					serverSidePagination={true}
					totalItems={pagination.total}
					currentPage={currentPage}
					pageSize={pageSize}
					onPageChange={setCurrentPage}
					onSearchChange={setSearchTerm}
					isLoading={isFetching}
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
										? t("clients.editClient")
										: t("clients.addClient")}
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
										{t("clients.fullNameLabel")}
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
										placeholder={t(
											"clients.fullNamePlaceholder"
										)}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										{t("clients.phoneLabel")}
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
										placeholder={t(
											"clients.phonePlaceholder"
										)}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										{t("clients.notesLabel")}
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
										placeholder={t(
											"clients.notesPlaceholder"
										)}
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
										{t("common.cancel")}
									</button>
									<button
										type="submit"
										className="px-4 py-3 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 min-h-[44px]"
									>
										{selectedClient
											? t("common.save")
											: t("common.add")}
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
										{t("clients.bookingHistory")}
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
													{t("clients.noBookings")}
												</p>
											</div>
										)
									}

									return (
										<>
											<div className="mb-4 p-4 bg-slate-50 rounded-lg">
												<div className="text-sm font-medium text-slate-700">
													{t("clients.totalSpent")}
												</div>
												<div className="text-2xl font-bold text-slate-800">
													{totalSpent.toFixed(2)}{" "}
													{t("common.currency")}
												</div>
												<div className="text-sm text-slate-600 mt-1">
													{history.length}{" "}
													{t("clients.bookingsCount")}
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
																	{t(
																		"bookings.services"
																	)}
																	:
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
																	{t(
																		"clients.employee"
																	)}
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
									{t("common.close")}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
