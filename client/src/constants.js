import axios from "axios"
import { Calendar, History, Scissors, UserCheck, Users } from "lucide-react"

export const SERVER_API = `${
	import.meta.env.VITE_SERVER_PORT ? `http://` : ""
}${import.meta.env.VITE_SERVER_HOST}${
	import.meta.env.VITE_SERVER_PORT
		? `:${import.meta.env.VITE_SERVER_PORT}`
		: ""
}/api`

export const createErrorModal = (response) => {
	// Create overlay
	const overlay = document.createElement("div")
	overlay.className =
		"fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75"
	overlay.addEventListener("click", closeModal)

	// Create modal container
	const modalContainer = document.createElement("div")
	modalContainer.className =
		"relative w-full max-w-lg mx-auto bg-white rounded-lg sm:rounded-xl shadow-xl transform transition-all"

	// Header
	const header = document.createElement("div")
	header.className =
		"flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200"

	const titleElem = document.createElement("h3")
	titleElem.className =
		"text-base sm:text-lg font-semibold text-red-600 font-poppins truncate"
	titleElem.textContent = "Грешка"

	const closeBtn = document.createElement("button")
	closeBtn.className =
		"p-2 text-slate-400 hover:text-slate-600 transition-colors"
	closeBtn.setAttribute("aria-label", "close modal")
	closeBtn.innerHTML = "&#10005;" // Simple X
	closeBtn.addEventListener("click", closeModal)

	header.appendChild(titleElem)
	header.appendChild(closeBtn)

	// Content
	const content = document.createElement("div")
	content.className =
		"px-4 sm:px-6 py-6 max-h-[60vh] sm:max-h-none overflow-y-auto space-y-4"

	const messageElem = document.createElement("p")
	messageElem.className = "text-slate-700"
	messageElem.textContent = getErrorMessage(response)

	const infoElem = document.createElement("p")
	infoElem.className = "text-slate-400 text-[12px] !mt-0"
	infoElem.textContent =
		"Доколку ја добивате оваа порака повеќе пати, контактирајте со администраторот"

	content.appendChild(messageElem)
	content.appendChild(infoElem)

	// Footer
	const footer = document.createElement("div")
	footer.className =
		"flex items-center justify-end px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50"

	const closeFooterBtn = document.createElement("button")
	closeFooterBtn.className =
		"px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slateum text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 min-h-[44px]"
	closeFooterBtn.textContent = "Затвори"
	closeFooterBtn.addEventListener("click", closeModal)

	footer.appendChild(closeFooterBtn)

	// Assemble modal
	modalContainer.appendChild(header)
	modalContainer.appendChild(content)
	modalContainer.appendChild(footer)

	const wrapper = document.createElement("div")
	wrapper.className =
		"fixed inset-0 z-50 overflow-y-auto flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0"
	wrapper.appendChild(overlay)
	wrapper.appendChild(modalContainer)

	document.body.appendChild(wrapper)

	function closeModal() {
		document.body.removeChild(wrapper)
	}

	return { close: closeModal }
}

function getErrorMessage(error) {
	// Helper to get Axios method & URL
	const getRequestInfo = (err) => {
		const method = err.config?.method?.toUpperCase() || "UNKNOWN"
		const url = err.config?.url || "UNKNOWN URL"
		const status = err.response?.status || "NO STATUS"
		return `${method} | ${status} | ${url}`
	}

	if (axios.isAxiosError(error)) {
		if (error.response) {
			const data = error.response.data

			// Determine main message
			let mainMessage = "Настана грешка"

			if (typeof data?.error === "string") mainMessage = data.error
			else if (typeof data?.message === "string")
				mainMessage = data.message
			else if (Array.isArray(data?.errors)) {
				mainMessage = data.errors
					.map((err) => err.msg || JSON.stringify(err))
					.join(", ")
			}

			return `${mainMessage}\n\n${getRequestInfo(error)}`
		} else if (error.request) {
			return `Нема одговор од серверот.\n\n${getRequestInfo(error)}`
		} else {
			return error.message
		}
	}

	if (error instanceof Error) return error.message
	if (typeof error === "string") return error
	if (typeof error === "object" && error !== null)
		return JSON.stringify(error)
	return "Се појави некаков проблем."
}

// MISC
export const capitalize = (string) => {
	return string[0].toUpperCase() + string.slice(1)
}

export const navItems = [
	{
		name: "Табло",
		path: "/dashboard",
		icon: Calendar,
	},
	{
		name: "Вработени",
		path: "/employees",
		icon: Users,
	},
	{
		name: "Услуги",
		path: "/services",
		icon: Scissors,
	},
	{
		name: "Клиенти",
		path: "/clients",
		icon: UserCheck,
	},
]

// EMPLOYEES
export const getEmployees = async () => {
	return await axios
		.get(`${SERVER_API}/employees`)
		.then((res) => res.data)
		.catch((e) => createErrorModal(e))
}

export const deleteEmploeeFromPage = async (
	employee,
	employees,
	setEmployees
) => {
	await axios
		.delete(`${SERVER_API}/employees/${employee._id}`)
		.then(() => {
			setEmployees(employees.filter((emp) => emp._id !== employee._id))
		})
		.catch((e) => {
			createErrorModal(e)
		})
}

export const editEmploeeFrompage = async (
	employees,
	setEmployees,
	selectedEmployee,
	formData
) => {
	await axios
		.put(`${SERVER_API}/employees/${selectedEmployee._id}`, formData, {
			headers: { "Content-Type": "application/json" },
		})
		.then(() => {
			setEmployees(
				employees.map((emp) =>
					emp._id === selectedEmployee._id
						? {
								...emp,
								name: formData.name,
								updatedAt: new Date()
									.toISOString()
									.split("T")[0],
						  }
						: emp
				)
			)
		})
		.catch((e) => createErrorModal(e))
}

export const postNewEmployeeFromPage = async (
	formData,
	employees,
	setEmployees
) => {
	await axios
		.post(`${SERVER_API}/employees`, formData, {
			headers: { "Content-Type": "application/json" },
		})
		.then((res) => {
			// Add new employee
			const newEmployee = {
				_id: res.data._id,
				name: res.data.name,
				createdAt: res.data.createdAt,
				updatedAt: res.data.updatedAt,
				isHidden: false,
			}
			setEmployees([newEmployee, ...employees])
		})
		.catch((e) => createErrorModal(e))
}

// SERVICES
export const getServices = async () => {
	return await axios
		.get(`${SERVER_API}/services`)
		.then((res) => res.data)
		.catch((e) => createErrorModal(e))
}

export const deleteServiceFrompage = async (service, services, setServices) => {
	await axios
		.delete(`${SERVER_API}/services/${service._id}`)
		.then(() => {
			setServices(services.filter((srv) => srv._id !== service._id))
		})
		.catch((e) => {
			createErrorModal(e)
		})
}

export const patchServiceFrompage = async (
	formData,
	services,
	setServices,
	selectedService
) => {
	await axios
		.put(`${SERVER_API}/services/${selectedService._id}`, formData, {
			headers: { "Content-Type": "application/json" },
		})
		.then(() => {
			setServices(
				services.map((srv) =>
					srv._id === selectedService._id
						? {
								...srv,
								name: formData.name,
								duration: parseInt(formData.duration),
								price: parseFloat(formData.price),
								updatedAt: new Date()
									.toISOString()
									.split("T")[0],
						  }
						: srv
				)
			)
		})
		.catch((e) => createErrorModal(e))
}

export const postServiceFrompage = async (services, setServices, formData) => {
	await axios
		.post(`${SERVER_API}/services`, formData, {
			headers: { "Content-Type": "application/json" },
		})
		.then((res) => {
			const newService = {
				_id: res.data._id,
				name: res.data.name,
				duration: res.data.duration,
				price: res.data.price,
				createdAt: res.data.createdAt,
				updatedAt: res.data.updatedAt,
				isHidden: false,
			}
			setServices([newService, ...services])
		})
		.catch((e) => createErrorModal(e))
}

// CLIENTS
export const getClients = async () => {
	return await axios
		.get(`${SERVER_API}/clients`)
		.then((res) => res.data)
		.catch((e) => createErrorModal(e))
}

export const createClientFromModal = async (selectedData) => {
	return await axios
		.post(`${SERVER_API}/clients`, {
			full_name: selectedData.newClient.name,
			phone: selectedData.newClient.phone,
		})
		.then((res) => res.data)
		.catch((e) => createErrorModal(e))
}

export const searchClientsApi = async (name) => {
	return await axios
		.get(`${SERVER_API}/clients/?q=${encodeURIComponent(name)}`)
		.then((res) => res.data)
		.catch((e) => createErrorModal(e))
}

export const getClientsBookingHystory = async () => {
	return await axios
		.get(`${SERVER_API}/clients/all/history`)
		.then((res) => res.data)
		.catch((e) => createErrorModal(e))
}
export const getSingleClientHistory = (allHistory, clientId) => {
	const mappedHistory = allHistory.filter((h) => h.client_id === clientId)
	return mappedHistory.length != 0 ? mappedHistory : []
}
export const deleteClientFromClientsPage = async (
	client,
	clients,
	setClients
) => {
	await axios
		.delete(`${SERVER_API}/clients/${client._id}`)
		.then(() => {
			setClients(clients.filter((cli) => cli._id !== client._id))
		})
		.catch((e) => {
			createErrorModal(e)
		})
}

export const patchEditClient = async (
	selectedClient,
	formData,
	clients,
	setClients
) => {
	await axios
		.put(`${SERVER_API}/clients/${selectedClient._id}`, formData, {
			headers: { "Content-Type": "application/json" },
		})
		.then(() => {
			setClients(
				clients.map((cli) =>
					cli._id === selectedClient._id
						? {
								...cli,
								full_name: formData.full_name,
								phone: formData.phone,
								notes: formData.notes,
								updatedAt: new Date()
									.toISOString()
									.split("T")[0],
						  }
						: cli
				)
			)
		})
		.catch((e) => {
			createErrorModal(e)
		})
}

export const postNewClientFromPage = async (formData, clients, setClients) => {
	await axios
		.post(`${SERVER_API}/clients`, formData, {
			headers: { "Content-Type": "application/json" },
		})
		.then((res) => {
			const newClient = {
				_id: res.data._id,
				full_name: res.data.full_name,
				phone: res.data.phone,
				notes: res.data.notes,
				createdAt: res.data.createdAt,
				updatedAt: res.data.updatedAt,
				isHidden: false,
			}
			setClients([newClient, ...clients])
		})
		.catch((e) => {
			createErrorModal(e)
		})
}

// BOOKINGS
export const getBookings = async (month, year) => {
	const params = new URLSearchParams()
	params.append("month", month)
	params.append("year", year)

	return await axios
		.get(`${SERVER_API}/bookings?${params.toString()}`)
		.then((res) => res.data)
		.catch((e) => {
			createErrorModal(e)
		})
}

export const createBookingApi = async (booking) => {
	return await axios
		.post(`${SERVER_API}/bookings`, booking)
		.then((res) => res.data)
		.catch((e) => createErrorModal(e))
}

export const deleteBookingFromModal = async (booking, onDeleted, onClose) => {
	return await axios
		.delete(`${SERVER_API}/bookings/${booking._id}`)
		.then((res) => {
			if (typeof onDeleted === "function") onDeleted(booking._id)
			if (typeof onClose === "function") onClose()
			return res.data
		})
		.catch((e) => createErrorModal(e))
}

// SESSION
export const getSession = async () => {
	return await axios
		.get(`${SERVER_API}/auth/session`)
		.then((res) => res.data.authenticated)
		.catch((e) => createErrorModal(e))
}

export const getLogout = async () => {
	await axios
		.get(`${SERVER_API}/auth/logout`)
		.catch((e) => createErrorModal(e))
}

// HISTORY
export const getHistory = async (page, limit, entityType, action) => {
	const params = new URLSearchParams()
	params.append("page", page)
	params.append("limit", limit)
	if (entityType) params.append("entityType", entityType)
	if (action) params.append("action", action)

	return await axios
		.get(`${SERVER_API}/history?${params.toString()}`)
		.then((res) => res.data)
		.catch((e) => createErrorModal(e))
}

// USER
export const getCurrentUser = async () => {
	return await axios
		.get(`${SERVER_API}/auth/me`)
		.then((res) => res.data)
		.catch(() => {
			// Don't show error modal for this, just return null
			return null
		})
}
