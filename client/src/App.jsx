import { useState, useEffect } from "react"
import { HashRouter, Routes, Route, Navigate } from "react-router-dom"
import { Layout } from "./components/Layout"
import { DashboardPage } from "./pages/DashboardPage"
import { EmployeesPage } from "./pages/EmployeesPage"
import { ServicesPage } from "./pages/ServicesPage"
import { ClientsPage } from "./pages/ClientsPage"
import { LoginPage } from "./pages/LoginPage"
import { HistoryPage } from "./pages/HistoryPage"
import axios from "axios"
axios.defaults.withCredentials = true
import { getCurrentUser, getSession } from "./constants"

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

const PublicRoute = ({ children, isAuthenticated }) => {
	return !isAuthenticated ? (
		children
	) : (
		<Navigate
			to="/dashboard"
			replace
		/>
	)
}

export const App = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [currentUsername, setCurrentUsername] = useState("")

	useEffect(() => {
		const checkAuth = async () => {
			const authStateBool = await getSession()
			setIsAuthenticated(authStateBool)
			setIsLoading(false)
		}
		checkAuth()
	}, [])

	useEffect(() => {
		const fetchUser = async () => {
			const userInfo = await getCurrentUser()
			if (userInfo?.username) {
				setCurrentUsername(userInfo.username)
			}
		}
		fetchUser()
	})

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-slate-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto mb-4"></div>
					<p className="text-slate-600">Зареждане...</p>
				</div>
			</div>
		)
	}

	return (
		<HashRouter>
			<Routes>
				<Route
					path="/login"
					element={
						<PublicRoute isAuthenticated={isAuthenticated}>
							<LoginPage
								setIsAuthenticated={setIsAuthenticated}
								onLogin={() => setIsAuthenticated(true)}
							/>
						</PublicRoute>
					}
				/>
				<Route
					path="/"
					element={
						<ProtectedRoute isAuthenticated={isAuthenticated}>
							<Layout onLogout={() => setIsAuthenticated(false)}>
								<Navigate
									to="/dashboard"
									replace
								/>
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute isAuthenticated={isAuthenticated}>
							<Layout onLogout={() => setIsAuthenticated(false)}>
								<DashboardPage />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/employees"
					element={
						<ProtectedRoute isAuthenticated={isAuthenticated}>
							<Layout onLogout={() => setIsAuthenticated(false)}>
								<EmployeesPage />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/services"
					element={
						<ProtectedRoute isAuthenticated={isAuthenticated}>
							<Layout onLogout={() => setIsAuthenticated(false)}>
								<ServicesPage />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/clients"
					element={
						<ProtectedRoute isAuthenticated={isAuthenticated}>
							<Layout onLogout={() => setIsAuthenticated(false)}>
								<ClientsPage />
							</Layout>
						</ProtectedRoute>
					}
				/>

				<Route
					path="/history"
					element={
						currentUsername === "admin" ? (
							<ProtectedRoute isAuthenticated={isAuthenticated}>
								<Layout
									onLogout={() => setIsAuthenticated(false)}
								>
									<HistoryPage />
								</Layout>
							</ProtectedRoute>
						) : (
							<>
								<Navigate to={"/"} />
							</>
						)
					}
				/>
			</Routes>
		</HashRouter>
	)
}
