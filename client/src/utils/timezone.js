// client/src/utils/timezone.js
import { DateTime } from "luxon"

/**
 * Get list of common timezones
 */
export const COMMON_TIMEZONES = [
	{
		value: "UTC",
		label: "UTC (Coordinated Universal Time)",
		offset: "+00:00",
	},
	{ value: "Europe/London", label: "London (GMT/BST)", offset: "" },
	{ value: "Europe/Paris", label: "Paris (CET/CEST)", offset: "" },
	{ value: "Europe/Berlin", label: "Berlin (CET/CEST)", offset: "" },
	{ value: "Europe/Athens", label: "Athens (EET/EEST)", offset: "" },
	{ value: "Europe/Moscow", label: "Moscow (MSK)", offset: "" },
	{ value: "Europe/Sofia", label: "Sofia (EET/EEST)", offset: "" },
	{ value: "Europe/Belgrade", label: "Belgrade (CET/CEST)", offset: "" },
	{ value: "Europe/Skopje", label: "Skopje (CET/CEST)", offset: "" },
	{ value: "America/New_York", label: "New York (EST/EDT)", offset: "" },
	{ value: "America/Chicago", label: "Chicago (CST/CDT)", offset: "" },
	{ value: "America/Denver", label: "Denver (MST/MDT)", offset: "" },
	{
		value: "America/Los_Angeles",
		label: "Los Angeles (PST/PDT)",
		offset: "",
	},
	{ value: "Asia/Dubai", label: "Dubai (GST)", offset: "" },
	{ value: "Asia/Kolkata", label: "Mumbai (IST)", offset: "" },
	{ value: "Asia/Shanghai", label: "Shanghai (CST)", offset: "" },
	{ value: "Asia/Tokyo", label: "Tokyo (JST)", offset: "" },
	{ value: "Australia/Sydney", label: "Sydney (AEDT/AEST)", offset: "" },
]

/**
 * Convert UTC date to organization timezone
 * @param {Date|String} utcDate - Date in UTC
 * @param {String} timezone - IANA timezone
 * @returns {Date} Date object in organization timezone
 */
export function convertUTCToOrgTimezone(utcDate, timezone = "UTC") {
	if (!utcDate) return null

	try {
		const dt = DateTime.fromISO(new Date(utcDate).toISOString(), {
			zone: "UTC",
		})
		return dt.setZone(timezone).toJSDate()
	} catch (error) {
		console.error("Error converting UTC to org timezone:", error)
		return new Date(utcDate)
	}
}

/**
 * Convert organization timezone date to UTC
 * @param {Date|String} orgDate - Date in organization timezone
 * @param {String} timezone - IANA timezone
 * @returns {String} ISO string in UTC
 */
export function convertOrgTimezoneToUTC(orgDate, timezone = "UTC") {
	if (!orgDate) return null

	try {
		// Treat the date as if it's in the organization's timezone
		let dt
		if (orgDate instanceof Date) {
			// If it's a Date object, get its components and interpret them in org timezone
			dt = DateTime.fromObject(
				{
					year: orgDate.getFullYear(),
					month: orgDate.getMonth() + 1,
					day: orgDate.getDate(),
					hour: orgDate.getHours(),
					minute: orgDate.getMinutes(),
					second: orgDate.getSeconds(),
				},
				{ zone: timezone }
			)
		} else {
			dt = DateTime.fromISO(orgDate, { zone: timezone })
		}
		return dt.toUTC().toISO()
	} catch (error) {
		console.error("Error converting org timezone to UTC:", error)
		return new Date(orgDate).toISOString()
	}
}

/**
 * Format date in organization timezone
 * @param {Date|String} date - Date to format
 * @param {String} timezone - IANA timezone
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {String} Formatted date string
 */
export function formatDateInOrgTimezone(date, timezone = "UTC", options = {}) {
	if (!date) return ""

	try {
		const dt = DateTime.fromJSDate(new Date(date), { zone: "UTC" })
		return dt.setZone(timezone).toLocaleString(options)
	} catch (error) {
		console.error("Error formatting date:", error)
		return date.toString()
	}
}

/**
 * Get current date/time in organization timezone
 * @param {String} timezone - IANA timezone
 * @returns {Date} Current date in organization timezone
 */
export function getCurrentDateTimeInOrgTimezone(timezone = "UTC") {
	try {
		return DateTime.now().setZone(timezone).toJSDate()
	} catch (error) {
		console.error("Error getting current date in org timezone:", error)
		return new Date()
	}
}

/**
 * Get timezone offset string for display
 * @param {String} timezone - IANA timezone
 * @returns {String} Offset string like '+02:00'
 */
export function getTimezoneOffset(timezone = "UTC") {
	try {
		const now = DateTime.now().setZone(timezone)
		return now.toFormat("ZZ")
	} catch (error) {
		return "+00:00"
	}
}
