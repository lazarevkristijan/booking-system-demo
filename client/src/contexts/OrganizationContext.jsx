// client/src/contexts/OrganizationContext.jsx
import { createContext, useContext, useState, useEffect } from "react"
import { getCurrentUser } from "../constants"

const OrganizationContext = createContext()

export function OrganizationProvider({ children }) {
	const [organization, setOrganization] = useState(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function fetchOrganization() {
			try {
				const userInfo = await getCurrentUser()
				if (userInfo?.organization) {
					setOrganization(userInfo.organization)
				}
			} catch (error) {
				console.error("Error fetching organization:", error)
			} finally {
				setLoading(false)
			}
		}
		fetchOrganization()
	}, [])

	const refreshOrganization = async () => {
		const userInfo = await getCurrentUser()
		if (userInfo?.organization) {
			setOrganization(userInfo.organization)
		}
	}

	return (
		<OrganizationContext.Provider
			value={{ organization, loading, refreshOrganization }}
		>
			{children}
		</OrganizationContext.Provider>
	)
}

export function useOrganization() {
	const context = useContext(OrganizationContext)
	if (!context) {
		throw new Error(
			"useOrganization must be used within OrganizationProvider"
		)
	}
	return context
}
