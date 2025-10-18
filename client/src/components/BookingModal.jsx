import React, { useEffect, useMemo, useRef, useState } from "react"
import {
	X,
	ChevronLeft,
	ChevronRight,
	Check,
	Clock,
	User,
	Search,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
axios.defaults.withCredentials = true
import {
	createBookingApi,
	createClientFromModal,
	getEmployees,
	getServices,
	searchClientsApi,
} from "../constants"
import { createErrorModal } from "../constants"

export const BookingModal = ({
	isOpen,
	onClose,
	onBookingCreated, // optional callback specifically for parent to receive created booking
	selectedDateTime,
	existingBookings = [],
	selectedEmployeeId,
}) => {
	// Step state
	const [currentStep, setCurrentStep] = useState(selectedEmployeeId ? 2 : 1)

	// Form data
	const [selectedData, setSelectedData] = useState({
		employee: null,
		services: [],
		client: null,
		newClient: { name: "", phone: "" },
		notes: "",
	})

	// Client search (input + debounced query)
	const [clientSearch, setClientSearch] = useState("")
	const [debouncedClientSearch, setDebouncedClientSearch] = useState("")
	const debounceRef = useRef(null)

	// Suggestion dropdown visibility & ref
	const [showSuggestions, setShowSuggestions] = useState(false)
	const suggestionsRef = useRef(null)

	// Local employees state (so we can set availability without mutating query results)
	const [localEmployees, setLocalEmployees] = useState([])

	const [manualPricing, setManualPricing] = useState({
		overrideTotal: false,
		totalPrice: 0,
	})

	// Query client
	const queryClient = useQueryClient()

	// Fetch employees & services once (react-query)
	const { data: employeesData, isLoading: loadingEmployees } = useQuery({
		queryKey: ["employees"],
		queryFn: getEmployees,
	})
	const { data: servicesData, isLoading: loadingServices } = useQuery({
		queryKey: ["services"],
		queryFn: getServices,
	})

	// Client search query (debounced)
	const { data: clientSuggestions = [] } = useQuery({
		queryKey: ["clients", debouncedClientSearch],
		queryFn: () => searchClientsApi(debouncedClientSearch),
		enabled: !!debouncedClientSearch && debouncedClientSearch.length > 0,
		keepPreviousData: true,
	})

	// Booking mutation
	const bookingMutation = useMutation({
		mutationFn: createBookingApi,
		onSuccess: (data) => {
			// Invalidate bookings or whatever parent uses
			queryClient.invalidateQueries(["bookings"])
			// notify parent
			if (typeof onBookingCreated === "function") onBookingCreated(data)
			// Also call onClose to close modal (maintains original behavior)
			if (typeof onClose === "function") onClose(data)
		},
		onError: (err) => {
			createErrorModal(err)
		},
	})

	// Set pre-selected employee when modal opens and data is available
	useEffect(() => {
		if (isOpen && selectedEmployeeId && employeesData) {
			const preSelectedEmployee = employeesData.find(
				(emp) => emp._id === selectedEmployeeId
			)
			if (preSelectedEmployee) {
				setSelectedData((prev) => ({
					...prev,
					employee: preSelectedEmployee,
				}))
				setCurrentStep(2) // Skip to services step
			}
		}
	}, [isOpen, selectedEmployeeId, employeesData])

	// Keep local employees in sync with fetched employees
	useEffect(() => {
		if (employeesData && Array.isArray(employeesData)) {
			// If we have a pre-selected employee, mark others as available based on logic
			const updatedEmployees = employeesData.map((e) => ({
				...e,
				available: true, // Default to true, will be updated in availability check
			}))

			setLocalEmployees(updatedEmployees)
		}
	}, [employeesData])

	// Align to 30-minute slots helper
	const alignToThirtyMinutes = (date) => {
		if (!date) return null
		const aligned = new Date(date)
		const minutes = aligned.getMinutes()
		const alignedMinutes = minutes < 30 ? 0 : 30
		aligned.setMinutes(alignedMinutes, 0, 0)
		return aligned
	}

	// Compute total duration & price from selected services (memoized)
	const totals = useMemo(() => {
		const totalDuration = selectedData.services.reduce(
			(t, s) => t + Number(s.duration || 0),
			0
		)
		const totalPrice = selectedData.services.reduce(
			(t, s) => t + Number(s.price || 0),
			0
		)
		return { totalDuration, totalPrice }
	}, [selectedData.services])

	// Update availability for localEmployees - modified to handle pre-selected employee
	useEffect(() => {
		if (!selectedDateTime || !employeesData || employeesData.length === 0)
			return

		const bookingDuration =
			totals.totalDuration > 0 ? totals.totalDuration : 30
		const startTime = alignToThirtyMinutes(selectedDateTime)
		const endTime = new Date(startTime.getTime() + bookingDuration * 60000)

		const updated = employeesData.map((emp) => {
			// If this is the pre-selected employee, check availability
			// Otherwise, mark as available for selection
			const overlapping = existingBookings.some((booking) => {
				if (!booking.employee || !booking.employee._id) return false
				if (booking.employee._id !== emp._id) return false

				const bookingStart = new Date(booking.startTime)
				const bookingEnd = new Date(booking.endTime)

				const startsDuring =
					startTime >= bookingStart && startTime < bookingEnd
				const endsDuring =
					endTime > bookingStart && endTime <= bookingEnd
				const encompasses =
					startTime <= bookingStart && endTime >= bookingEnd

				return startsDuring || endsDuring || encompasses
			})

			return {
				...emp,
				available: !overlapping,
			}
		})

		setLocalEmployees(updated)
	}, [
		selectedDateTime,
		totals.totalDuration,
		existingBookings,
		employeesData,
	])

	// Reset function when modal closes
	useEffect(() => {
		if (!isOpen) {
			setCurrentStep(1)
			setSelectedData({
				employee: null,
				services: [],
				client: null,
				newClient: { name: "", phone: "" },
				notes: "",
			})
			setManualPricing({
				overrideTotal: false,
				totalPrice: 0,
			})
			setClientSearch("")
			setDebouncedClientSearch("")
			setShowSuggestions(false)
		}
	}, [isOpen])

	// Debounce client search input to update debouncedClientSearch
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(() => {
			setDebouncedClientSearch(clientSearch.trim())
		}, 300)
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [clientSearch])

	// Show suggestions when new results come in
	useEffect(() => {
		if (clientSuggestions && clientSuggestions.length > 0) {
			setShowSuggestions(true)
		}
	}, [clientSuggestions])

	// Click outside to hide suggestions
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (
				suggestionsRef.current &&
				!suggestionsRef.current.contains(e.target)
			) {
				setShowSuggestions(false)
			}
		}
		if (showSuggestions) {
			document.addEventListener("click", handleClickOutside)
			return () =>
				document.removeEventListener("click", handleClickOutside)
		}
	}, [showSuggestions])

	// Step validation
	const isStepComplete = (step) => {
		switch (step) {
			case 1:
				return selectedData.employee !== null
			case 2:
				return selectedData.services.length > 0
			case 3:
				return (
					(selectedData.client !== null ||
						(selectedData.newClient.name &&
							selectedData.newClient.phone)) &&
					(!manualPricing.overrideTotal ||
						manualPricing.totalPrice !== "")
				)
			default:
				return false
		}
	}
	const canProceed = () => isStepComplete(currentStep)

	// Navigation
	const handleNext = () => {
		if (currentStep < 3 && canProceed()) setCurrentStep((s) => s + 1)
	}
	const handleBack = () => {
		if (currentStep > 1) setCurrentStep((s) => s - 1)
	}

	// Client selection
	const selectClient = (client) => {
		setSelectedData((prev) => ({
			...prev,
			client,
			newClient: { name: "", phone: "" },
		}))
		setClientSearch(client.full_name || client.name || "")
		setShowSuggestions(false)
	}

	// Submit create booking - validates and posts to API
	const handleSubmit = async () => {
		// Validate
		if (!selectedData.employee) {
			createErrorModal({
				data: {
					error: "Моля изберете служител.",
				},
			})
			return
		}

		if (selectedData.services.length === 0) {
			createErrorModal({
				data: {
					error: "Моля изберете поне една услуга.",
				},
			})
			return
		}
		if (
			!selectedData.client &&
			!(selectedData.newClient.name && selectedData.newClient.phone)
		) {
			createErrorModal({
				data: {
					error: "Моля изберете клиент или въведете нов клиент.",
				},
			})
			return
		}
		if (!selectedDateTime) {
			createErrorModal({
				data: {
					error: "Няма избрана дата/час за резервацията.",
				},
			})
			return
		}

		let clientId = selectedData.client?._id || null
		if (
			!clientId &&
			selectedData.newClient.name &&
			selectedData.newClient.phone
		) {
			const res = await createClientFromModal(selectedData)
			clientId = res._id
		}

		const alignedStartTime = alignToThirtyMinutes(selectedDateTime)
		const endTime = new Date(
			alignedStartTime.getTime() + totals.totalDuration * 60000
		)

		const bookingPayload = {
			// shape these to match your backend contract
			start_time: alignedStartTime.toISOString(),
			end_time: endTime.toISOString(),
			employee_id: selectedData.employee._id,
			client_id: clientId,
			service_ids: selectedData.services.map((s) => s._id),
			total_price: manualPricing.overrideTotal
				? manualPricing.totalPrice
				: totals.totalPrice,
			total_duration: totals.totalDuration,
			notes: selectedData.notes,
		}

		bookingMutation.mutate(bookingPayload)
		// Reset form only after success (handled in onSuccess)
	}

	// If modal is closed, reset internal state
	useEffect(() => {
		if (!isOpen) {
			setCurrentStep(1)
			setSelectedData({
				employee: null,
				services: [],
				client: null,
				newClient: { name: "", phone: "" },
				notes: "",
			})
			setClientSearch("")
			setDebouncedClientSearch("")
			setShowSuggestions(false)
		}
	}, [isOpen])

	// UI helpers
	const steps = [
		{ number: 1, title: "Избор на служител", icon: User },
		{ number: 2, title: "Избор на услуги", icon: Clock },
		{ number: 3, title: "Данни за клиента", icon: User },
	]

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
				<div
					className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75"
					onClick={() =>
						typeof onClose === "function" && onClose(null)
					}
				/>

				<div className="relative w-full max-w-2xl mx-auto bg-white rounded-lg sm:rounded-xl shadow-xl transform transition-all">
					{/* Header */}
					<div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200">
						<div className="min-w-0 flex-1 mr-4">
							<h3 className="text-base sm:text-lg font-semibold text-slate-800 font-poppins truncate">
								Нова резервация
							</h3>
							<p className="text-xs sm:text-sm text-slate-600 mt-1 truncate">
								{selectedDateTime
									? alignToThirtyMinutes(
											selectedDateTime
									  ).toLocaleString("bg-BG")
									: ""}
							</p>
						</div>
						<button
							onClick={() =>
								typeof onClose === "function" && onClose(null)
							}
							className="p-2 text-slate-400 hover:text-slate-600 transition-colors touch-manipulation"
							aria-label="close modal"
						>
							<X className="h-6 w-6" />
						</button>
					</div>

					{/* Progress Steps */}
					<div className="px-4 sm:px-6 py-4 border-b border-slate-200">
						<div className="flex items-center justify-between">
							{steps.map((step, index) => (
								<div
									key={step.number}
									className="flex items-center"
								>
									<div
										className={`flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-full border-2 transition-colors ${
											currentStep === step.number
												? "border-slate-800 bg-slate-800 text-white"
												: isStepComplete(step.number)
												? "border-green-500 bg-green-500 text-white"
												: "border-slate-300 text-slate-500"
										}`}
									>
										{isStepComplete(step.number) &&
										currentStep !== step.number ? (
											<Check className="h-4 w-4 sm:h-4 sm:w-4" />
										) : (
											React.createElement(step.icon, {
												className:
													"h-4 w-4 sm:h-4 sm:w-4",
											})
										)}
									</div>
									<span
										className={`ml-2 text-xs sm:text-sm font-medium hidden sm:inline ${
											currentStep === step.number
												? "text-slate-800"
												: "text-slate-500"
										}`}
									>
										{step.title}
									</span>
									{index < steps.length - 1 && (
										<div
											className={`mx-2 sm:mx-4 h-px w-6 sm:w-12 ${
												isStepComplete(step.number)
													? "bg-green-500"
													: "bg-slate-300"
											}`}
										/>
									)}
								</div>
							))}
						</div>

						{/* Mobile step title */}
						<div className="sm:hidden mt-3 text-center">
							<span className="text-sm font-medium text-slate-800">
								{steps[currentStep - 1]?.title}
							</span>
						</div>
					</div>

					{/* Content */}
					<div className="px-4 sm:px-6 py-6 max-h-[60vh] sm:max-h-none overflow-y-auto">
						{/* Step 1: Employee Selection */}
						{currentStep === 1 && (
							<div>
								<h4 className="text-base sm:text-lg font-medium text-slate-800 mb-4">
									Изберете свободен служител
								</h4>
								<div className="grid gap-3">
									{loadingEmployees ? (
										<div>Зареждане на служители...</div>
									) : (
										localEmployees.map((employee) => (
											<button
												key={employee._id}
												disabled={!employee.available}
												onClick={() =>
													setSelectedData((prev) => ({
														...prev,
														employee,
													}))
												}
												className={`p-4 sm:p-4 text-left rounded-lg border-2 transition-all touch-manipulation min-h-[60px] ${
													selectedData.employee
														?._id === employee._id
														? "border-slate-800 bg-slate-50"
														: employee.available
														? "border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100"
														: "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
												}`}
											>
												<div className="flex items-center justify-between">
													<span className="font-medium text-sm sm:text-base">
														{employee.name}
													</span>
													<span
														className={`text-xs px-3 py-1 rounded-full ${
															employee.available
																? "bg-green-100 text-green-700"
																: "bg-red-100 text-red-700"
														}`}
													>
														{employee.available
															? "Свободен"
															: "Зает"}
													</span>
												</div>
											</button>
										))
									)}
								</div>
							</div>
						)}

						{/* Step 2: Service Selection */}
						{currentStep === 2 && (
							<div>
								<h4 className="text-base sm:text-lg font-medium text-slate-800 mb-4">
									Изберете услуги
								</h4>
								<p className="text-sm text-slate-600 mb-4">
									Можете да изберете няколко услуги за тази
									резервация
								</p>

								{loadingServices ? (
									<div>Зареждане на услуги...</div>
								) : (
									<div className="grid gap-3">
										{(servicesData || []).map((service) => {
											const isSelected =
												selectedData.services.some(
													(s) => s._id === service._id
												)
											return (
												<button
													key={service._id}
													onClick={() => {
														if (isSelected) {
															setSelectedData(
																(prev) => ({
																	...prev,
																	services:
																		prev.services.filter(
																			(
																				s
																			) =>
																				s._id !==
																				service._id
																		),
																})
															)
														} else {
															setSelectedData(
																(prev) => ({
																	...prev,
																	services: [
																		...prev.services,
																		service,
																	],
																})
															)
														}
													}}
													className={`p-4 sm:p-4 text-left rounded-lg border-2 transition-all touch-manipulation min-h-[70px] ${
														isSelected
															? "border-slate-800 bg-slate-50"
															: "border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100"
													}`}
												>
													<div className="flex items-start gap-3">
														<div
															className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
																isSelected
																	? "border-slate-800 bg-slate-800"
																	: "border-slate-300"
															}`}
														>
															{isSelected && (
																<Check className="h-3 w-3 text-white" />
															)}
														</div>

														<div className="flex-1 min-w-0">
															<div className="flex items-center justify-between mb-2">
																<span className="font-medium text-sm sm:text-base">
																	{
																		service.name
																	}
																</span>
																<span className="font-semibold text-slate-800 text-sm sm:text-base">
																	{service.price ||
																		0}{" "}
																	лв.
																</span>
															</div>
															<div className="flex items-center text-xs sm:text-sm text-slate-500">
																<Clock className="h-4 w-4 mr-1" />
																{
																	service.duration
																}{" "}
																минути
															</div>
														</div>
													</div>
												</button>
											)
										})}
									</div>
								)}

								{selectedData.services.length > 0 && (
									<div className="mt-4 p-3 bg-slate-50 rounded-lg">
										<div className="text-sm font-medium text-slate-700 mb-2">
											Избрани услуги:
										</div>
										<div className="flex flex-wrap gap-2">
											{selectedData.services.map(
												(service) => (
													<span
														key={service._id}
														className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-800 text-white"
													>
														{service.name}
													</span>
												)
											)}
										</div>
										<div className="mt-2 text-sm text-slate-600">
											Общо време: {totals.totalDuration}{" "}
											минути • Обща цена:{" "}
											{totals.totalPrice.toFixed(2)} лв.
										</div>
									</div>
								)}
							</div>
						)}

						{/* Step 3: Client Selection */}
						{currentStep === 3 && (
							<div>
								<h4 className="text-base sm:text-lg font-medium text-slate-800 mb-4">
									Информация за клиент
								</h4>
								<div className="space-y-4">
									<div
										className="relative"
										ref={suggestionsRef}
									>
										<label className="block text-sm font-medium text-slate-700 mb-2">
											Търсене на съществуващ клиент
										</label>
										<div className="relative">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<Search className="h-5 w-5 text-slate-400" />
											</div>
											<input
												type="text"
												value={clientSearch}
												onChange={(e) => {
													setClientSearch(
														e.target.value
													)
													// typing a new client should clear selected client
													if (selectedData.client) {
														setSelectedData(
															(prev) => ({
																...prev,
																client: null,
															})
														)
													}
												}}
												onFocus={() => {
													if (
														clientSuggestions &&
														clientSuggestions.length >
															0
													)
														setShowSuggestions(true)
												}}
												placeholder="Въведете име на клиент..."
												className="w-full pl-10 pr-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent touch-manipulation"
											/>
										</div>

										{/* Client Suggestions Dropdown */}
										{showSuggestions &&
											!selectedData.client &&
											clientSuggestions &&
											clientSuggestions.length > 0 && (
												<div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
													{clientSuggestions.map(
														(client) => (
															<button
																key={client._id}
																onClick={() =>
																	selectClient(
																		client
																	)
																}
																className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
															>
																<div className="font-medium text-slate-800">
																	{client.full_name ||
																		client.name}
																</div>
																<div className="text-sm text-slate-600">
																	{
																		client.phone
																	}
																</div>
															</button>
														)
													)}
												</div>
											)}
									</div>

									{/* Selected Client Display */}
									{selectedData.client && (
										<div className="p-3 bg-green-50 border border-green-200 rounded-lg">
											<div className="flex items-center justify-between">
												<div>
													<div className="font-medium text-green-800">
														Избран клиент:
													</div>
													<div>
														<p>
															<span className="text-green-700">
																{selectedData
																	.client
																	.full_name ||
																	selectedData
																		.client
																		.name}
															</span>{" "}
															<span className="text-sm text-green-600">
																{
																	selectedData
																		.client
																		.phone
																}
															</span>
														</p>
													</div>
												</div>
												<button
													onClick={() => {
														setSelectedData(
															(prev) => ({
																...prev,
																client: null,
															})
														)
														setClientSearch("")
													}}
													className="text-green-600 hover:text-green-800"
												>
													<X className="h-5 w-5" />
												</button>
											</div>
										</div>
									)}

									{!selectedData.client && (
										<>
											<div className="relative">
												<div className="absolute inset-0 flex items-center">
													<div className="w-full border-t border-slate-300" />
												</div>
												<div className="relative flex justify-center text-sm">
													<span className="px-2 bg-white text-slate-500">
														или създайте нов клиент
													</span>
												</div>
											</div>

											<div className="grid grid-cols-1 gap-4">
												<div>
													<label className="block text-sm font-medium text-slate-700 mb-2">
														Име и Фамилия
													</label>
													<input
														type="text"
														value={
															selectedData
																.newClient.name
														}
														onChange={(e) =>
															setSelectedData(
																(prev) => ({
																	...prev,
																	newClient: {
																		...prev.newClient,
																		name: e
																			.target
																			.value,
																	},
																	client: null,
																})
															)
														}
														className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent touch-manipulation"
														placeholder="Въведете име и фамилия"
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-slate-700 mb-2">
														Телефонен номер
													</label>
													<input
														type="tel"
														value={
															selectedData
																.newClient.phone
														}
														onChange={(e) =>
															setSelectedData(
																(prev) => ({
																	...prev,
																	newClient: {
																		...prev.newClient,
																		phone: e
																			.target
																			.value,
																	},
																	client: null,
																})
															)
														}
														className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent touch-manipulation"
														placeholder="Въведете телефонен номер"
													/>
												</div>
											</div>
										</>
									)}

									<div className="relative">
										<div className="absolute inset-0 flex items-center">
											<div className="w-full border-t border-slate-300" />
										</div>
										<div className="relative flex justify-center text-sm">
											<span className="px-2 bg-white text-slate-500">
												допълнително
											</span>
										</div>
									</div>

									<div>
										<label className="block text-sm font-medium text-slate-700 mb-2">
											Бележки за резервацията
										</label>
										<textarea
											value={selectedData.notes}
											onChange={(e) =>
												setSelectedData((prev) => ({
													...prev,
													notes: e.target.value,
												}))
											}
											maxLength={100}
											className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent touch-manipulation resize-none"
											placeholder="Въведете бележки за резервацията (по избор)..."
										/>
										<p className="text-right text-slate-500">
											{selectedData?.notes?.length}
											/100
										</p>
									</div>

									<div className="border-t pt-4 mt-4">
										<div className="flex items-center space-x-2 mb-2">
											<input
												type="checkbox"
												id="overridePricing"
												checked={
													manualPricing.overrideTotal
												}
												onChange={(e) =>
													setManualPricing(
														(prev) => ({
															...prev,
															overrideTotal:
																e.target
																	.checked,
														})
													)
												}
												className="h-4 w-4 accent-red-500 cursor-pointer"
											/>

											<button
												type="button"
												onClick={() =>
													setManualPricing(
														(prev) => ({
															...prev,
															overrideTotal:
																!prev.overrideTotal,
														})
													)
												}
												className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow transition-colors duration-200 ${
													manualPricing.overrideTotal
														? "bg-red-600 hover:bg-red-700"
														: "bg-gray-700 hover:bg-gray-800"
												}`}
											>
												Общо: {totals.totalPrice} лв. |
												Ръчно коригиране
											</button>
										</div>

										{manualPricing.overrideTotal && (
											<div className="space-y-2">
												<div>
													<label className="text-xs text-gray-600">
														Нова цена:
													</label>
													<input
														type="number"
														value={
															manualPricing.totalPrice ??
															""
														}
														pattern="[0-9]*\.?[0-9]*"
														onChange={(e) => {
															const value =
																e.target.value

															const isValid =
																/^(\d+(\.\d*)?|\.\d*|)$/.test(
																	value
																)
															if (!isValid) return

															setManualPricing(
																(prev) => ({
																	...prev,
																	totalPrice:
																		value ===
																		""
																			? ""
																			: Number(
																					value
																			  ),
																})
															)
														}}
														className="w-full border rounded px-2 py-1 text-sm"
														placeholder="Въведете цена..."
													/>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50">
						<button
							onClick={handleBack}
							disabled={currentStep === 1}
							className="inline-flex items-center px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
						>
							<ChevronLeft className="h-4 w-4 mr-1" />
							Назад
						</button>

						<div className="flex gap-3">
							{currentStep < 3 ? (
								<button
									onClick={handleNext}
									disabled={!canProceed()}
									className="inline-flex items-center px-6 py-3 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
								>
									Напред
									<ChevronRight className="h-4 w-4 ml-1" />
								</button>
							) : (
								<button
									onClick={handleSubmit}
									disabled={
										!canProceed() ||
										bookingMutation.isLoading
									}
									className="inline-flex items-center px-6 py-3 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
								>
									{bookingMutation.isLoading
										? "Създаване..."
										: "Създай резервация"}
									<Check className="h-4 w-4 ml-1" />
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
