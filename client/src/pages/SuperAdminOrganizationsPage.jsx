import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
	Building2,
	Plus,
	Edit2,
	Trash2,
	Users,
	CheckCircle,
	XCircle,
} from "lucide-react"
import {
	getAllOrganizations,
	createOrganization,
	updateOrganization,
	deleteOrganization,
} from "../constants"

export const SuperAdminOrganizationsPage = () => {
	const queryClient = useQueryClient()
	const [showModal, setShowModal] = useState(false)
	const [selectedOrg, setSelectedOrg] = useState(null)
	const [formData, setFormData] = useState({
		name: "",
		slug: "",
		isActive: true,
	})

	const { data: organizations = [], isLoading } = useQuery({
		queryKey: ["all_organizations"],
		queryFn: getAllOrganizations,
	})

	const createMutation = useMutation({
		mutationFn: createOrganization,
		onSuccess: () => {
			queryClient.invalidateQueries(["all_organizations"])
			setShowModal(false)
			resetForm()
		},
	})

	const updateMutation = useMutation({
		mutationFn: ({ id, data }) => updateOrganization(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries(["all_organizations"])
			setShowModal(false)
			resetForm()
		},
	})

	const deleteMutation = useMutation({
		mutationFn: deleteOrganization,
		onSuccess: () => {
			queryClient.invalidateQueries(["all_organizations"])
		},
	})

	const resetForm = () => {
		setFormData({
			name: "",
			slug: "",
			isActive: true,
		})
		setSelectedOrg(null)
	}

	const handleAdd = () => {
		resetForm()
		setShowModal(true)
	}

	const handleEdit = (org) => {
		setSelectedOrg(org)
		setFormData({
			name: org.name,
			slug: org.slug,
			isActive: org.isActive,
		})
		setShowModal(true)
	}

	const handleSubmit = (e) => {
		e.preventDefault()

		if (selectedOrg) {
			updateMutation.mutate({ id: selectedOrg._id, data: formData })
		} else {
			createMutation.mutate(formData)
		}
	}

	const handleDelete = (org) => {
		if (
			window.confirm(
				`Избриши организација "${org.name}"? (Се корисниците мора прво да бидат избришани)`
			)
		) {
			deleteMutation.mutate(org._id)
		}
	}

	if (isLoading) {
		return (
			<div className="p-4 sm:p-6">
				<div className="max-w-6xl mx-auto">
					<div className="animate-pulse space-y-4">
						<div className="h-8 bg-slate-200 rounded w-1/4"></div>
						<div className="h-64 bg-slate-200 rounded"></div>
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
						Организации
					</h1>
					<p className="text-slate-600 mt-1 text-sm sm:text-base">
						Управување со сите организации во системот
					</p>
				</div>

				{/* Add Button */}
				<div className="mb-4">
					<button
						onClick={handleAdd}
						className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors min-h-[44px]"
					>
						<Plus className="h-5 w-5 mr-2" />
						Додади Организација
					</button>
				</div>

				{/* Organizations Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{organizations.map((org) => (
						<div
							key={org._id}
							className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
						>
							<div className="flex items-start justify-between mb-4">
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
										<Building2 className="h-6 w-6 text-purple-600" />
									</div>
									<div>
										<h3 className="font-semibold text-slate-800">
											{org.name}
										</h3>
										<p className="text-sm text-slate-500">
											{org.slug}
										</p>
									</div>
								</div>
							</div>

							<div className="space-y-2 mb-4">
								<div className="flex items-center justify-between text-sm">
									<span className="text-slate-600">
										Корисници:
									</span>
									<span className="font-medium flex items-center gap-1">
										<Users className="h-4 w-4" />
										{org.userCount || 0}
									</span>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="text-slate-600">
										Статус:
									</span>
									<span
										className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
											org.isActive
												? "bg-green-100 text-green-800"
												: "bg-red-100 text-red-800"
										}`}
									>
										{org.isActive ? (
											<>
												<CheckCircle className="h-3 w-3" />{" "}
												Активна
											</>
										) : (
											<>
												<XCircle className="h-3 w-3" />{" "}
												Неактивна
											</>
										)}
									</span>
								</div>
							</div>

							<div className="flex gap-2 pt-4 border-t border-slate-200">
								<button
									onClick={() => handleEdit(org)}
									className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
								>
									<Edit2 className="h-4 w-4 inline mr-1" />
									Уреди
								</button>
								<button
									onClick={() => handleDelete(org)}
									className="flex-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
								>
									<Trash2 className="h-4 w-4 inline mr-1" />
									Избриши
								</button>
							</div>
						</div>
					))}
				</div>

				{/* Modal */}
				{showModal && (
					<div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center min-h-screen px-4 bg-black bg-opacity-50">
						<div className="relative w-full max-w-lg mx-auto bg-white rounded-lg shadow-xl">
							<div className="px-6 py-4 border-b border-slate-200">
								<h3 className="text-lg font-semibold text-slate-800">
									{selectedOrg
										? "Уреди Организација"
										: "Нова Организација"}
								</h3>
							</div>

							<form
								onSubmit={handleSubmit}
								className="px-6 py-4 space-y-4"
							>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										Име на Организација *
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
										className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
										placeholder="Salon ABC"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										Код (slug) *
									</label>
									<input
										type="text"
										required
										value={formData.slug}
										onChange={(e) =>
											setFormData({
												...formData,
												slug: e.target.value.toLowerCase(),
											})
										}
										className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
										placeholder="salon-abc"
										pattern="[a-z0-9-]+"
									/>
									<p className="text-xs text-slate-500 mt-1">
										Само мали букви, бројки и цртички
									</p>
								</div>

								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										checked={formData.isActive}
										onChange={(e) =>
											setFormData({
												...formData,
												isActive: e.target.checked,
											})
										}
										className="h-4 w-4 text-purple-600 rounded"
									/>
									<label className="text-sm font-medium text-slate-700">
										Активна организација
									</label>
								</div>

								<div className="flex items-center justify-end gap-3 pt-4">
									<button
										type="button"
										onClick={() => {
											setShowModal(false)
											resetForm()
										}}
										className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
									>
										Откажи
									</button>
									<button
										type="submit"
										disabled={
											createMutation.isLoading ||
											updateMutation.isLoading
										}
										className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
									>
										{createMutation.isLoading ||
										updateMutation.isLoading
											? "Зачувување..."
											: selectedOrg
											? "Зачувај"
											: "Креирај"}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
