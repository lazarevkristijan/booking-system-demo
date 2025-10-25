import { X, AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

export const ConfirmModal = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText,
	cancelText,
}) => {
	const { t } = useTranslation()

	const defaultTitle = title || t("common.areYouSure")
	const defaultMessage = message || t("common.deleteConfirmMessage")
	const defaultConfirmText = confirmText || t("common.yesDelete")
	const defaultCancelText = cancelText || t("common.cancel")

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
				{/* Overlay */}
				<div
					className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity"
					onClick={onClose}
				/>

				{/* Modal Box */}
				<div className="relative bg-white rounded-lg sm:rounded-xl shadow-xl w-full max-w-sm mx-auto transform transition-all">
					{/* Header */}
					<div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
						<h3 className="text-base sm:text-lg font-semibold text-slate-800">
							{defaultTitle}
						</h3>
						<button
							onClick={onClose}
							className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
							aria-label="close modal"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					{/* Content */}
					<div className="px-5 py-6 flex flex-col items-center text-center space-y-3">
						<AlertTriangle className="w-10 h-10 text-amber-500" />
						<p className="text-sm text-slate-700">
							{defaultMessage}
						</p>
					</div>

					{/* Footer */}
					<div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50">
						<button
							onClick={onClose}
							className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 min-h-[40px]"
						>
							{defaultCancelText}
						</button>
						<button
							onClick={onConfirm}
							className="px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-[40px]"
						>
							{defaultConfirmText}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ConfirmModal
