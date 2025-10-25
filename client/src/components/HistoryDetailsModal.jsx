import React from "react"
import { X, User, Calendar, Activity, Tag, FileText } from "lucide-react"
import { useTranslation } from "react-i18next"

export const HistoryDetailsModal = ({ isOpen, onClose, historyItem }) => {
	const { t } = useTranslation()

	if (!isOpen || !historyItem) return null

	const formatDateTime = (dateString) => {
		return new Date(dateString).toLocaleString(t("common.locale"), {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		})
	}

	const formatDetails = (details) => {
		if (!details) return t("history.noDetails")

		try {
			const parsed =
				typeof details === "string" ? JSON.parse(details) : details
			return JSON.stringify(parsed, null, 2)
		} catch {
			return details.toString()
		}
	}

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
			<div
				className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75"
				onClick={onClose}
			></div>
			<div className="relative w-full max-w-2xl mx-auto bg-white rounded-lg sm:rounded-xl shadow-xl transform transition-all">
				{/* Header */}
				<div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200">
					<h3 className="text-base sm:text-lg font-semibold text-slate-800 font-poppins">
						{t("history.historyDetails")}
					</h3>
					<button
						onClick={onClose}
						className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
						aria-label={t("common.close")}
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Content */}
				<div className="px-4 sm:px-6 py-6 max-h-[60vh] overflow-y-auto space-y-4">
					{/* Date and Time */}
					<div className="flex justify-center items-center gap-3">
						<Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
						<div>
							<p className="text-md font-medium text-slate-600">
								{t("history.dateTime")}
							</p>
							<p className="text-slate-900">
								{formatDateTime(historyItem.createdAt)}
							</p>
						</div>
					</div>

					{/* Username */}
					<div className="flex justify-center items-center gap-3">
						<User className="h-5 w-5 text-slate-400 mt-0.5" />
						<div>
							<p className="text-md font-medium text-slate-600">
								{t("history.user")}
							</p>
							<p className="text-slate-900">
								{historyItem.username || "—"}
							</p>
						</div>
					</div>

					{/* Action */}
					<div className="flex justify-center items-center gap-3">
						<Activity className="h-5 w-5 text-slate-400 mt-0.5" />
						<div>
							<p className="text-md font-medium text-slate-600">
								{t("history.action")}
							</p>
							<p className="text-slate-900">
								{historyItem.action}
							</p>
						</div>
					</div>

					{/* Entity Type */}
					<div className="flex justify-center items-center gap-3">
						<Tag className="h-5 w-5 text-slate-400 mt-0.5" />
						<div>
							<p className="text-md font-medium text-slate-600">
								{t("history.entityType")}
							</p>
							<p className="text-slate-900">
								{historyItem.entityType}
							</p>
						</div>
					</div>

					{/* Entity ID */}
					<div className="flex justify-center items-center gap-3">
						<Tag className="h-5 w-5 text-slate-400 mt-0.5" />
						<div>
							<p className="text-md font-medium text-slate-600">
								{t("history.entityId")}
							</p>
							<p className="text-slate-900 font-mono text-sm">
								{historyItem.entityId}
							</p>
						</div>
					</div>

					{/* Details */}
					<div className="flex justify-center items-center gap-3">
						<FileText className="h-5 w-5 text-slate-400 mt-0.5" />
						<div className="flex-1">
							<p className="text-md font-medium text-slate-600">
								{t("history.details")}
							</p>
							<div className="mt-1 p-3 bg-slate-50 rounded-lg border">
								<pre className="text-sm text-slate-900 whitespace-pre-wrap font-mono overflow-x-auto">
									{formatDetails(historyItem.details)}
								</pre>
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50">
					<button
						onClick={onClose}
						className="px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 min-h-[44px]"
					>
						{t("common.close")}
					</button>
				</div>
			</div>
		</div>
	)
}
