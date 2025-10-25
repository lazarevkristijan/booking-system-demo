# Timezone Implementation Guide

This document describes the complete timezone functionality that has been added to the Digitermin application.

## Overview

The application now supports **per-organization timezone settings**. Each organization can set its preferred timezone, and all dates/times throughout the app will be:

-   **Stored in UTC** in the database (best practice)
-   **Displayed in the organization's timezone** in the UI
-   **Converted automatically** when creating/editing bookings

## What Was Implemented

### Backend Changes

#### 1. **Organization Model** (`server/models/Organization.js`)

-   Added `timezone` field (default: "UTC")
-   This field stores the IANA timezone identifier (e.g., "Europe/Skopje", "America/New_York")

#### 2. **Timezone Utilities** (`server/utils/timezone.js`)

-   `convertUTCToOrgTimezone()` - Converts UTC dates to organization timezone
-   `convertOrgTimezoneToUTC()` - Converts organization timezone dates to UTC
-   `formatDateInOrgTimezone()` - Formats dates for display
-   `getCurrentDateTimeInOrgTimezone()` - Gets current time in org timezone

#### 3. **Updated Routes**

**Auth Routes** (`server/routes/auth.js`):

-   `/api/auth/login` - Returns organization timezone on login
-   `/api/auth/me` - Returns organization timezone with user info

**Organizations Routes** (`server/routes/organizations.js`):

-   `PUT /api/organizations/:id` - Full organization update (superadmin only)
-   `PATCH /api/organizations/:id/settings` - Update organization settings like timezone (admin only, own org)
-   Validates timezone against IANA timezone list

**Bookings Routes** (`server/routes/bookings.js`):

-   `GET /api/bookings` - Converts all booking times from UTC to org timezone
-   `GET /api/bookings/:id` - Converts single booking times
-   `POST /api/bookings` - Accepts times in org timezone, converts to UTC for storage
-   `PUT /api/bookings/:id` - Same timezone conversion for updates

#### 4. **Migration Script** (`server/scripts/migrate-timezones.js`)

-   Adds `timezone: "UTC"` to all existing organizations
-   Run once to update existing data

### Frontend Changes

#### 1. **Timezone Utilities** (`client/src/utils/timezone.js`)

-   `COMMON_TIMEZONES` - List of 18 common timezones with labels
-   `convertUTCToOrgTimezone()` - Client-side UTC to org timezone conversion
-   `convertOrgTimezoneToUTC()` - Client-side org timezone to UTC conversion
-   `formatDateInOrgTimezone()` - Format dates in org timezone
-   `getCurrentDateTimeInOrgTimezone()` - Get current time in org timezone
-   `getTimezoneOffset()` - Get timezone offset string (e.g., "+02:00")

#### 2. **Organization Context** (`client/src/contexts/OrganizationContext.jsx`)

-   Provides organization data (including timezone) to components
-   `useOrganization()` hook for accessing org data
-   `refreshOrganization()` function to reload org data

#### 3. **Organization Settings Page** (`client/src/pages/OrganizationSettingsPage.jsx`)

-   **Admin-only page** at `/settings`
-   Dropdown to select from 18 common timezones
-   Shows current timezone and offset
-   Save button to update organization timezone
-   Success/error messages

#### 4. **Updated Components**

**App.jsx**:

-   Added `/settings` route (admin only)
-   Wrapped DashboardPage with OrganizationProvider

**BookingModal.jsx**:

-   Uses `useOrganization()` to get timezone
-   Converts booking times to UTC before sending to backend
-   Times are displayed in organization timezone

**Constants.js**:

-   Added "Settings" to admin navigation menu

#### 5. **Translations**

Added translations in English, Macedonian, and Bulgarian for:

-   `settings.organizationSettings`
-   `settings.timezone`
-   `settings.timezoneDescription`
-   `settings.selectTimezone`
-   `settings.currentTimezone`
-   `settings.timezoneNote`
-   `settings.saveSuccess`
-   `settings.saveError`

## How It Works

### Data Flow

```
Frontend (Browser) → Organization TZ → UTC → Database
                                        ↓
Frontend (Browser) ← Organization TZ ← UTC ← Database
```

1. **Creating a Booking**:

    - User selects time in UI (e.g., "2:00 PM")
    - Frontend interprets this as 2:00 PM in **organization timezone**
    - Frontend converts to UTC before sending to backend
    - Backend stores in UTC in database

2. **Displaying a Booking**:
    - Backend retrieves UTC time from database
    - Backend converts to organization timezone
    - Frontend displays time in organization timezone

### Example Scenario

**Organization**: Set to "Europe/Skopje" (UTC+1 in winter, UTC+2 in summer)

1. User creates booking for **3:00 PM** on their calendar
2. Frontend converts: `3:00 PM Skopje` → `1:00 PM UTC` (winter) or `2:00 PM UTC` (summer)
3. Backend stores: `13:00:00 UTC` or `14:00:00 UTC`
4. When displayed: UTC time → converted back → shown as `3:00 PM`

## Available Timezones

The settings page includes 18 commonly used timezones:

