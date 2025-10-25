import ReactDOM from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { App } from "./App.jsx"
import "./index.css"
import { ErrorBoundary } from "./components/ErrorBoundary.jsx"
import "./i18n/config" // ✅ Add this import
import "./utils/axios-config" // ✅ Add this

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
			cacheTime: 1000 * 60 * 10, // Cache persists for 10 minutes
			refetchOnWindowFocus: false, // Don't refetch on window focus
			refetchOnReconnect: true, // Refetch when reconnecting
			retry: 1, // Only retry failed requests once
			retryDelay: (attemptIndex) =>
				Math.min(1000 * 2 ** attemptIndex, 30000),
		},
		mutations: {
			retry: 0, // Don't retry mutations
		},
	},
})

ReactDOM.createRoot(document.getElementById("root")).render(
	<ErrorBoundary>
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>
	</ErrorBoundary>
)
