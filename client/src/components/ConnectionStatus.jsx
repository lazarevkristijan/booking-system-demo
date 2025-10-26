import { useState, useEffect } from "react"
import { WifiOff, Wifi } from "lucide-react"

export const ConnectionStatus = () => {
	const [isOnline, setIsOnline] = useState(navigator.onLine)
	const [showOffline, setShowOffline] = useState(false)

	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true)
			setShowOffline(false)
		}

		const handleOffline = () => {
			setIsOnline(false)
			setShowOffline(true)
		}

		window.addEventListener("online", handleOnline)
		window.addEventListener("offline", handleOffline)

		return () => {
			window.removeEventListener("online", handleOnline)
			window.removeEventListener("offline", handleOffline)
		}
	}, [])

	if (!showOffline && isOnline) return null

	return (
		<div
			className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
				isOnline ? "bg-green-500" : "bg-red-500"
			} text-white transition-all`}
		>
			{!isOnline && (
				<>
					<WifiOff className="h-5 w-5" />
					<span>Нема интернет врска</span>
				</>
			)}
		</div>
	)
}
