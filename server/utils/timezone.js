// server/utils/timezone.js
const { DateTime } = require("luxon")

/**
 * Convert a UTC date to organization's timezone
 * @param {Date|String} utcDate - Date in UTC
 * @param {String} timezone - IANA timezone (e.g., 'America/New_York')
 * @returns {String} ISO string in organization timezone
 */
function convertUTCToOrgTimezone(utcDate, timezone) {
	if (!utcDate) return null

	try {
		const dt = DateTime.fromJSDate(new Date(utcDate), { zone: "UTC" })
		return dt.setZone(timezone).toISO({ includeOffset: false })
	} catch (error) {
		console.error("Error converting UTC to org timezone:", error)
		return utcDate
	}
}

/**
 * Convert organization timezone date to UTC
 * @param {Date|String} orgDate - Date in organization timezone
 * @param {String} timezone - IANA timezone
 * @returns {Date} Date object in UTC
 */
function convertOrgTimezoneToUTC(orgDate, timezone) {
	if (!orgDate) return null

	try {
		// Parse the date as if it's in the organization's timezone
		const dt = DateTime.fromISO(orgDate, { zone: timezone })
		return dt.toUTC().toJSDate()
	} catch (error) {
		console.error("Error converting org timezone to UTC:", error)
		return new Date(orgDate)
	}
}

/**
 * Format a date for display in organization timezone
 * @param {Date|String} date - Date to format
 * @param {String} timezone - IANA timezone
 * @param {String} format - Luxon format string or preset ('DATE_SHORT', 'DATETIME_SHORT', etc.)
 * @returns {String} Formatted date string
 */
function formatDateInOrgTimezone(date, timezone, format = "DATETIME_SHORT") {
	if (!date) return ""

	try {
		const dt = DateTime.fromJSDate(new Date(date), { zone: "UTC" })
		const zonedDt = dt.setZone(timezone)

		// Check if format is a preset or custom
		if (DateTime[format]) {
			return zonedDt.toLocaleString(DateTime[format])
		}
		return zonedDt.toFormat(format)
	} catch (error) {
		console.error("Error formatting date:", error)
		return date.toString()
	}
}

/**
 * Get current date/time in organization timezone
 * @param {String} timezone - IANA timezone
 * @returns {String} Current ISO string in organization timezone
 */
function getCurrentDateTimeInOrgTimezone(timezone) {
	try {
		return DateTime.now().setZone(timezone).toISO()
	} catch (error) {
		console.error("Error getting current date in org timezone:", error)
		return new Date().toISOString()
	}
}

module.exports = {
	convertUTCToOrgTimezone,
	convertOrgTimezoneToUTC,
	formatDateInOrgTimezone,
	getCurrentDateTimeInOrgTimezone,
}
