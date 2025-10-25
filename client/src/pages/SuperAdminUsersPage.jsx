import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
	Shield,
	Plus,
	Edit2,
	Trash2,
	ChevronLeft,
	ChevronRight,
	User as UserIcon,
} from "lucide-react"
import {
	getAllUsers,
	createUserInOrg,
	updateUserInOrg,
	deleteUserFromOrg,
	getAllOrganizations,
} from "../constants"
import { useTransition } from "react"

export const SuperAdminUsersPage = () => {
	const { t } = useTransition()
	const queryClient = useQueryClient()
	const [currentPage, setCurrentPage] = useState(1)
	const [filterOrgId, setFilterOrgId] = useState("")
	const [showModal, setShowModal] = useState(false)
	const [selectedUser, setSelectedUser] = useState(null)
	const [formData, setFormData] = useState({
		username: "",
		password: "",
		role: "user",
		organizationId: "",
	})
	const limit = 50

	const { data: usersData, isLoading } = useQuery({
		queryKey: ["all_users_superadmin", currentPage, filterOrgId],
		queryFn: () => getAllUsers(currentPage, limit, filterOrgId || null),
		keepPreviousData: true,
	})

	const { data: organizations = [] } = useQuery({
		queryKey: ["all_organizations"],
		queryFn: getAllOrganizations,
	})

	const users = usersData?.users || []
	const pagination = usersData?.pagination || {}

	const createMutation = useMutation({
		mutationFn: createUserInOrg,
		onSuccess: () => {
			queryClient.invalidateQueries(["all_users_superadmin"])
			setShowModal(false)
			resetForm()
		},
	})

	const updateMutation = useMutation({
		mutationFn: ({ id, data }) => updateUserInOrg(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries(["all_users_superadmin"])
			setShowModal(false)
			resetForm()
		},
	})

	const deleteMutation = useMutation({
		mutationFn: deleteUserFromOrg,
		onSuccess: () => {
			queryClient.invalidateQueries(["all_users_superadmin"])
		},
	})

	const resetForm = () => {
		setFormData({
			username: "",
			password: "",
			role: "user",
			organizationId: "",
		})
		setSelectedUser(null)
	}

	const handleAdd = () => {
		resetForm()
		setShowModal(true)
	}

	const handleEdit = (user) => {
		setSelectedUser(user)
		setFormData({
			username: user.username,
			password: "",
			role: user.role,
			organizationId: user.organizationId?._id || "",
		})
		setShowModal(true)
	}

	const handleSubmit = (e) => {
		e.preventDefault()

		if (selectedUser) {
			updateMutation.mutate({ id: selectedUser._id, data: formData })
		} else {
			createMutation.mutate(formData)
		}
	}

	const handleDelete = (user) => {
		if (window.confirm(`Избриши корисник "${user.username}"?`)) {
			deleteMutation.mutate(user._id)
		}
	}

	const getRoleBadge = (role) => {
		const styles = {
			superadmin: "bg-purple-100 text-purple-800",
			admin: "bg-blue-100 text-blue-800",
			user: "bg-slate-100 text-slate-800",
		}
		const labels = {
			superadmin: "Супер Админ",
			admin: "Админ",
			user: "Корисник",
		}
		return { style: styles[role], label: labels[role] }
	}

	if (isLoading) {
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
				<div className="mb-6">
					<h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-poppins">
						Корисници - Сите Организации
					</h1>
					<p className="text-slate-600 mt-1 text-sm sm:text-base">
						Управување со корисниците низ целиот систем
					</p>
				</div>

				{/* Filters and Actions */}
				<div className="mb-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
					<div className="flex flex-col sm:flex-row gap-3">
						{/* Organization Filter */}
						<select
							value={filterOrgId}
							onChange={(e) => {
								setFilterOrgId(e.target.value)
								setCurrentPage(1)
							}}
							className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
						>
							<option value="">Сите организации</option>
							{organizations.map((org) => (
								<option
									key={org._id}
									value={org._id}
								>
									{org.name}
								</option>
							))}
						</select>

						{/* Info */}
						<div className="text-sm text-slate-600 py-2">
							{pagination.total || 0} вкупно корисници
						</div>
					</div>

					<button
						onClick={handleAdd}
						className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors min-h-[44px]"
					>
						<Plus className="h-5 w-5 mr-2" />
						Додади Корисник
					</button>
				</div>

				{/* Users Table */}
				<div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-slate-200">
							<thead className="bg-slate-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
										Корисник
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
										Организација
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
										Улога
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
										Креиран
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
										Акции
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-slate-200">
								{users.map((user) => {
									const roleBadge = getRoleBadge(user.role)
									return (
										<tr
											key={user._id}
											className="hover:bg-slate-50"
										>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center">
													<div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
														<UserIcon className="h-5 w-5 text-slate-600" />
													</div>
													<div className="ml-4">
														<div className="text-sm font-medium text-slate-900">
															{user.username}
														</div>
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-slate-900">
													{user.organizationId
														?.name || (
														<span className="text-slate-400 italic">
															Глобален
														</span>
													)}
												</div>
												{user.organizationId?.slug && (
													<div className="text-xs text-slate-500">
														{
															user.organizationId
																.slug
														}
													</div>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge.style}`}
												>
													{user.role ===
														"superadmin" && (
														<Shield className="h-3 w-3 mr-1" />
													)}
													{roleBadge.label}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
												{new Date(
													user.createdAt
												).toLocaleDateString(
													t("common.locale")
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<button
													onClick={() =>
														handleEdit(user)
													}
													className="text-blue-600 hover:text-blue-900 mr-4"
												>
													<Edit2 className="h-4 w-4" />
												</button>
												<button
													onClick={() =>
														handleDelete(user)
													}
													className="text-red-600 hover:text-red-900"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					{pagination.totalPages > 1 && (
						<div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
							<div className="text-sm text-slate-600">
								Страна {pagination.page} од{" "}
								{pagination.totalPages}
							</div>
							<div className="flex gap-2">
								<button
									onClick={() =>
										setCurrentPage((p) =>
											Math.max(1, p - 1)
										)
									}
									disabled={pagination.page === 1}
									className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<ChevronLeft className="h-4 w-4" />
								</button>
								<button
									onClick={() => setCurrentPage((p) => p + 1)}
									disabled={!pagination.hasMore}
									className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<ChevronRight className="h-4 w-4" />
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Modal */}
				{showModal && (
					<div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center min-h-screen px-4 bg-black bg-opacity-50">
						<div className="relative w-full max-w-lg mx-auto bg-white rounded-lg shadow-xl">
							<div className="px-6 py-4 border-b border-slate-200">
								<h3 className="text-lg font-semibold text-slate-800">
									{selectedUser
										? "Уреди Корисник"
										: "Нов Корисник"}
								</h3>
							</div>

							<form
								onSubmit={handleSubmit}
								className="px-6 py-4 space-y-4"
							>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										Корисничко име *
									</label>
									<input
										type="text"
										required
										value={formData.username}
										onChange={(e) =>
											setFormData({
												...formData,
												username: e.target.value,
											})
										}
										className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										Лозинка{" "}
										{selectedUser &&
											"(оставете празно за да не ја промените)"}
									</label>
									<input
										type="password"
										required={!selectedUser}
										value={formData.password}
										onChange={(e) =>
											setFormData({
												...formData,
												password: e.target.value,
											})
										}
										className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
										minLength={4}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										Улога *
									</label>
									<select
										required
										value={formData.role}
										onChange={(e) =>
											setFormData({
												...formData,
												role: e.target.value,
											})
										}
										className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
									>
										<option value="user">Корисник</option>
										<option value="admin">Админ</option>
										<option value="superadmin">
											Супер Админ
										</option>
									</select>
								</div>

								{formData.role !== "superadmin" && (
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-2">
											Организација *
										</label>
										<select
											required={
												formData.role !== "superadmin"
											}
											value={formData.organizationId}
											onChange={(e) =>
												setFormData({
													...formData,
													organizationId:
														e.target.value,
												})
											}
											className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
										>
											<option value="">
												Избери организација
											</option>
											{organizations.map((org) => (
												<option
													key={org._id}
													value={org._id}
												>
													{org.name}
												</option>
											))}
										</select>
									</div>
								)}

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
											: selectedUser
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
