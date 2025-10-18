import { useEffect, useState } from "react"
import { CrudTable } from "../components/CrudTable"
import { getHistory } from "../constants"
import { HistoryDetailsModal } from "../components/HistoryDetailsModal"

export const HistoryPage = () => {
	const [data, setData] = useState([])
	const [pageInfo, setPageInfo] = useState({
		page: 1,
		limit: 50,
		total: 0,
	})
	const [loading, setLoading] = useState(false)
	const [selectedHistoryItem, setSelectedHistoryItem] = useState(null)
	const [isModalOpen, setIsModalOpen] = useState(false)

	const load = async (page = 1) => {
		setLoading(true)
		const res = await getHistory({ page, limit: pageInfo.limit })
		if (res?.items) {
			setData(
				res.items.map((h) => ({
					createdAt: h.createdAt,
					username: h.username || "—",
					action: h.action,
					entityType: h.entityType,
					entityId: h.entityId,
					details: JSON.stringify(h.details || {}),
				}))
			)
			setPageInfo({ page: res.page, limit: res.limit, total: res.total })
		}
		setLoading(false)
	}

	const handleViewDetails = (item) => {
		setSelectedHistoryItem(item)
		setIsModalOpen(true)
	}

	const closeModal = () => {
		setIsModalOpen(false)
		setSelectedHistoryItem(null)
	}

	useEffect(() => {
		load(1)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const columns = [
		{ key: "createdAt", label: "Кога", type: "datetime" },
		{ key: "username", label: "Потребител" },
		{ key: "action", label: "Действие" },
		{ key: "entityType", label: "Тип" },
		// { key: "entityId", label: "ID" },
		{ key: "details", label: "Детайли" },
	]

	return (
		<div className="p-4 sm:p-6">
			<CrudTable
				title={loading ? "История (зареждане...)" : "История"}
				data={data}
				columns={columns}
				onAdd={() => load(pageInfo.page)} // reuse as refresh button
				onView={handleViewDetails}
				addButtonText="Опресни"
				searchPlaceholder="Търсене в история..."
			/>
			<HistoryDetailsModal
				isOpen={isModalOpen}
				onClose={closeModal}
				historyItem={selectedHistoryItem}
			/>
			{/* Simple pager
			<div className="flex items-center justify-end gap-2 mt-4">
				<button
					onClick={() => load(Math.max(1, pageInfo.page - 1))}
					className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
					disabled={pageInfo.page <= 1}
				>
					Назад
				</button>
				<span className="text-sm text-slate-600">
					Стр. {pageInfo.page} от{" "}
					{Math.max(1, Math.ceil(pageInfo.total / pageInfo.limit))}
				</span>
				<button
					onClick={() =>
						load(
							pageInfo.page + 1 >
								Math.ceil(pageInfo.total / pageInfo.limit)
								? pageInfo.page
								: pageInfo.page + 1
						)
					}
					className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
					disabled={
						pageInfo.page >=
						Math.ceil(pageInfo.total / pageInfo.limit)
					}
				>
					Напред
				</button>
			</div> */}
		</div>
	)
}
