# Heyboss JavaScript Template

A modern JavaScript project template with Supabase integration.

## 📁 Project Structure

```
root/
├── src/                    # Frontend application code
│   ├── components/         # Reusable UI components
│   ├── constants/          # Application constants and configuration
│   ├── contexts/           # React context providers for state management
│   ├── hooks/              # Custom React hooks for reusable logic
│   ├── libs/               # Utility libraries and helpers
│   ├── pages/              # Application pages
│   ├── services/           # API services and business logic
│   ├── app.jsx             # Main application component
│   ├── index.css           # Global styles
│   ├── main.jsx            # Application entry point
└── supabase/               # Supabase related code
  ├── configurations/       # Supabase configurations
  └── migrations/           # Supabase database migrations
```

## 🛠️ Technologies

-   **Frontend**: JavaScript
-   **Backend**: Supabase
-   **Database**: PostgreSQL (via Supabase)

## 🔧 Environment Variables

-   `VITE_SUPABASE_URL` - Supabase project URL
-   `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key for client-side operations
-   `VITE_PROJECT_ID` - Unique identifier for your project
-   `VITE_PROJECT_NAME` - Your project name
-   `VITE_USER_ID` - User identifier for the application
-   `VITE_USER_EMAIL` - User email address for the application
-   `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key for location services
-   `VITE_API_KEY` - General API key for external service integrations
