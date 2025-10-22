import { useState, useEffect, lazy, Suspense } from "react"
import { HashRouter, Routes, Route, Navigate } from "react-router-dom"
import { Layout } from "./components/Layout"
import { DashboardPage } from "./pages/DashboardPage"
import { LoginPage } from "./pages/LoginPage"
import axios from "axios"
axios.defaults.withCredentials = true
import { getCurrentUser, getSession } from "./constants"
import { useQueryClient } from "@tanstack/react-query"

// Lazy load admin pages for better performance
const EmployeesPage = lazy(() =>
	import("./pages/EmployeesPage").then((m) => ({ default: m.EmployeesPage }))
)
const ServicesPage = lazy(() =>
	import("./pages/ServicesPage").then((m) => ({ default: m.ServicesPage }))
)
const ClientsPage = lazy(() =>
	import("./pages/ClientsPage").then((m) => ({ default: m.ClientsPage }))
)
const HistoryPage = lazy(() =>
	import("./pages/HistoryPage").then((m) => ({ default: m.HistoryPage }))
)
const UsersPage = lazy(() =>
	import("./pages/UsersPage").then((m) => ({ default: m.UsersPage }))
)
const SuperAdminOrganizationsPage = lazy(() =>
	import("./pages/SuperAdminOrganizationsPage").then((m) => ({
		default: m.SuperAdminOrganizationsPage,
	}))
)
const SuperAdminUsersPage = lazy(() =>
	import("./pages/SuperAdminUsersPage").then((m) => ({
		default: m.SuperAdminUsersPage,
	}))
)

const LoadingFallback = () => (
	<div className="flex items-center justify-center min-h-screen bg-slate-50">
		<div className="text-center">
			<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto mb-4"></div>
			<p className="text-slate-600">Вчитување...</p>
		</div>
	</div>
)

const ProtectedRoute = ({ children, isAuthenticated }) => {
	return isAuthenticated ? (
		children
	) : (
		<Navigate
			to="/login"
			replace
		/>
	)
}

// ✅ FIX: AdminRoute should allow superadmin too
const AdminRoute = ({ children, isAuthenticated, userRole }) => {
	if (!isAuthenticated)
		return (
			<Navigate
				to="/login"
				replace
			/>
		)
	if (userRole !== "admin" && userRole !== "superadmin") {
		return (
			<Navigate
				to="/dashboard"
				replace
			/>
		)
	}
	return children
}

const SuperAdminRoute = ({ children, isAuthenticated, userRole }) => {
	if (!isAuthenticated)
		return (
			<Navigate
				to="/login"
				replace
			/>
		)
	if (userRole !== "superadmin")
		return (
			<Navigate
				to="/dashboard"
				replace
			/>
		)
	return children
}

// ✅ NEW: Smart redirect based on user role
const SmartRedirect = ({ userRole, isRoleLoading }) => {
	if (isRoleLoading) {
		return <LoadingFallback />
	}

	if (userRole === "superadmin") {
		return (
			<Navigate
				to="/superadmin/organizations"
				replace
			/>
		)
	}

	return (
		<Navigate
			to="/dashboard"
			replace
		/>
	)
}

