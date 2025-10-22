import { useState } from "react"
import { CrudTable } from "../components/CrudTable"
import axios from "axios"
axios.defaults.withCredentials = true
import {
	deleteServiceFrompage,
	getServices,
	patchServiceFrompage,
	postServiceFrompage,
} from "../constants"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

export const ServicesPage = () => {
	const queryClient = useQueryClient() // ADD THIS

	const [services, setServices] = useState([])
	const [showModal, setShowModal] = useState(false)
	const [selectedService, setSelectedService] = useState(null)
	const [formData, setFormData] = useState({
		name: "",
		duration: "",
		price: "",
	})

	const { data: allServices } = useQuery({
		queryKey: ["all_services"],
		queryFn: getServices,
	})

	useEffect(() => {
		if (allServices) setServices(allServices)
	}, [allServices])

	const columns = [
		{ key: "name", label: "Име на услугата", type: "text" },
		{ key: "duration", label: "Траење", type: "text" },
		{ key: "price", label: "Цена", type: "currency" },
	]

	const handleAdd = () => {
		setSelectedService(null)
		setFormData({ name: "", duration: "", price: "" })
		setShowModal(true)
	}

	const handleEdit = (service) => {
		setSelectedService(service)
		setFormData({
			name: service.name,
			duration: service.duration.toString(),
			price: service.price.toString(),
			isHidden: service.isHidden,
		})
		setShowModal(true)
	}

	const handleDelete = async (service) => {
		if (
			window.confirm(
				`Дали сте сигурни дека сакате да ја избришете ${service.name}?`
			)
		) {
			await deleteServiceFrompage(service, services, setServices)

			queryClient.invalidateQueries(["all_services"])
			queryClient.invalidateQueries(["services"])
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (selectedService) {
			await patchServiceFrompage(
				formData,
				services,
				setServices,
				selectedService
			)
		} else {
			await postServiceFrompage(services, setServices, formData)
		}

		queryClient.invalidateQueries(["all_services"])
		queryClient.invalidateQueries(["services"])

		setShowModal(false)
		setFormData({ name: "", duration: "", price: "" })
		setSelectedService(null)
	}

	return (
		<div className="p-4 sm:p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-poppins">
						Услуги
					</h1>
					<p className="text-slate-600 mt-1 text-sm sm:text-base">
						Управување со услугите, цените и времетраењето
					</p>
				</div>

				{/* CRUD Table */}
				<CrudTable
					title="Предлагани услуги"
					data={services}
					columns={columns}
					onAdd={handleAdd}
					onEdit={handleEdit}
					onDelete={handleDelete}
					searchPlaceholder="Пребарување на услуги..."
					addButtonText="Додади услуга"
				/>

				{/* Modal */}
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
											{selectedService
												? "Уреди услуга"
												: "Додади нова услуга"}
										</h3>
									</div>

									{/* Content */}
									<div className="px-4 sm:px-6 py-6 space-y-4">
										<div>
											<label className="block text-sm font-medium text-slate-700 mb-2">
												Име на услугата *
											</label>
											<input
												type="text"
												required
												value={formData.name}
												onChange={(e) =>
													setFormData({
														...formData,
														name: e.target.value,
													})
												}
												className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent touch-manipulation"
												placeholder="Внесете име на услугата"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-slate-700 mb-2">
												Траење (минути) *
											</label>
											<input
												type="number"
												required
												min="1"
												value={formData.duration}
												onChange={(e) =>
													setFormData({
														...formData,
														duration:
															e.target.value,
													})
												}
												className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent touch-manipulation"
												placeholder="30"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-slate-700 mb-2">
												Цена (ден.) *
											</label>
											<input
												type="number"
												required
												min="0"
												step="0.01"
												value={formData.price}
												onChange={(e) =>
													setFormData({
														...formData,
														price: e.target.value,
													})
												}
												className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent touch-manipulation"
												placeholder="25.00"
											/>
										</div>
									</div>

									{/* Footer */}
									<div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50">
										<button
											type="button"
											onClick={() => setShowModal(false)}
											className="px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 touch-manipulation min-h-[44px]"
										>
											Откажи
										</button>
										<button
											type="submit"
											className="px-6 py-3 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 touch-manipulation min-h-[44px]"
										>
											{selectedService
												? "Ажурирај"
												: "Креирај"}{" "}
											услуга
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
