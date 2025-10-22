import React, { useEffect, useState } from "react"
import {
	Plus,
	Edit,
	Trash2,
	Search,
	Eye,
	ChevronLeft,
	ChevronRight,
} from "lucide-react"

export const CrudTable = ({
	title,
	data = [],
	columns = [],
	onAdd,
	onEdit,
	onDelete,
	onView,
	searchPlaceholder = "Пребарување...",
	addButtonText = "Додади Нов",
}) => {
	const [searchTerm, setSearchTerm] = useState("")
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
	const [currentPage, setCurrentPage] = useState(1)

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm)
		}, 300) // 300ms debounce delay

		return () => {
			clearTimeout(handler) // Cleanup on next effect
		}
	}, [searchTerm])

	// Reset to page 1 when search term changes
	useEffect(() => {
		setCurrentPage(1)
	}, [debouncedSearchTerm])

	const searchFilteredData =
		debouncedSearchTerm === ""
			? data
			: data.filter((item) =>
					Object.values(item).some((value) =>
						value
							?.toString()
							.toLowerCase()
							.includes(debouncedSearchTerm.toLowerCase())
					)
			  )

	// Calculate pagination
	const itemsPerPage = 10
	const totalPages = Math.ceil(searchFilteredData.length / itemsPerPage)
	const startIndex = (currentPage - 1) * itemsPerPage
	const endIndex = startIndex + itemsPerPage
	const paginatedData = searchFilteredData.slice(startIndex, endIndex)

	const formatValue = (value, type) => {
		if (value === null || value === undefined) return "-"

		switch (type) {
			case "currency":
				return `${parseFloat(value).toFixed(2)} ден.`
			case "phone":
				return value
			case "date":
				return new Date(value).toLocaleDateString()
			case "datetime":
				return new Date(value).toLocaleString("mk-MK", {
					hour12: false,
				})
			default:
				return value.toString()
		}
	}

	return (
		<div className="bg-white rounded-lg shadow-sm border border-slate-200">
			{/* Header */}
			<div className="px-4 sm:px-6 py-4 border-b border-slate-200">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<h2 className="text-lg sm:text-xl font-semibold text-slate-800 font-poppins">
						{title}
					</h2>
					<div className="flex flex-col sm:flex-row gap-3">
						{/* Search */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
							<input
								type="text"
								placeholder={searchPlaceholder}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent w-full sm:w-auto touch-manipulation"
							/>
						</div>
						{/* Add button */}
						<button
							onClick={onAdd}
							className="inline-flex items-center justify-center px-4 py-3 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors touch-manipulation min-h-[44px]"
						>
							<Plus className="h-4 w-4 mr-2" />
							{addButtonText}
						</button>
					</div>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				{paginatedData.length === 0 ? (
					<div className="px-4 sm:px-6 py-12 text-center">
						<div className="text-slate-400 text-sm">
							{searchTerm
								? "Нема пронајдени резултати"
								: "Нема достапни податоци"}
						</div>
						{!searchTerm && (
							<button
								onClick={onAdd}
								className="mt-4 inline-flex items-center px-4 py-3 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors touch-manipulation min-h-[44px]"
							>
								<Plus className="h-4 w-4 mr-2" />
								{addButtonText}
							</button>
						)}
					</div>
				) : (
					<table className="min-w-full divide-y divide-slate-200">
						<thead className="bg-slate-50">
							<tr>
								{columns.map((column) => (
									<th
										key={column.key}
										className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap"
									>
										{column.label}
									</th>
								))}
								<th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">
									Акции
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-slate-200">
							{paginatedData.map((item, index) => (
								<tr
									key={item._id || index}
									className="hover:bg-slate-50 active:bg-slate-100"
								>
									{columns.map((column) => (
										<td
											key={column.key}
											className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-900"
										>
											{item[column.key]?.length > 30
												? `${formatValue(
														item[column.key],
														column.type
												  ).slice(0, 30)}...`
												: formatValue(
														item[column.key],
														column.type
												  )}
										</td>
									))}
									<td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<div className="flex items-center justify-end gap-1 sm:gap-2">
											{onView && (
												<button
													onClick={() => onView(item)}
													className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation"
													title="Види Детали"
												>
													<Eye className="h-4 w-4" />
												</button>
											)}
											{onEdit && (
												<button
													onClick={() => onEdit(item)}
													className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation"
													title="Уреди"
												>
													<Edit className="h-4 w-4" />
												</button>
											)}
											{onDelete && (
												<button
													onClick={() =>
														onDelete(item)
													}
													className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
													title="Избриши"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
			{/* Pagination Controls - ADD THIS */}
			{searchFilteredData.length > 0 && (
				<div className="px-4 sm:px-6 py-4 border-t border-slate-200">
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
						<div className="text-sm text-slate-700">
							Прикажани{" "}
							<span className="font-medium">
								{startIndex + 1}
							</span>{" "}
							до{" "}
							<span className="font-medium">
								{Math.min(endIndex, searchFilteredData.length)}
							</span>{" "}
							од{" "}
							<span className="font-medium">
								{searchFilteredData.length}
							</span>{" "}
							резултати
						</div>

						<div className="flex items-center gap-2">
							<button
								onClick={() =>
									setCurrentPage((p) => Math.max(1, p - 1))
								}
								disabled={currentPage === 1}
								className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
								aria-label="Претходна страна"
							>
								<ChevronLeft className="h-5 w-5" />
							</button>

							<span className="text-sm text-slate-700 px-3">
								Страна {currentPage} од {totalPages}
							</span>

							<button
								onClick={() =>
									setCurrentPage((p) =>
										Math.min(totalPages, p + 1)
									)
								}
								disabled={currentPage === totalPages}
								className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
								aria-label="Следна страна"
							>
								<ChevronRight className="h-5 w-5" />
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
