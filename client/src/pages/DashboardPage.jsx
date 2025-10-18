/**
 * @description This file defines the main dashboard page for the hairstylist booking platform.
 * It displays a beautiful calendar interface with existing bookings and provides functionality to add new bookings.
 * The component includes BookingModal integration for creating appointments and handles calendar navigation.
 * Key variables include selectedDate for calendar state, showBookingModal for modal visibility, and bookings for appointment data.
 */
import { useState } from "react"
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { BookingModal } from "../components/BookingModal"
import axios from "axios"
axios.defaults.withCredentials = true
import { getBookings, getEmployees, capitalize } from "../constants"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import BookingDetailsModal from "../components/BookingDetailsModal"

export const DashboardPage = () => {
	const [selectedDate, setSelectedDate] = useState(new Date())
	const [showBookingModal, setShowBookingModal] = useState(false)
	const [selectedDateTime, setSelectedDateTime] = useState(null)
	const [bookings, setBookings] = useState([])
	const [selectedBooking, setSelectedBooking] = useState(null)
	const [showBookingDetailsModal, setShowBookingDetailsModal] =
		useState(false)

	const [viewMode, setViewMode] = useState("month")
	const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)

	const { data: allBookings = [] } = useQuery({
		queryKey: ["all_bookings", selectedDate],
		queryFn: () =>
			getBookings(
				selectedDate.getMonth() + 1,
				selectedDate.getFullYear()
			),
		refetchInterval: 30000,
		refetchIntervalInBackground: false,
	})

	const { data: allEmployees = [] } = useQuery({
		queryKey: ["all_employees"],
		queryFn: getEmployees,
	})

	useEffect(() => {
		if (JSON.stringify(bookings) !== JSON.stringify(allBookings)) {
			setBookings(allBookings)
		}
	}, [allBookings])

	// Handler for adding new booking to state
	const handleBookingCreated = (newBooking) => {
		if (newBooking !== null) {
			setBookings((prevBookings) => [...prevBookings, newBooking])
		}
		setShowBookingModal(false)
		setViewMode("month")
	}

	const timeSlots = Array.from({ length: 25 }, (_, i) => {
		const hour = Math.floor(8 + i / 2)
		const minute = (i % 2) * 30
		return `${hour}:${minute.toString().padStart(2, "0")}`
	})

	const getWeekDays = (date) => {
		const week = []
		const startOfWeek = new Date(date)
		const day = startOfWeek.getDay()
		// Adjust for Monday start (0 = Sunday, 1 = Monday)
		const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
		startOfWeek.setDate(diff)

		for (let i = 0; i < 7; i++) {
			const weekDay = new Date(startOfWeek)
			weekDay.setDate(startOfWeek.getDate() + i)
			week.push(weekDay)
		}
		return week
	}

	const getMonthDays = (date) => {
		const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
		const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
		const startDay = monthStart.getDay() // Sunday = 0

		const days = []

		// Add leading empty days
		for (let i = 0; i < (startDay === 0 ? 6 : startDay - 1); i++) {
			days.push(null)
		}

		// Add all month days
		for (let i = 1; i <= monthEnd.getDate(); i++) {
			days.push(new Date(date.getFullYear(), date.getMonth(), i))
		}

		// Fill the remaining days to complete the last week
		while (days.length % 7 !== 0) {
			days.push(null)
		}

		return days
	}

	const isSameDay = (date1, date2) =>
		date1?.toDateString() === date2?.toDateString()

	const weekDays = getWeekDays(selectedDate)
	const monthDays = getMonthDays(selectedDate)

	const getBookingsForTimeSlot = (day, timeSlot, employeeId = null) => {
		const [hourStr, minuteStr] = timeSlot.split(":")
		const hour = parseInt(hourStr)
		const minute = parseInt(minuteStr)

		const slotStart = new Date(day)
		slotStart.setHours(hour, minute, 0, 0)
		const slotEnd = new Date(day)
		slotEnd.setHours(hour, minute + 29, 59, 999)

		return bookings.filter((booking) => {
			const bookingDate = new Date(booking.startTime)
			const timeMatch = bookingDate >= slotStart && bookingDate <= slotEnd
			const employeeMatch =
				employeeId === null || booking.employee?._id === employeeId
			return timeMatch && employeeMatch
		})
	}

	const handleTimeSlotClick = (day, timeSlot, employeeId = null) => {
		const [hourStr, minuteStr] = timeSlot.split(":")
		const hour = parseInt(hourStr)
		const minute = parseInt(minuteStr)

		const selectedDateTime = new Date(day)
		selectedDateTime.setHours(hour, minute, 0, 0)
		setSelectedEmployeeId(employeeId)
		setSelectedDateTime(selectedDateTime)
		setShowBookingModal(true)
	}

	const navigateDay = (direction) => {
		const newDate = new Date(selectedDate)
		newDate.setDate(selectedDate.getDate() + direction)
		setSelectedDate(newDate)
	}

	const navigateWeek = (direction) => {
		const newDate = new Date(selectedDate)
		newDate.setDate(selectedDate.getDate() + direction * 7)
		setSelectedDate(newDate)
	}

	const isToday = (date) => {
		const today = new Date()
		return date.toDateString() === today.toDateString()
	}

	return (
		<div className="p-4 sm:p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-poppins">
								Табло
							</h1>
							<p className="text-slate-600 mt-1 text-sm sm:text-base">
								Управление на вашите часове и резервации
							</p>
							<button
								onClick={() => setViewMode("month")}
								className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors touch-manipulation min-h-[44px] mt-2"
							>
								<Calendar className="h-5 w-5 mr-2" />
								Месечен изглед
							</button>
						</div>
					</div>
				</div>

				{/* Calendar */}
				<div className="bg-white rounded-lg shadow-sm border border-slate-200">
					{viewMode === "month" ? (
						<>
							{viewMode === "month" && (
								<div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
									<div className="flex justify-between items-center mb-4">
										<button
											onClick={() =>
												setSelectedDate(
													new Date(
														selectedDate.getFullYear(),
														selectedDate.getMonth() -
															1,
														1
													)
												)
											}
											className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
										>
											<ChevronLeft className="h-5 w-5 text-slate-500" />
										</button>
										<h2 className="text-lg sm:text-xl font-semibold text-slate-800 font-poppins">
											{capitalize(
												selectedDate.toLocaleDateString(
													"bg-BG",
													{
														month: "long",
														year: "numeric",
													}
												)
											)}
										</h2>
										<button
											onClick={() =>
												setSelectedDate(
													new Date(
														selectedDate.getFullYear(),
														selectedDate.getMonth() +
															1,
														1
													)
												)
											}
											className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
										>
											<ChevronRight className="h-5 w-5 text-slate-500" />
										</button>
									</div>

									{/* Weekday headers */}
									<div className="grid grid-cols-7 border-b border-slate-200 text-center font-medium text-slate-500 mb-2">
										{[
											"Пн",
											"Вт",
											"Ср",
											"Чт",
											"Пт",
											"Сб",
											"Нд",
										].map((d) => (
											<div
												key={d}
												className="p-2 sm:p-3 border border-slate-200 bg-slate-50"
											>
												{d}
											</div>
										))}
									</div>

									{/* Month grid */}
									<div className="grid grid-cols-7 gap-1">
										{monthDays.map((day, index) => {
											const dayBookings = day
												? bookings.filter(
														(b) =>
															new Date(
																b.startTime
															).toDateString() ===
															day.toDateString()
												  )
												: []

											return (
												<div
													key={index}
													className={`min-h-[80px] p-2 sm:p-3 rounded-lg cursor-pointer transition-colors border border-slate-200 relative ${
														day
															? "hover:bg-slate-50"
															: "bg-transparent pointer-events-none"
													} ${
														day &&
														isSameDay(
															day,
															new Date()
														)
															? "bg-blue-50 border-blue-400"
															: ""
													}`}
													onClick={() => {
														if (day) {
															setSelectedDate(day)
															setViewMode("day")
														}
													}}
												>
													<div
														className={`font-medium ${
															dayBookings.length >
															0
																? "text-blue-800"
																: "text-slate-700"
														}`}
													>
														{day
															? day.getDate()
															: ""}
													</div>
													{/* Small dots for bookings */}
													<div className="flex flex-wrap mt-1 gap-1">
														{dayBookings
															.slice(0, 3)
															.map((b) => (
																<span
																	key={b._id}
																	className="w-2 h-2 bg-blue-600 rounded-full"
																	title={`${
																		b.client
																			?.name
																	} - ${b.services
																		.map(
																			(
																				s
																			) =>
																				s.name
																		)
																		.join(
																			", "
																		)}`}
																></span>
															))}
														{dayBookings.length >
															3 && (
															<span className="text-xs text-slate-500">
																+
																{dayBookings.length -
																	3}
															</span>
														)}
													</div>
												</div>
											)
										})}
									</div>
								</div>
							)}
						</>
					) : viewMode === "week" ? (
						<>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-4 border-b border-slate-200">
								<h2 className="text-lg sm:text-xl font-semibold text-slate-800 font-poppins truncate">
									Седмица на{" "}
									{weekDays[0].toLocaleDateString("bg-BG", {
										month: "long",
										day: "numeric",
										year: "numeric",
									})}
								</h2>
								<div className="flex items-center justify-center sm:justify-end gap-2">
									<button
										onClick={() => navigateWeek(-1)}
										className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation"
									>
										<ChevronLeft className="h-5 w-5" />
									</button>
									<button
										onClick={() =>
											setSelectedDate(new Date())
										}
										className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation min-h-[44px]"
									>
										Днес
									</button>
									<button
										onClick={() => navigateWeek(1)}
										className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation"
									>
										<ChevronRight className="h-5 w-5" />
									</button>
								</div>
							</div>

							{/* Calendar Grid */}
							<div className="overflow-x-auto">
								<div className="min-w-[800px]">
									{/* Day Headers */}
									<div className="grid grid-cols-8 border-b border-slate-200">
										<div className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-slate-500 sticky left-0 bg-white z-10 border-r border-slate-200">
											Час
										</div>
										{weekDays.map((day, index) => (
											<div
												key={index}
												className="p-3 sm:p-4 text-center border-l border-slate-200 min-w-[90px]"
											>
												<div className="text-xs sm:text-sm font-medium text-slate-500">
													{day.toLocaleDateString(
														"bg-BG",
														{
															weekday: "short",
														}
													)}
												</div>
												<div
													className={`text-base sm:text-lg font-semibold mt-1 ${
														isToday(day)
															? "text-slate-800"
															: "text-slate-600"
													}`}
												>
													{day.getDate()}
												</div>
												{isToday(day) && (
													<div className="w-2 h-2 bg-blue-600 rounded-full mx-auto mt-1"></div>
												)}
											</div>
										))}
									</div>

									{/* Time Slots */}
									{timeSlots.map((time, timeIndex) => {
										return (
											<div
												key={timeIndex}
												className="grid grid-cols-8 border-b border-slate-200"
											>
												<div className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-slate-500 border-r border-slate-200 min-w-[80px] sticky left-0 bg-white z-10">
													{time}
												</div>
												{weekDays.map(
													(day, dayIndex) => {
														const bookings =
															getBookingsForTimeSlot(
																day,
																time
															)
														return (
															<div
																key={dayIndex}
																className="border-l border-slate-200 min-h-[64px] sm:min-h-[70px] relative min-w-[90px]"
															>
																{bookings.length >
																0 ? (
																	<div className="p-2">
																		{bookings.map(
																			(
																				booking
																			) => {
																				return (
																					<div
																						key={
																							booking._id
																						}
																						className="bg-blue-100 border border-blue-200 rounded p-2 text-xs mb-1 cursor-pointer hover:bg-blue-200 transition-colors"
																						onClick={() => {
																							setSelectedBooking(
																								booking
																							)
																							setShowBookingDetailsModal(
																								true
																							)
																						}}
																					>
																						<div className="font-medium text-blue-800 truncate">
																							{
																								booking
																									.client
																									?.name
																							}
																						</div>
																						<div className="text-blue-600 truncate">
																							{booking.services
																								.map(
																									(
																										srv
																									) =>
																										srv.name
																								)
																								.join(
																									", "
																								)}
																						</div>
																						<div className="text-blue-500 text-xs">
																							{
																								booking
																									.employee
																									.name
																							}
																						</div>
																						<div className="text-blue-500 text-xs">
																							До{" "}
																							{String(
																								new Date(
																									booking.endTime
																								).getHours()
																							).padStart(
																								2,
																								"0"
																							)}

																							:
																							{String(
																								new Date(
																									booking.endTime
																								).getMinutes()
																							).padStart(
																								2,
																								"0"
																							)}

																							ч
																						</div>
																					</div>
																				)
																			}
																		)}
																		<div>
																			{/* Add New Booking Button */}
																			<button
																				onClick={() =>
																					handleTimeSlotClick(
																						day,
																						time
																					)
																				}
																				className="w-full mt-1 h-6 sm:h-8 flex items-center justify-center bg-slate-50 text-slate-500 hover:bg-slate-100 rounded text-xs transition-colors"
																			>
																				<Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
																				Нов
																				час
																			</button>
																		</div>{" "}
																	</div>
																) : (
																	<button
																		onClick={() =>
																			handleTimeSlotClick(
																				day,
																				time
																			)
																		}
																		className="w-full h-full hover:bg-slate-50 transition-colors group touch-manipulation flex items-center justify-center"
																	>
																		<Plus className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300 group-hover:text-slate-500" />
																	</button>
																)}
															</div>
														)
													}
												)}
											</div>
										)
									})}
								</div>
							</div>
						</>
					) : (
						<>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-4 border-b border-slate-200">
								<h2 className="text-lg sm:text-xl font-semibold text-slate-800">
									{capitalize(
										selectedDate.toLocaleDateString(
											"bg-BG",
											{
												weekday: "long",
												day: "numeric",
												month: "numeric",
												year: "numeric",
											}
										)
									)}
								</h2>
								<div className="flex gap-2">
									<button
										onClick={() => navigateDay(-1)}
										className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
									>
										<ChevronLeft className="h-5 w-5" />
									</button>
									<button
										onClick={() =>
											setSelectedDate(new Date())
										}
										className="px-3 py-2 text-sm hover:bg-slate-100 rounded-lg transition-colors"
									>
										Днес
									</button>
									<button
										onClick={() => navigateDay(1)}
										className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
									>
										<ChevronRight className="h-5 w-5" />
									</button>
								</div>
							</div>

							{/* Calendar Grid */}
							<div className="overflow-x-auto">
								<div className="min-w-[800px]">
									{/* Header row with employee names */}
									<div
										className="grid border-b border-slate-200 sticky top-0 bg-white z-20"
										style={{
											gridTemplateColumns: `70px repeat(${allEmployees.length}, 1fr)`,
										}}
									>
										<div className="p-3 text-slate-500 font-medium">
											Час
										</div>
										{allEmployees.map((emp) => (
											<div
												key={emp._id}
												className="p-3 text-center font-medium border-l border-slate-200"
											>
												{emp.name}
											</div>
										))}
									</div>

									{/* Time Slots */}
									{timeSlots.map((time) => (
										<div
											key={time}
											className="grid border-b border-slate-200 sticky top-0 bg-white z-20"
											style={{
												gridTemplateColumns: `70px repeat(${allEmployees.length}, 1fr)`,
											}}
										>
											<div className="p-3 text-slate-500 border-r border-slate-200 sticky left-[-1px] bg-white z-10">
												{time}
											</div>
											{allEmployees.map((emp) => {
												const slotBookings =
													getBookingsForTimeSlot(
														selectedDate,
														time,
														emp._id
													)
												return (
													<div
														key={emp._id}
														className="border-l border-slate-200 min-h-[64px] p-1 hover:bg-slate-50 transition-colors cursor-pointer"
														onClick={() =>
															handleTimeSlotClick(
																selectedDate,
																time,
																emp._id
															)
														}
													>
														{slotBookings.map(
															(booking) => (
																<div
																	key={
																		booking._id
																	}
																	className="bg-blue-100 border border-blue-200 rounded p-2 text-xs mb-1 cursor-pointer hover:bg-blue-200 transition-colors"
																	onClick={(
																		e
																	) => {
																		e.stopPropagation()
																		setSelectedBooking(
																			booking
																		)
																		setShowBookingDetailsModal(
																			true
																		)
																	}}
																>
																	<div className="font-medium text-blue-800 truncate">
																		{
																			booking
																				.client
																				?.name
																		}
																	</div>
																	<div className="text-blue-600">
																		{booking.services
																			.map(
																				(
																					srv
																				) =>
																					srv.name
																			)
																			.join(
																				", "
																			)}
																	</div>
																	<div className="text-blue-500 text-xs">
																		{
																			booking
																				.employee
																				.name
																		}
																	</div>
																	<div className="text-blue-500 text-xs">
																		До{" "}
																		{String(
																			new Date(
																				booking.endTime
																			).getHours()
																		).padStart(
																			2,
																			"0"
																		)}
																		:
																		{String(
																			new Date(
																				booking.endTime
																			).getMinutes()
																		).padStart(
																			2,
																			"0"
																		)}
																		ч
																	</div>
																</div>
															)
														)}
														{slotBookings.length ===
															0 && (
															<div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
																{emp.name}
															</div>
														)}
													</div>
												)
											})}
										</div>
									))}
								</div>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 mt-8">
				<div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
						</div>
						<div className="ml-3 sm:ml-4 min-w-0">
							<p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
								Днешни Резервации
							</p>
							<p className="text-xl sm:text-2xl font-bold text-slate-800">
								{
									bookings.filter((booking) => {
										const today = new Date()
										const bookingDate = new Date(
											booking.startTime
										)
										return (
											bookingDate.toDateString() ===
											today.toDateString()
										)
									}).length
								}
							</p>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
						</div>
						<div className="ml-3 sm:ml-4 min-w-0">
							<p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
								Този месец
							</p>
							<p className="text-xl sm:text-2xl font-bold text-slate-800">
								{bookings.length > 0
									? bookings
											.reduce(
												(total, booking) =>
													total + booking.price,
												0
											)
											.toFixed(2)
									: 0}{" "}
								лв.
							</p>
						</div>
					</div>
				</div>
			</div>
			<select
				value={viewMode}
				onChange={(e) => setViewMode(e.target.value)}
				className="px-3 py-2 border border-slate-300 rounded-lg"
			>
				<option value="day">Дневен изглед</option>
				<option value="week">Седмичен изглед</option>
				<option value="month">Месечен изглед</option>
			</select>

			{/* Booking Modal */}
			<BookingModal
				isOpen={showBookingModal}
				onClose={handleBookingCreated}
				selectedDateTime={selectedDateTime}
				existingBookings={bookings}
				selectedEmployeeId={selectedEmployeeId}
			/>
			<BookingDetailsModal
				isOpen={showBookingDetailsModal}
				onClose={() => setShowBookingDetailsModal(false)}
				booking={selectedBooking}
				onDeleted={(deletedId) => {
					setBookings((prev) =>
						prev.filter((b) => b._id !== deletedId)
					)
				}}
			/>
		</div>
	)
}
