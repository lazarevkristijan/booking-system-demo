import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
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
	searchPlaceholder,
	addButtonText,
	serverSidePagination = false,
	totalItems = 0,
	currentPage = 1,
	pageSize = 50,
	onPageChange,
	onSearchChange,
	isLoading = false,
}) => {
	const { t } = useTranslation()
	const [searchTerm, setSearchTerm] = useState("")
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
	const [localCurrentPage, setLocalCurrentPage] = useState(1)

	const finalSearchPlaceholder = searchPlaceholder || t("common.search")
	const finalAddButtonText = addButtonText || t("common.add")

	// Debounce search term
	useEffect(() => {
		const handler = setTimeout(() => {
			// Only update and reset page if search term actually changed
			if (debouncedSearchTerm !== searchTerm) {
				setDebouncedSearchTerm(searchTerm)
				// Reset to page 1 when search changes
				if (serverSidePagination && onPageChange) {
					onPageChange(1)
				} else {
					setLocalCurrentPage(1)
				}
			}
		}, 300) // 300ms debounce delay

		return () => {
			clearTimeout(handler)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchTerm, serverSidePagination])

	// Notify parent of search changes (for server-side)
	useEffect(() => {
		if (serverSidePagination && onSearchChange) {
			onSearchChange(debouncedSearchTerm)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearchTerm, serverSidePagination])

	// Client-side filtering and pagination (fallback for non-server-side mode)
	const searchFilteredData = serverSidePagination
		? data // Don't filter on client if server-side
		: debouncedSearchTerm === ""
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
	const itemsPerPage = serverSidePagination ? pageSize : 10
	const totalPages = serverSidePagination
		? Math.ceil(totalItems / pageSize)
		: Math.ceil(searchFilteredData.length / itemsPerPage)

	const effectiveCurrentPage = serverSidePagination
		? currentPage
		: localCurrentPage

	const startIndex = (effectiveCurrentPage - 1) * itemsPerPage
	const endIndex = startIndex + itemsPerPage

	const paginatedData = serverSidePagination
		? data // Already paginated by server
		: searchFilteredData.slice(startIndex, endIndex)

	const totalDisplayItems = serverSidePagination
		? totalItems
		: searchFilteredData.length

	const handlePageChange = (newPage) => {
		if (serverSidePagination && onPageChange) {
			onPageChange(newPage)
		} else {
			setLocalCurrentPage(newPage)
		}
	}

	const formatValue = (value, type) => {
		if (value === null || value === undefined) return "-"

		switch (type) {
			case "currency":
				return `${parseFloat(value).toFixed(2)} ${t("common.currency")}` // ✅
			case "phone":
				return value
			case "date":
				return new Date(value).toLocaleDateString()
			case "datetime":
				return new Date(value).toLocaleString(t("common.locale"), {
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
								placeholder={finalSearchPlaceholder}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								disabled={isLoading}
								className="pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent w-full sm:w-auto touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
							/>
						</div>
						{/* Add button */}
						<button
							onClick={onAdd}
							disabled={isLoading}
							className="inline-flex items-center justify-center px-4 py-3 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors touch-manipulation min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<Plus className="h-4 w-4 mr-2" />
							{finalAddButtonText}
						</button>
					</div>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				{isLoading ? (
					<div className="px-4 sm:px-6 py-12 text-center">
						<div className="animate-pulse space-y-4">
							<div className="h-8 bg-slate-200 rounded w-full"></div>
							<div className="h-8 bg-slate-200 rounded w-full"></div>
							<div className="h-8 bg-slate-200 rounded w-full"></div>
						</div>
					</div>
				) : paginatedData.length === 0 ? (
					<div className="px-4 sm:px-6 py-12 text-center">
						<div className="text-slate-400 text-sm">
							{searchTerm
								? t("common.noResults")
								: t("common.noData")}
						</div>
						{!searchTerm && (
							<button
								onClick={onAdd}
								className="mt-4 inline-flex items-center px-4 py-3 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors touch-manipulation min-h-[44px]"
							>
								<Plus className="h-4 w-4 mr-2" />
								{finalAddButtonText}
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
									{t("common.actions")}
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
													disabled={isLoading}
													className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation disabled:opacity-50"
													title={t("common.view")}
												>
													<Eye className="h-4 w-4" />
												</button>
											)}
											{onEdit && (
												<button
													onClick={() => onEdit(item)}
													disabled={isLoading}
													className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation disabled:opacity-50"
													title={t("common.edit")}
												>
													<Edit className="h-4 w-4" />
												</button>
											)}
											{onDelete && (
												<button
													onClick={() =>
														onDelete(item)
													}
													disabled={isLoading}
													className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation disabled:opacity-50"
													title={t("common.delete")}
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

			{/* Pagination Controls */}
			{!isLoading && totalDisplayItems > 0 && (
				<div className="px-4 sm:px-6 py-4 border-t border-slate-200">
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
						<div className="text-sm text-slate-700">
							{t("common.showing")} {/* ✅ */}
							<span className="font-medium">
								{startIndex + 1}
							</span>{" "}
							{t("common.to")} {/* ✅ */}
							<span className="font-medium">
								{Math.min(
									startIndex + paginatedData.length,
									totalDisplayItems
								)}
							</span>{" "}
							{t("common.of")} {/* ✅ */}
							<span className="font-medium">
								{totalDisplayItems}
							</span>{" "}
							{t("common.results")} {/* ✅ */}
						</div>

						{totalPages > 1 && (
							<div className="flex items-center gap-2">
								<button
									onClick={() =>
										handlePageChange(
											Math.max(
												1,
												effectiveCurrentPage - 1
											)
										)
									}
									disabled={
										effectiveCurrentPage === 1 || isLoading
									}
									className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors"
								>
									<ChevronLeft className="h-4 w-4 mr-1" />
									{t("common.previous")}
								</button>

								<span className="text-sm text-slate-700 px-3">
									{t("common.page")} {effectiveCurrentPage}{" "}
									{t("common.of")} {totalPages}
								</span>

								<button
									onClick={() =>
										handlePageChange(
											Math.min(
												totalPages,
												effectiveCurrentPage + 1
											)
										)
									}
									disabled={
										effectiveCurrentPage === totalPages ||
										isLoading
									}
									className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors"
								>
									{t("common.next")}
									<ChevronRight className="h-4 w-4 ml-1" />
								</button>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
