import { useState, useMemo, useCallback, useEffect } from "react"
import {
	Calendar,
	Plus,
	ChevronLeft,
	ChevronRight,
	Clock,
	User as UserIcon,
} from "lucide-react"
import { BookingModal } from "../components/BookingModal"
import axios from "axios"
axios.defaults.withCredentials = true
import { getBookings, getEmployees } from "../constants"
import { useQuery } from "@tanstack/react-query"
import BookingDetailsModal from "../components/BookingDetailsModal"
import { useOrganization } from "../contexts/OrganizationContext"

export const DashboardPage = () => {
	const { organization } = useOrganization()
	const [selectedDate, setSelectedDate] = useState(new Date())
	const [showBookingModal, setShowBookingModal] = useState(false)
	const [selectedDateTime, setSelectedDateTime] = useState(null)
	const [bookings, setBookings] = useState([])
	const [selectedBooking, setSelectedBooking] = useState(null)
	const [showBookingDetailsModal, setShowBookingDetailsModal] =
		useState(false)
	const [editingBooking, setEditingBooking] = useState(null)
	const [showEditBookingModal, setShowEditBookingModal] = useState(false)

	const [viewMode, setViewMode] = useState("month")
	const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)

	const bookingInterval = organization?.bookingInterval || 15

	const formatDateMK = (date, options = {}) => {
		const day = date.getDate()
		const months = [
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
		const weekdays = [
			"Недела",
			"Понеделник",
			"Вторник",
			"Среда",
			"Четврток",
			"Петок",
			"Сабота",
		]
		const month = months[date.getMonth()]
		const year = date.getFullYear()
		const weekday = weekdays[date.getDay()]

		if (options.full) {
			return `${weekday}, ${day} ${month} ${year}`
		} else if (options.weekday) {
			return `${weekday}, ${day} ${month} ${year}`
		} else {
			return `${day} ${month} ${year}`
		}
	}

	const { data: allBookings = [], isLoading: bookingsLoading } = useQuery({
		queryKey: [
			"all_bookings",
			selectedDate.getMonth(),
			selectedDate.getFullYear(),
		],
		queryFn: () =>
			getBookings(
				selectedDate.getMonth() + 1,
				selectedDate.getFullYear()
			),
		keepPreviousData: true,
		refetchInterval: 30000,
		refetchIntervalInBackground: false,
	})

	const { data: allEmployees = [], isLoading: employeesLoading } = useQuery({
		queryKey: ["all_employees"],
		queryFn: getEmployees,
	})

	useEffect(() => {
		if (JSON.stringify(bookings) !== JSON.stringify(allBookings)) {
			setBookings(allBookings)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [allBookings])

	useEffect(() => {
		if (
			viewMode === "day" &&
			allEmployees.length === 1 &&
			!selectedEmployeeId
		) {
			setSelectedEmployeeId(allEmployees[0]._id)
		}
	}, [viewMode, allEmployees, selectedEmployeeId])

	// Handler for adding new booking to state
	const handleBookingCreated = useCallback((newBooking) => {
		if (
			newBooking &&
			typeof newBooking === "object" &&
			typeof newBooking.price === "number"
		) {
			setBookings((prevBookings) => [...prevBookings, newBooking])
			setViewMode("month")
		}
		setShowBookingModal(false)
	}, [])
	const handleBookingUpdated = useCallback((updatedBooking) => {
		if (
			updatedBooking &&
			typeof updatedBooking === "object" &&
			typeof updatedBooking.price === "number"
		) {
			setBookings((prevBookings) =>
				prevBookings.map((b) =>
					b._id === updatedBooking.id ? updatedBooking : b
				)
			)
		}
		setShowEditBookingModal(false)
		setShowBookingDetailsModal(false)
		setEditingBooking(null)
	}, [])
	const handleBookingDeleted = useCallback((bookingId) => {
		setBookings((prevBookings) =>
			prevBookings.filter((b) => b._id !== bookingId)
		)
		setShowBookingDetailsModal(false)
		setSelectedBooking(null)
	}, [])
	const handleMoveBookingClicked = useCallback((booking) => {
		setEditingBooking(booking)
		setShowBookingDetailsModal(false)
		setShowEditBookingModal(true)
	}, [])

	const timeSlots = useMemo(() => {
		const slots = []
		const startHour = 8
		const endHour = 20 // 8 PM
		const totalMinutes = (endHour - startHour) * 60
		const slotCount = totalMinutes / bookingInterval

		for (let i = 0; i < slotCount; i++) {
			const totalMins = startHour * 60 + i * bookingInterval
			const hour = Math.floor(totalMins / 60)
			const minute = totalMins % 60
			slots.push(`${hour}:${minute.toString().padStart(2, "0")}`)
		}

		return slots
	}, [bookingInterval])

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

	const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate])
	const monthDays = useMemo(() => getMonthDays(selectedDate), [selectedDate])

	const getBookingsForTimeSlot = useCallback(
		(day, timeSlot, employeeId = null) => {
			const [hourStr, minuteStr] = timeSlot.split(":")
			const hour = parseInt(hourStr)
			const minute = parseInt(minuteStr)

			const slotStart = new Date(day)
			slotStart.setHours(hour, minute, 0, 0)
			const slotEnd = new Date(day)
			slotEnd.setHours(hour, minute + bookingInterval - 1, 59, 999)

			return bookings.filter((booking) => {
				const bookingDate = new Date(booking.startTime)
				const timeMatch =
					bookingDate >= slotStart && bookingDate <= slotEnd
				const employeeMatch =
					employeeId === null || booking.employee?._id === employeeId
				return timeMatch && employeeMatch
			})
		},
		[bookings, bookingInterval]
	)

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

	const navigateDay = useCallback((direction) => {
		setSelectedDate((prevDate) => {
			const newDate = new Date(prevDate)
			newDate.setDate(prevDate.getDate() + direction)
			return newDate
		})
	}, [])

	const navigateWeek = useCallback((direction) => {
		setSelectedDate((prevDate) => {
			const newDate = new Date(prevDate)
			newDate.setDate(prevDate.getDate() + direction * 7)
			return newDate
		})
	}, [])

	const isToday = (date) => {
		const today = new Date()
		return date.toDateString() === today.toDateString()
	}

	if (bookingsLoading || employeesLoading) {
		return (
			<div className="p-4 sm:p-6">
				<div className="max-w-7xl mx-auto">
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
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-poppins">
								Табло
							</h1>
							<p className="text-slate-600 mt-1 text-sm sm:text-base">
								Преглед на термините и управување со календар
							</p>
							<button
								onClick={() => setViewMode("month")}
								className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors touch-manipulation min-h-[44px] mt-2"
							>
								<Calendar className="h-5 w-5 mr-2" />
								Месечен Преглед
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
											{
												[
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
												][selectedDate.getMonth()]
											}{" "}
											{selectedDate.getFullYear()}
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
											"Пон",
											"Вто",
											"Сре",
											"Чет",
											"Пет",
											"Саб",
											"Нед",
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
									Недела {formatDateMK(weekDays[0])}
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
										Денес
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
														"mk-MK",
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
																				термин
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
							{/* Daily View Header */}
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-4 border-b border-slate-200">
								<h2 className="text-lg sm:text-xl font-semibold text-slate-800 font-poppins">
									{formatDateMK(selectedDate, {
										weekday: true,
									})}
								</h2>
								<div className="flex items-center justify-between sm:justify-end gap-2">
									<button
										onClick={() => navigateDay(-1)}
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
										Денес
									</button>
									<button
										onClick={() => navigateDay(1)}
										className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation"
									>
										<ChevronRight className="h-5 w-5" />
									</button>
								</div>
							</div>

							{/* Mobile: Employee Selector Boxes */}
							{allEmployees.length > 1 ? (
								<div className="sm:hidden px-4 py-3 border-b border-slate-200 bg-slate-50">
									<label className="block text-sm font-medium text-slate-700 mb-3">
										Филтрирај по Вработен
									</label>
									<div className="grid grid-cols-2 gap-2">
										{/* "All Employees" box */}
										<button
											onClick={() =>
												setSelectedEmployeeId(null)
											}
											className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all touch-manipulation min-h-[52px] ${
												selectedEmployeeId === null
													? "border-blue-600 bg-blue-50 text-blue-700"
													: "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
											}`}
										>
											Сите Вработени
										</button>

										{/* Individual employee boxes */}
										{allEmployees.map((emp) => (
											<button
												key={emp._id}
												onClick={() =>
													setSelectedEmployeeId(
														emp._id
													)
												}
												className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all touch-manipulation min-h-[52px] truncate ${
													selectedEmployeeId ===
													emp._id
														? "border-blue-600 bg-blue-50 text-blue-700"
														: "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
												}`}
												title={emp.name} // Show full name on hover if truncated
											>
												{emp.name}
											</button>
										))}
									</div>
								</div>
							) : allEmployees.length === 1 ? (
								<div className="sm:hidden px-4 py-3 border-b border-slate-200 bg-slate-50">
									<div className="flex items-center gap-2">
										<UserIcon className="h-5 w-5 text-slate-600" />
										<span className="text-base font-medium text-slate-800">
											{allEmployees[0].name}
										</span>
									</div>
								</div>
							) : null}

							{/* Desktop: Horizontal Grid with All Employees */}
							<div className="hidden sm:block overflow-x-auto">
								<div className="min-w-[800px]">
									{/* Header row with employee names */}
									<div
										className="grid border-b border-slate-200 sticky top-0 bg-white z-20"
										style={{
											gridTemplateColumns: `80px repeat(${allEmployees.length}, minmax(120px, 1fr))`,
										}}
									>
										<div className="p-3 text-sm font-medium text-slate-500 border-r border-slate-200 sticky left-0 bg-white z-30">
											Час
										</div>
										{allEmployees.map((emp) => (
											<div
												key={emp._id}
												className="p-3 text-center font-medium text-slate-700 border-l border-slate-200 truncate"
												title={emp.name}
											>
												{emp.name}
											</div>
										))}
									</div>

									{/* Time Slots - Desktop */}
									{timeSlots.map((time) => (
										<div
											key={time}
											className="grid border-b border-slate-200"
											style={{
												gridTemplateColumns: `80px repeat(${allEmployees.length}, minmax(120px, 1fr))`,
											}}
										>
											<div className="p-3 text-sm font-medium text-slate-500 border-r border-slate-200 sticky left-0 bg-white z-10">
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
														className="border-l border-slate-200 min-h-[70px] relative"
													>
														{slotBookings.length >
														0 ? (
															<div className="p-2 space-y-1">
																{slotBookings.map(
																	(
																		booking
																	) => (
																		<div
																			key={
																				booking._id
																			}
																			className="bg-blue-100 border border-blue-200 rounded p-2 text-xs cursor-pointer hover:bg-blue-200 transition-colors"
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
																			<div
																				className="font-medium text-blue-900 truncate"
																				title={
																					booking
																						.client
																						?.name
																				}
																			>
																				{
																					booking
																						.client
																						?.name
																				}
																			</div>
																			<div
																				className="text-blue-700 truncate"
																				title={booking.services
																					.map(
																						(
																							s
																						) =>
																							s.name
																					)
																					.join(
																						", "
																					)}
																			>
																				{booking.services
																					.map(
																						(
																							s
																						) =>
																							s.name
																					)
																					.join(
																						", "
																					)}
																			</div>
																			<div className="text-blue-600 text-xs mt-1">
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
																			</div>
																		</div>
																	)
																)}
															</div>
														) : (
															<button
																onClick={() =>
																	handleTimeSlotClick(
																		selectedDate,
																		time,
																		emp._id
																	)
																}
																className="w-full h-full hover:bg-slate-50 transition-colors group flex items-center justify-center"
															>
																<Plus className="h-5 w-5 text-slate-300 group-hover:text-slate-500" />
															</button>
														)}
													</div>
												)
											})}
										</div>
									))}
								</div>
							</div>

							{/* Mobile: Vertical Timeline View */}
							<div className="sm:hidden">
								{timeSlots.map((time) => {
									const slotBookings = getBookingsForTimeSlot(
										selectedDate,
										time,
										selectedEmployeeId
									)

									return (
										<div
											key={time}
											className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
										>
											<div className="flex">
												{/* Time Column */}
												<div className="w-20 flex-shrink-0 p-4 text-sm font-medium text-slate-500 border-r border-slate-200 bg-slate-50">
													{time}
												</div>

												{/* Content Column */}
												<div className="flex-1 p-3">
													{slotBookings.length > 0 ? (
														<div className="space-y-2">
															{slotBookings.map(
																(booking) => (
																	<div
																		key={
																			booking._id
																		}
																		className="bg-blue-100 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-200 transition-colors active:scale-98"
																		onClick={() => {
																			setSelectedBooking(
																				booking
																			)
																			setShowBookingDetailsModal(
																				true
																			)
																		}}
																	>
																		<div className="flex items-start justify-between mb-2">
																			<div className="font-semibold text-blue-900">
																				{
																					booking
																						.client
																						?.name
																				}
																			</div>
																			<div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
																				{String(
																					new Date(
																						booking.startTime
																					).getHours()
																				).padStart(
																					2,
																					"0"
																				)}

																				:
																				{String(
																					new Date(
																						booking.startTime
																					).getMinutes()
																				).padStart(
																					2,
																					"0"
																				)}
																				{
																					" - "
																				}
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
																			</div>
																		</div>
																		<div className="text-sm text-blue-800 mb-1">
																			{booking.services
																				.map(
																					(
																						s
																					) =>
																						s.name
																				)
																				.join(
																					", "
																				)}
																		</div>
																		<div className="text-xs text-blue-600 flex items-center">
																			<UserIcon className="h-3 w-3 mr-1" />
																			{
																				booking
																					.employee
																					?.name
																			}
																		</div>
																	</div>
																)
															)}
															<button
																onClick={() =>
																	handleTimeSlotClick(
																		selectedDate,
																		time,
																		selectedEmployeeId
																	)
																}
																className="w-full py-3 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
															>
																<Plus className="h-4 w-4 mr-2" />
																Додади термин
															</button>
														</div>
													) : (
														<button
															onClick={() =>
																handleTimeSlotClick(
																	selectedDate,
																	time,
																	selectedEmployeeId
																)
															}
															className="w-full py-4 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors flex items-center justify-center touch-manipulation"
														>
															<Plus className="h-5 w-5 mr-2" />
															<span className="text-sm">
																Слободен термин
															</span>
														</button>
													)}
												</div>
											</div>
										</div>
									)
								})}
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
								Термини Денес
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
								Овој Месец
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
								ден.
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
				<option value="day">Дневен Преглед</option>
				<option value="week">Неделен Преглед</option>
				<option value="month">Месечен Преглед</option>
			</select>

			{/* Booking Modal */}
			<BookingModal
				isOpen={showBookingModal}
				onClose={handleBookingCreated}
				selectedDateTime={selectedDateTime}
				existingBookings={bookings}
				selectedEmployeeId={selectedEmployeeId}
			/>
			<BookingModal
				isOpen={showEditBookingModal}
				onClose={() => {
					setShowEditBookingModal(false)
					setEditingBooking(null)
				}}
				selectedDateTime={
					editingBooking ? new Date(editingBooking.startTime) : null
				}
				existingBookings={bookings}
				selectedEmployeeId={editingBooking?.employee?._id}
				editingBooking={editingBooking}
				onBookingUpdated={handleBookingUpdated}
			/>
			<BookingDetailsModal
				isOpen={showBookingDetailsModal}
				onClose={() => setShowBookingDetailsModal(false)}
				booking={selectedBooking}
				onDeleted={handleBookingDeleted}
				onMoveClicked={handleMoveBookingClicked}
			/>
		</div>
	)
}