export const App = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [userRole, setUserRole] = useState("")
	const [isRoleLoading, setIsRoleLoading] = useState(false) // ✅ NEW
	const queryClient = useQueryClient()

	useEffect(() => {
		const checkAuth = async () => {
			const authStateBool = await getSession()
			setIsAuthenticated(authStateBool)
			setIsLoading(false)
		}
		checkAuth()
	}, [])

	useEffect(() => {
		const fetchUserRole = async () => {
			if (isAuthenticated) {
				setIsRoleLoading(true)
				const userInfo = await getCurrentUser()
				if (userInfo?.role) {
					setUserRole(userInfo.role)
				}
				setIsRoleLoading(false)
			} else {
				setUserRole("")
				setIsRoleLoading(false)
				queryClient.clear()
			}
		}

		if (!isLoading) {
			fetchUserRole()
		}
	}, [isAuthenticated, isLoading])

	// ✅ NEW: Wait for both auth and role to load
	if (isLoading || (isAuthenticated && isRoleLoading)) {
		return <LoadingFallback />
	}

	return (
		<HashRouter>
			<Routes>
				<Route
					path="/login"
					element={
						!isAuthenticated ? (
							<LoginPage
								setIsAuthenticated={setIsAuthenticated}
							/>
						) : (
							<SmartRedirect
								userRole={userRole}
								isRoleLoading={isRoleLoading}
							/>
						)
					}
				/>

				<Route
					path="/"
					element={
						<ProtectedRoute isAuthenticated={isAuthenticated}>
							<SmartRedirect
								userRole={userRole}
								isRoleLoading={isRoleLoading}
							/>
						</ProtectedRoute>
					}
				/>

				{/* ✅ ALWAYS render dashboard route (conditionally redirect inside if superadmin) */}
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute isAuthenticated={isAuthenticated}>
							{userRole === "superadmin" ? (
								<Navigate
									to="/superadmin/organizations"
									replace
								/>
							) : (
								<Layout
									onLogout={() => setIsAuthenticated(false)}
									userRole={userRole}
								>
									<DashboardPage />
								</Layout>
							)}
						</ProtectedRoute>
					}
				/>

				<Route
					path="/employees"
					element={
						<ProtectedRoute isAuthenticated={isAuthenticated}>
							{userRole === "superadmin" ? (
								<Navigate
									to="/superadmin/organizations"
									replace
								/>
							) : (
								<Layout
									onLogout={() => setIsAuthenticated(false)}
									userRole={userRole}
								>
									<Suspense fallback={<LoadingFallback />}>
										<EmployeesPage />
									</Suspense>
								</Layout>
							)}
						</ProtectedRoute>
					}
				/>

				<Route
					path="/services"
					element={
						<ProtectedRoute isAuthenticated={isAuthenticated}>
							{userRole === "superadmin" ? (
								<Navigate
									to="/superadmin/organizations"
									replace
								/>
							) : (
								<Layout
									onLogout={() => setIsAuthenticated(false)}
									userRole={userRole}
								>
									<Suspense fallback={<LoadingFallback />}>
										<ServicesPage />
									</Suspense>
								</Layout>
							)}
						</ProtectedRoute>
					}
				/>

				<Route
					path="/clients"
					element={
						<ProtectedRoute isAuthenticated={isAuthenticated}>
							{userRole === "superadmin" ? (
								<Navigate
									to="/superadmin/organizations"
									replace
								/>
							) : (
								<Layout
									onLogout={() => setIsAuthenticated(false)}
									userRole={userRole}
								>
									<Suspense fallback={<LoadingFallback />}>
										<ClientsPage />
									</Suspense>
								</Layout>
							)}
						</ProtectedRoute>
					}
				/>

				{/* Admin Only Routes */}
				<Route
					path="/users"
					element={
						<AdminRoute
							isAuthenticated={isAuthenticated}
							userRole={userRole}
						>
							<Layout
								onLogout={() => setIsAuthenticated(false)}
								userRole={userRole}
							>
								<Suspense fallback={<LoadingFallback />}>
									<UsersPage />
								</Suspense>
							</Layout>
						</AdminRoute>
					}
				/>

				<Route
					path="/history"
					element={
						<AdminRoute
							isAuthenticated={isAuthenticated}
							userRole={userRole}
						>
							<Layout
								onLogout={() => setIsAuthenticated(false)}
								userRole={userRole}
							>
								<Suspense fallback={<LoadingFallback />}>
									<HistoryPage />
								</Suspense>
							</Layout>
						</AdminRoute>
					}
				/>

				{/* Superadmin Only Routes */}
				<Route
					path="/superadmin/organizations"
					element={
						<SuperAdminRoute
							isAuthenticated={isAuthenticated}
							userRole={userRole}
						>
							<Layout
								onLogout={() => setIsAuthenticated(false)}
								userRole={userRole}
							>
								<Suspense fallback={<LoadingFallback />}>
									<SuperAdminOrganizationsPage />
								</Suspense>
							</Layout>
						</SuperAdminRoute>
					}
				/>

				<Route
					path="/superadmin/users"
					element={
						<SuperAdminRoute
							isAuthenticated={isAuthenticated}
							userRole={userRole}
						>
							<Layout
								onLogout={() => setIsAuthenticated(false)}
								userRole={userRole}
							>
								<Suspense fallback={<LoadingFallback />}>
									<SuperAdminUsersPage />
								</Suspense>
							</Layout>
						</SuperAdminRoute>
					}
				/>
			</Routes>
		</HashRouter>
	)
}
