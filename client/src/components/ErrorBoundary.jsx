import { Component } from "react"
import { AlertTriangle } from "lucide-react"

class ErrorBoundaryComponent extends Component {
	constructor(props) {
		super(props)
		this.state = { hasError: false, error: null, errorInfo: null }
	}

	static getDerivedStateFromError() {
		return { hasError: true }
	}

	componentDidCatch(error, errorInfo) {
		console.error("Error caught by boundary:", error, errorInfo)
		this.setState({
			error,
			errorInfo,
		})
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
					<div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
						<div className="flex justify-center mb-4">
							<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
								<AlertTriangle className="h-8 w-8 text-red-600" />
							</div>
						</div>
						<h1 className="text-2xl font-bold text-slate-800 mb-2">
							Нешто тргна наопаку
						</h1>
						<p className="text-slate-600 mb-6">
							Се случи неочекувана грешка. Ве молиме обидете се
							повторно.
						</p>
						{this.state.error && (
							<details className="text-left mb-4 p-4 bg-slate-50 rounded text-sm">
								<summary className="cursor-pointer font-medium text-slate-700 mb-2">
									Детали за грешката
								</summary>
								<pre className="text-xs text-red-600 overflow-auto">
									{this.state.error.toString()}
									{this.state.errorInfo?.componentStack}
								</pre>
							</details>
						)}
						<button
							onClick={() => window.location.reload()}
							className="w-full px-6 py-3 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors"
						>
							Освежи ја страницата
						</button>
					</div>
				</div>
			)
		}

		return this.props.children
	}
}

export const ErrorBoundary = ErrorBoundaryComponent
