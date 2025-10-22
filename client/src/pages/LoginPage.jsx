import { useState } from "react"
import { Navigate } from "react-router-dom"
import { Eye, EyeOff, LogIn } from "lucide-react"
import axios from "axios"
axios.defaults.withCredentials = true
import { SERVER_API } from "../constants"
import { useQueryClient } from "@tanstack/react-query"

// LoginPage component definition
const LoginPageComponent = ({ isAuthenticated, setIsAuthenticated }) => {
	const [username, setUsername] = useState("")
	const [password, setPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const queryClient = useQueryClient()

	const handleSubmit = async (e) => {
		e.preventDefault()
		setError("")
		setLoading(true)

		try {
			queryClient.clear()

			await axios
				.post(`${SERVER_API}/auth/login`, {
					username,
					password,
				})
				.then(() => {
					setIsAuthenticated(true)
				})
				.catch((e) => setError(e.response.data.error))
		} catch (e) {
			console.error(e)
			setError("Погрешно корисничко име или лозинка")
		} finally {
			setLoading(false)
		}
	}

	if (isAuthenticated) {
		return (
			<Navigate
				to="/dashboard"
				replace
			/>
		)
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
			<div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
				<div className="mb-8 text-center">
					<h1 className="text-2xl font-bold text-slate-800 font-poppins mb-2">
						Најава во системот
					</h1>
					<p className="text-slate-600 text-sm">
						Внесете ги вашите податоци за пристап
					</p>
				</div>
				<form
					onSubmit={handleSubmit}
					className="space-y-6"
				>
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-2">
							Корисничко име
						</label>
						<input
							type="text"
							required
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
							placeholder="darko"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-2">
							Лозинка
						</label>
						<div className="relative">
							<input
								type={showPassword ? "text" : "password"}
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent pr-12"
								placeholder="1234"
								autoComplete="current-password"
							/>
							<button
								type="button"
								tabIndex={-1}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
								onClick={() => setShowPassword((v) => !v)}
								aria-label={
									showPassword
										? "Сокриј ја лозинката"
										: "Прикажи ја лозинката"
								}
							>
								{showPassword ? (
									<EyeOff className="h-5 w-5" />
								) : (
									<Eye className="h-5 w-5" />
								)}
							</button>
						</div>
					</div>
					{error && (
						<div className="text-red-600 text-sm text-center">
							{error}
						</div>
					)}
					<button
						type="submit"
						disabled={loading}
						className="w-full flex items-center justify-center px-6 py-3 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors min-h-[44px] disabled:opacity-50"
					>
						<LogIn className="h-5 w-5 mr-2" />
						{loading ? "Најавување..." : "Најава"}
					</button>
				</form>
				<div className="mt-8 text-center text-xs text-slate-400">
					<span>© 2025 MS Studio</span>
				</div>
			</div>
		</div>
	)
}

// Export as named export for router compatibility
export const LoginPage = LoginPageComponent
