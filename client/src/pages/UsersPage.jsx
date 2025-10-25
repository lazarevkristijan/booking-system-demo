import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit2, Trash2, Shield, User as UserIcon } from "lucide-react"
import { getUsers, createUser, updateUser, deleteUser } from "../constants"
import { useTranslation } from "react-i18next"

export const UsersPage = () => {
	const { t } = useTranslation()
	const queryClient = useQueryClient()
	const [showModal, setShowModal] = useState(false)
	const [selectedUser, setSelectedUser] = useState(null)
	const [formData, setFormData] = useState({
		username: "",
		password: "",
		role: "user",
	})

	// Fetch users with React Query
	const { data: users = [], isLoading } = useQuery({
		queryKey: ["users"],
		queryFn: getUsers,
	})

	// Create mutation
	const createMutation = useMutation({
		mutationFn: createUser,
		onSuccess: () => {
			queryClient.invalidateQueries(["users"])
			setShowModal(false)
			resetForm()
		},
	})

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: ({ id, data }) => updateUser(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries(["users"])
			setShowModal(false)
			resetForm()
		},
	})

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: deleteUser,
		onSuccess: () => {
			queryClient.invalidateQueries(["users"])
		},
	})

	const resetForm = () => {
		setFormData({ username: "", password: "", role: "user" })
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
			password: "", // Don't pre-fill password
			role: user.role,
		})
		setShowModal(true)
	}

	const handleSubmit = (e) => {
		e.preventDefault()

		if (selectedUser) {
			// Update existing user
			updateMutation.mutate({
				id: selectedUser._id,
				data: formData,
			})
		} else {
			// Create new user
			createMutation.mutate(formData)
		}
	}

	const handleDelete = (user) => {
		if (window.confirm(`${t("users.deleteConfirm")} - ${user.username}?`)) {
			deleteMutation.mutate(user._id)
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
						{t("users.title")}
					</h1>
					<p className="text-slate-600 mt-1 text-sm sm:text-base">
						{t("users.subtitle")}
					</p>
				</div>

				{/* Add Button */}
				<div className="mb-4">
					<button
						onClick={handleAdd}
						className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors min-h-[44px]"
					>
						<Plus className="h-5 w-5 mr-2" />
						{t("users.addUser")}
					</button>
				</div>

				{/* Users Table */}
				<div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-slate-200">
							<thead className="bg-slate-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
										{t("users.username")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
										{t("users.role")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
										{t("users.created")}
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
										{t("common.actions")}
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-slate-200">
								{users.map((user) => (
									<tr
										key={user._id}
										className="hover:bg-slate-50 transition-colors"
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
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
													user.role === "admin"
														? "bg-purple-100 text-purple-800"
														: "bg-blue-100 text-blue-800"
												}`}
											>
												{user.role === "admin" ? (
													<>
														<Shield className="h-3 w-3 mr-1" />{" "}
														{t(
															"users.administrator"
														)}
													</>
												) : (
													<>
														<UserIcon className="h-3 w-3 mr-1" />{" "}
														{t("users.employee")}
													</>
												)}
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
												onClick={() => handleEdit(user)}
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
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Modal */}
				{showModal && (
					<div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0 bg-black bg-opacity-50">
						<div className="relative w-full max-w-lg mx-auto bg-white rounded-lg shadow-xl">
							{/* Header */}
							<div className="px-6 py-4 border-b border-slate-200">
								<h3 className="text-lg font-semibold text-slate-800">
									{selectedUser
										? t("users.editUser")
										: t("users.newUser")}
								</h3>
							</div>

							{/* Form */}
							<form
								onSubmit={handleSubmit}
								className="px-6 py-4 space-y-4"
							>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										{t("users.username")} *
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
										className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
										placeholder={t(
											"users.usernamePlaceholder"
										)}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										{t("users.password")}{" "}
										{selectedUser &&
											t("users.passwordHint")}
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
										className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
										placeholder={t(
											"users.passwordPlaceholder"
										)}
										minLength={4}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										{t("users.role")} *
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
										className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
									>
										<option value="user">
											{t("users.employee")}
										</option>
										<option value="admin">
											{t("users.administrator")}
										</option>
									</select>
								</div>

								{/* Footer */}
								<div className="flex items-center justify-end gap-3 pt-4">
									<button
										type="button"
										onClick={() => {
											setShowModal(false)
											resetForm()
										}}
										className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 min-h-[44px]"
									>
										{t("common.cancel")}
									</button>
									<button
										type="submit"
										disabled={
											createMutation.isLoading ||
											updateMutation.isLoading
										}
										className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 min-h-[44px] disabled:opacity-50"
									>
										{createMutation.isLoading ||
										updateMutation.isLoading
											? `${t("common.save")}...`
											: selectedUser
											? t("common.save")
											: t("common.add")}
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
