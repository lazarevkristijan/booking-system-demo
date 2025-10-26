// client/src/utils/timezone.js
import { DateTime } from "luxon"

/**
 * Convert organization timezone date to UTC
 * Treats the input date's components (year, month, day, hour, minute) as if they're in the org timezone
 * @param {Date} orgDate - Date whose components should be interpreted as org timezone
 * @param {String} timezone - IANA timezone (default: Europe/Skopje)
 * @returns {String} ISO string in UTC
 */
export function convertOrgTimezoneToUTC(orgDate, timezone = "Europe/Skopje") {
	if (!orgDate) return null

	try {
		// Get the date components (these are in the user's LOCAL timezone from datetime-local)
		// But we want to interpret them as if they're in the org timezone
		const dt = DateTime.fromObject(
			{
				year: orgDate.getFullYear(),
				month: orgDate.getMonth() + 1,
				day: orgDate.getDate(),
				hour: orgDate.getHours(),
				minute: orgDate.getMinutes(),
				second: orgDate.getSeconds(),
			},
			{ zone: timezone } // ← This says "treat these components as Europe/Skopje time"
		)
		return dt.toUTC().toISO()
	} catch (error) {
		console.error("Error converting org timezone to UTC:", error)
		return new Date(orgDate).toISOString()
	}
}
