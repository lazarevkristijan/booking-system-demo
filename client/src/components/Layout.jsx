import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Menu, X, LogOut, User } from "lucide-react"
import axios from "axios"
axios.defaults.withCredentials = true
import {
	getCurrentUser,
	getLogout,
	navItems,
	adminNavItems,
	superadminNavItems,
} from "../constants"
import { ConnectionStatus } from "./ConnectionStatus"
import { useQueryClient } from "@tanstack/react-query"

// Main Layout component
export const Layout = ({ children, onLogout, userRole }) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const location = useLocation()
	const navigate = useNavigate()
	const [currentUsername, setCurrentUsername] = useState("")
	const [organizationName, setOrganizationName] = useState("")
	const queryClient = useQueryClient()

	const handleLogout = async () => {
		await getLogout()

		queryClient.clear()

		if (onLogout) onLogout()
		navigate("/login", { replace: true })
	}

	useEffect(() => {
		const fetchUser = async () => {
			const userInfo = await getCurrentUser()
			if (userInfo?.username) {
				setCurrentUsername(userInfo.username)
			}
			if (userInfo?.organization) {
				setOrganizationName(userInfo.organization.name)
			}
		}
		fetchUser()
	}, [])

	const isAdmin = userRole === "admin"
	const isSuperAdmin = userRole === "superadmin"

	return (
		<div className="min-h-screen flex flex-col bg-slate-50">
			{/* Mobile Nav */}
			<div className="sm:hidden flex items-center justify-between px-4 py-4 bg-white border-b border-slate-200 shadow-sm">
				<Link
					to="/dashboard"
					className="flex items-center gap-2 font-bold text-slate-800 text-lg font-poppins"
				>
					<span className="flex w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 items-center justify-center text-white font-bold text-sm">
						MC
					</span>
					{isSuperAdmin ? "SuperAdmin" : organizationName}
				</Link>
				<button
					className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
					onClick={() => setIsMenuOpen(true)}
					aria-label="Open menu"
				>
					<Menu className="h-6 w-6 text-slate-700" />
				</button>
			</div>
			{/* Mobile Drawer */}
			{isMenuOpen && (
				<div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex">
					<div className="w-64 bg-white h-full shadow-lg flex flex-col">
						<div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
							<Link
								to="/dashboard"
								className="flex items-center gap-2 font-bold text-slate-800 text-lg font-poppins"
								onClick={() => setIsMenuOpen(false)}
							>
								<span className="flex w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 items-center justify-center text-white font-bold text-sm">
									MC
								</span>
								{isSuperAdmin ? "SuperAdmin" : organizationName}
							</Link>
							<button
								className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
								onClick={() => setIsMenuOpen(false)}
								aria-label="Close menu"
							>
								<X className="h-6 w-6 text-slate-700" />
							</button>
						</div>
						<nav className="flex-1 px-2 py-4 space-y-1">
							{/* Regular nav items - only show if not superadmin */}
							{!isSuperAdmin &&
								navItems.map((item) => (
									<Link
										key={item.path}
										to={item.path}
										className={`flex items-center px-4 py-3 rounded-lg font-medium text-base transition-colors ${
											location.pathname === item.path
												? "bg-slate-100 text-slate-900"
												: "text-slate-700 hover:bg-slate-50"
										}`}
										onClick={() => setIsMenuOpen(false)}
									>
										<item.icon className="h-5 w-5 mr-2" />
										{item.name}
									</Link>
								))}

							{/* Admin nav items */}
							{isAdmin && !isSuperAdmin && (
								<>
									<div className="px-4 py-2">
										<div className="border-t border-slate-200"></div>
										<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
											Администрација
										</p>
									</div>
									{adminNavItems.map((item) => (
										<Link
											key={item.path}
											to={item.path}
											className={`flex items-center px-4 py-3 rounded-lg font-medium text-base transition-colors ${
												location.pathname === item.path
													? "bg-blue-100 text-blue-900"
													: "text-slate-700 hover:bg-slate-50"
											}`}
											onClick={() => setIsMenuOpen(false)}
										>
											<item.icon className="h-5 w-5 mr-2" />
											{item.name}
										</Link>
									))}
								</>
							)}

							{/* ✅ Superadmin nav items */}
							{isSuperAdmin && (
								<>
									<div className="px-4 py-2">
										<p className="text-xs font-semibold text-purple-500 uppercase tracking-wider">
											Супер Администратор
										</p>
									</div>
									{superadminNavItems.map((item) => (
										<Link
											key={item.path}
											to={item.path}
											className={`flex items-center px-4 py-3 rounded-lg font-medium text-base transition-colors ${
												location.pathname === item.path
													? "bg-purple-100 text-purple-900"
													: "text-slate-700 hover:bg-slate-50"
											}`}
											onClick={() => setIsMenuOpen(false)}
										>
											<item.icon className="h-5 w-5 mr-2" />
											{item.name}
										</Link>
									))}
								</>
							)}

							<button
								className="flex items-center w-full px-4 py-3 rounded-lg font-medium text-base text-slate-700 hover:bg-slate-50 transition-colors mt-2"
								onClick={() => {
									setIsMenuOpen(false)
									handleLogout()
								}}
							>
								<LogOut className="h-5 w-5 mr-2" />
								Одјава
							</button>

							<div
								className={`flex items-center px-4 py-3 rounded-lg font-medium text-base transition-colors text-slate-600 bg-slate-50 border border-slate-200`}
							>
								<User className="h-5 w-5 mr-2" />
								Корисник: {currentUsername || "Вчитување..."}
							</div>
						</nav>
					</div>
					<div
						className="flex-1"
						onClick={() => setIsMenuOpen(false)}
					/>
				</div>
			)}

			{/* Desktop Sidebar */}
			<div className="hidden sm:flex flex-row min-h-screen">
				<aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
					<div className="flex items-center gap-2 px-6 py-6">
						<span className="flex w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 items-center justify-center text-white font-bold text-xl">
							MС
						</span>
						<span className="font-bold text-slate-800 text-xl font-poppins">
							{organizationName}
						</span>
					</div>
					<nav className="flex-1 px-2 py-4 space-y-1">
						{/* Regular nav items - only show if not superadmin */}
						{!isSuperAdmin &&
							navItems.map((item) => (
								<Link
									key={item.path}
									to={item.path}
									className={`flex items-center px-4 py-3 rounded-lg font-medium text-base transition-colors ${
										location.pathname === item.path
											? "bg-slate-100 text-slate-900"
											: "text-slate-700 hover:bg-slate-50"
									}`}
								>
									<item.icon className="h-5 w-5 mr-2" />
									{item.name}
								</Link>
							))}

						{/* Admin nav items */}
						{isAdmin && !isSuperAdmin && (
							<>
								<div className="px-4 py-2">
									<div className="border-t border-slate-200"></div>
									<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
										Администрација
									</p>
								</div>
								{adminNavItems.map((item) => (
									<Link
										key={item.path}
										to={item.path}
										className={`flex items-center px-4 py-3 rounded-lg font-medium text-base transition-colors ${
											location.pathname === item.path
												? "bg-blue-100 text-blue-900"
												: "text-slate-700 hover:bg-slate-50"
										}`}
									>
										<item.icon className="h-5 w-5 mr-2" />
										{item.name}
									</Link>
								))}
							</>
						)}

						{/* ✅ Superadmin nav items */}
						{isSuperAdmin && (
							<>
								<div className="px-4 py-2">
									<p className="text-xs font-semibold text-purple-500 uppercase tracking-wider">
										Супер Администратор
									</p>
								</div>
								{superadminNavItems.map((item) => (
									<Link
										key={item.path}
										to={item.path}
										className={`flex items-center px-4 py-3 rounded-lg font-medium text-base transition-colors ${
											location.pathname === item.path
												? "bg-purple-100 text-purple-900"
												: "text-slate-700 hover:bg-slate-50"
										}`}
									>
										<item.icon className="h-5 w-5 mr-2" />
										{item.name}
									</Link>
								))}
							</>
						)}
						<div
							className={`flex items-center px-4 py-3 rounded-lg font-medium text-base transition-colors text-slate-600 bg-slate-50 border border-slate-200`}
						>
							<User className="h-5 w-5 mr-2" />
							Корисник: {currentUsername || "Вчитување..."}
						</div>
					</nav>
					<div className="px-6 py-4">
						<button
							className="flex items-center w-full px-4 py-3 rounded-lg font-medium text-base text-slate-700 hover:bg-slate-50 transition-colors"
							onClick={handleLogout}
						>
							<LogOut className="h-5 w-5 mr-2" />
							Одјава
						</button>
					</div>
				</aside>
				<main className="flex-1 min-h-screen bg-slate-50">
					{children}
				</main>
			</div>
			{/* Mobile Main */}
			<div className="sm:hidden flex-1">{children}</div>
			<ConnectionStatus />
		</div>
	)
}
