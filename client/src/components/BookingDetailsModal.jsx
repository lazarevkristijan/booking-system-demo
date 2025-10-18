import axios from "axios"
axios.defaults.withCredentials = true
import { Phone, StickyNote, Trash, User, X } from "lucide-react"
import { useState } from "react"
import ConfirmModal from "./ConfirmModal"
import {
	deleteBookingFromModal,
	getClientsBookingHystory,
	getSingleClientHistory,
} from "../constants"
import { useQuery } from "@tanstack/react-query"

export const BookingDetailsModal = ({
	isOpen,
	onClose,
	booking,
	onDeleted,
}) => {
	const [showConfirm, setShowConfirm] = useState(false)
	const { data: allHistory } = useQuery({
		queryKey: ["all_booking_history"],
		queryFn: getClientsBookingHystory,
	})

	if (!isOpen || !booking) return null

	const handleCallClient = (phone) => {
		window.open(`tel:${phone}`)
	}

	const clientHistory = getSingleClientHistory(allHistory, booking.client._id)

	return (
		<div className="fixed inset-0 top-50 z-50 overflow-y-auto">
			<div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
				<div
					className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75"
					onClick={onClose}
				/>

				<div className="relative w-full max-w-2xl mx-auto bg-white rounded-lg sm:rounded-xl shadow-xl transform transition-all">
					{/* Header */}
					<div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200">
						<div className="min-w-0 flex-1 mr-4">
							<h3 className="text-base sm:text-lg font-semibold text-slate-800 font-poppins truncate">
								Детали за резервацијата
							</h3>
							<p className="text-xs sm:text-sm text-slate-600 mt-1 truncate">
								{new Date(booking.startTime).toLocaleString(
									"mk-MK"
								)}{" "}
								-{" "}
								{new Date(booking.endTime).toLocaleTimeString(
									"mk-MK"
								)}
							</p>
						</div>
						<button
							onClick={onClose}
							className="p-2 text-slate-400 hover:text-slate-600 transition-colors touch-manipulation"
							aria-label="close modal"
						>
							<X className="h-6 w-6" />
						</button>
					</div>

					{/* Content */}
					<div className="px-4 sm:px-6 py-6 max-h-[60vh] sm:max-h-none overflow-y-auto space-y-4">
						<div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
							<p>
								<span className="font-medium text-slate-700">
									Клиент:{" "}
								</span>
								{booking.client?.name || "—"}
							</p>
							<p>
								<span className="font-medium text-slate-700">
									Телефон:{" "}
								</span>
								{booking.client?.phone || "—"}
							</p>
							<p>
								<span className="font-medium text-slate-700">
									Вработен:{" "}
								</span>
								{booking.employee?.name || "—"}
							</p>
							<p>
								<span className="font-medium text-slate-700">
									Услуги:{" "}
								</span>
								{booking.services
									?.map((s) => s.name)
									.join(", ") || "—"}
							</p>
							<p>
								<span className="font-medium text-slate-700">
									Вкупно време:{" "}
								</span>
								{booking.services
									.map((s) => s.duration)
									.reduce((accumulator, currentValue) => {
										return accumulator + currentValue
									}, 0)}{" "}
								минути
							</p>
							<p>
								<span className="font-medium text-slate-700">
									Цена:{" "}
								</span>
								{booking.price.toFixed(2)} ден.
							</p>
							{booking.notes && (
								<div>
									<div className="flex justify-center gap-2 mt-2">
										<StickyNote className="w-4 h-4 text-blue-500 mt-1" />
										<div>
											<p className="text-sm font-medium text-slate-700">
												Белешка за резервацијата:
											</p>
											<p className="text-slate-700 text-sm">
												{booking.notes}
											</p>
										</div>
									</div>
								</div>
							)}

							{booking.client?.notes && (
								<div className="flex justify-center items-start gap-2 mt-2">
									<User className="w-4 h-4 text-amber-500 mt-1" />
									<div>
										<p className="text-sm font-medium text-slate-700">
											Белешка за клиентот:
										</p>
										<p className="text-slate-700 text-sm">
											{booking.client.notes}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>

					{clientHistory.length !== 0 && (
						<>
							<div className="px-4 sm:px-6 py-6 border-t border-slate-200 bg-slate-50">
								<h4 className="text-sm sm:text-base font-semibold text-slate-800 mb-3">
									Последни резервации
								</h4>
								{clientHistory.filter(
									(ch) => ch.id !== booking._id
								).length === 0 ? (
									<p className="text-slate-500 text-sm">
										Нема претходни резервации
									</p>
								) : (
									<div className="space-y-3">
										{clientHistory
											.filter(
												(ch) => ch.id !== booking._id
											)
											.slice(0, 3)
											.map((b) => (
												<div
													key={b.id}
													className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
												>
													<div className="min-w-0 flex-1">
														<div className="font-medium text-slate-800 text-sm truncate">
															{b.services
																.map(
																	(s) =>
																		s.name
																)
																.join(", ") ||
																"—"}
														</div>
														<div className="text-xs text-slate-600">
															{new Date(
																b.start_time
															).toLocaleDateString(
																"mk-MK"
															)}{" "}
															•{" "}
															{b.employee?.name ||
																"—"}
														</div>
														{}
														{b.notes && (
															<div className="text-xs text-slate-500 mt-1 italic">
																📝 {b.notes}
															</div>
														)}
													</div>
													<div className="text-right flex-shrink-0 text-sm font-semibold text-slate-800">
														{b.price.toFixed(2)}{" "}
														ден.
													</div>
												</div>
											))}
									</div>
								)}
							</div>
						</>
					)}

					{/* Footer */}
					<div className="flex items-center justify-end px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 gap-3">
						<button
							onClick={() =>
								handleCallClient(booking.client?.phone)
							}
							className="flex items-center gap-2 px-4 py-3 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 touch-manipulation min-h-[44px]"
						>
							<Phone className="w-4 h-4" />
						</button>
						<button
							onClick={onClose}
							className="px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 touch-manipulation min-h-[44px]"
						>
							Затвори
						</button>
						<button
							onClick={() => setShowConfirm(true)}
							className="px-4 py-3 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 touch-manipulation min-h-[44px]"
						>
							<Trash />
						</button>
					</div>
				</div>
			</div>
			<ConfirmModal
				isOpen={showConfirm}
				onClose={() => setShowConfirm(false)}
				onConfirm={async () => {
					setShowConfirm(false)
					await deleteBookingFromModal(booking, onDeleted, onClose)
				}}
			/>
		</div>
	)
}

export default BookingDetailsModal