-   UTC (Coordinated Universal Time)
-   Europe: London, Paris, Berlin, Athens, Moscow, Sofia, Belgrade, Skopje
-   Americas: New York, Chicago, Denver, Los Angeles
-   Asia: Dubai, Mumbai, Shanghai, Tokyo
-   Australia: Sydney

_Note: You can add more timezones by editing `COMMON_TIMEZONES` in `client/src/utils/timezone.js`_

## How to Use

### For Administrators

1. **Access Settings**:

    - Log in as an admin user
    - Click "Подесувања" (Settings) in the sidebar

2. **Change Timezone**:

    - Select your organization's timezone from the dropdown
    - Click "Save" button
    - Confirmation message will appear

3. **Effect**:
    - All existing bookings will now display in the new timezone
    - New bookings will be created in the new timezone
    - Backend stores everything in UTC (unchanged)

### For Developers

#### Adding OrganizationProvider to a Page

```jsx
import { OrganizationProvider } from "./contexts/OrganizationContext"
;<OrganizationProvider>
	<YourComponent />
</OrganizationProvider>
```

#### Using Timezone in Components

```jsx
import { useOrganization } from "../contexts/OrganizationContext"
import {
	convertUTCToOrgTimezone,
	convertOrgTimezoneToUTC,
} from "../utils/timezone"

function MyComponent() {
	const { organization } = useOrganization()
	const timezone = organization?.timezone || "UTC"

	// Convert UTC to org timezone
	const localTime = convertUTCToOrgTimezone(utcDate, timezone)

	// Convert org timezone to UTC (before sending to backend)
	const utcTime = convertOrgTimezoneToUTC(localDate, timezone)

	return <div>{localTime.toLocaleString()}</div>
}
```

## Testing

### Manual Testing Steps

1. **Set Organization Timezone**:

    - Go to Settings page
    - Change timezone (e.g., from UTC to Europe/Skopje)
    - Save changes

2. **Create a Booking**:

    - Go to Dashboard
    - Click on a time slot (e.g., 3:00 PM)
    - Create a booking
    - Check that it appears at 3:00 PM

3. **Verify Database**:

    - Check MongoDB - time should be stored in UTC
    - Example: If you created booking at 3:00 PM Skopje time, it should be stored as 1:00 PM or 2:00 PM UTC (depending on DST)

4. **Change Timezone Again**:
    - Change to different timezone
    - Verify existing bookings display in new timezone
    - Create new booking and verify it works

## Dependencies

-   **luxon** - Timezone handling library (installed on both client and server)
    -   Server: `npm install luxon` in `/server`
    -   Client: `npm install luxon` in `/client`

## Important Notes

1. **All times stored in UTC**: The database always stores times in UTC, ensuring consistency
2. **Daylight Saving Time**: Luxon handles DST automatically
3. **Timezone validation**: Backend validates timezone against IANA timezone list
4. **Admin only**: Only administrators can change organization timezone (for their own organization)
5. **Immediate effect**: Changing timezone immediately affects all date displays
6. **No data migration needed**: Existing bookings don't need conversion (they're already UTC)
7. **Separate endpoint**: Uses `PATCH /api/organizations/:id/settings` (not the superadmin-only PUT endpoint)

## Future Enhancements

Possible improvements:

-   Add user-level timezone preference (override organization setting)
-   Show timezone indicator in UI (e.g., "All times in Europe/Skopje timezone")
-   Add timezone in PDF exports/reports
-   Support for displaying times in multiple timezones
-   Add history log when timezone is changed

## Troubleshooting

### Times appearing wrong

-   Check organization timezone setting in Settings page
-   Verify browser is not forcing local timezone
-   Check that OrganizationProvider is wrapping the component

### Saving timezone fails

-   Ensure user has admin role
-   Check that timezone string is valid IANA timezone
-   Check browser console for errors

### Migration script issues

-   Ensure MongoDB connection string is correct
-   Check that Organization model is accessible
-   Verify you're running from project root directory

## Files Changed/Added

### Backend

-   ✅ `server/models/Organization.js` - Added timezone field
-   ✅ `server/utils/timezone.js` - NEW - Timezone utilities
-   ✅ `server/routes/organizations.js` - Updated to handle timezone
-   ✅ `server/routes/auth.js` - Returns timezone with user info
-   ✅ `server/routes/bookings.js` - Timezone conversion on all routes
-   ✅ `server/scripts/migrate-timezones.js` - NEW - Migration script

### Frontend

-   ✅ `client/src/utils/timezone.js` - NEW - Timezone utilities
-   ✅ `client/src/contexts/OrganizationContext.jsx` - NEW - Organization context
-   ✅ `client/src/pages/OrganizationSettingsPage.jsx` - NEW - Settings page
-   ✅ `client/src/App.jsx` - Added settings route
-   ✅ `client/src/components/BookingModal.jsx` - Timezone conversion
-   ✅ `client/src/constants.js` - Added Settings to navigation
-   ✅ `client/src/i18n/locales/en.json` - Added translations
-   ✅ `client/src/i18n/locales/mk.json` - Added translations
-   ✅ `client/src/i18n/locales/bg.json` - Added translations

---

**Implementation Complete!** ✅

The timezone functionality is now fully integrated into your application. Organizations can manage their timezone preferences, and all date/time operations will respect the configured timezone while maintaining UTC storage in the database.
