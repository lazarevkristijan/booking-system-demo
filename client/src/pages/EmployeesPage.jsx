import { useEffect, useState } from "react"
import { CrudTable } from "../components/CrudTable"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
axios.defaults.withCredentials = true
import {
	deleteEmploeeFromPage,
	editEmploeeFrompage,
	getEmployees,
	postNewEmployeeFromPage,
} from "../constants"

export const EmployeesPage = () => {
	const [employees, setEmployees] = useState([])

	const { data: allEmployees } = useQuery({
		queryKey: ["all_employees"],
		queryFn: getEmployees,
	})

	useEffect(() => {
		if (allEmployees) setEmployees(allEmployees)
	}, [allEmployees])

	const [showModal, setShowModal] = useState(false)
	const [selectedEmployee, setSelectedEmployee] = useState(null)
	const [formData, setFormData] = useState({ name: "" })

	const columns = [{ key: "name", label: "Име и Презиме", type: "text" }]

	const handleAdd = () => {
		setSelectedEmployee(null)
		setFormData({ name: "" })
		setShowModal(true)
	}

	const handleEdit = (employee) => {
		setSelectedEmployee(employee)
		setFormData({
			name: employee.name,
			isHidden: employee.isHidden,
		})
		setShowModal(true)
	}

	const handleDelete = async (employee) => {
		if (
			window.confirm(
				`Дали сте сигурни дека сакате да го избришете вработениот ${employee.name}?`
			)
		) {
			await deleteEmploeeFromPage(employee, employees, setEmployees)
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (selectedEmployee) {
			await editEmploeeFrompage(
				employees,
				setEmployees,
				selectedEmployee,
				formData
			)
		} else {
			await postNewEmployeeFromPage(formData, employees, setEmployees)
		}

		setShowModal(false)
		setFormData({ name: "" })
		setSelectedEmployee(null)
	}

	return (
		<div className="p-4 sm:p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-poppins">
						Вработени
					</h1>
					<p className="text-slate-600 mt-1 text-sm sm:text-base">
						Управување со фризерскиот персонал
					</p>
				</div>

				{/* CRUD Table */}
				<CrudTable
					title="Персонал"
					data={employees}
					columns={columns}
					onAdd={handleAdd}
					onEdit={handleEdit}
					onDelete={handleDelete}
					searchPlaceholder="Пребарување на вработени..."
					addButtonText="Додади Вработен"
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
											{selectedEmployee
												? "Уреди Вработен"
												: "Додади Нов Вработен"}
										</h3>
									</div>

									{/* Content */}
									<div className="px-4 sm:px-6 py-6">
										<div>
											<label className="block text-sm font-medium text-slate-700 mb-2">
												Име и Презиме *
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
												placeholder="Внесете име и презиме на вработениот"
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
											{selectedEmployee
												? "Ажурирај"
												: "Креирај"}{" "}
											Вработен
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
