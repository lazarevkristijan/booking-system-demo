export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
	return (
		<div className="animate-pulse">
			<div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
				{/* Header */}
				<div className="bg-slate-50 px-6 py-4">
					<div
						className="grid gap-4"
						style={{
							gridTemplateColumns: `repeat(${columns}, 1fr)`,
						}}
					>
						{Array.from({ length: columns }).map((_, i) => (
							<div
								key={i}
								className="h-4 bg-slate-200 rounded"
							></div>
						))}
					</div>
				</div>
				{/* Rows */}
				<div className="divide-y divide-slate-200">
					{Array.from({ length: rows }).map((_, i) => (
						<div
							key={i}
							className="px-6 py-4"
						>
							<div
								className="grid gap-4"
								style={{
									gridTemplateColumns: `repeat(${columns}, 1fr)`,
								}}
							>
								{Array.from({ length: columns }).map((_, j) => (
									<div
										key={j}
										className="h-4 bg-slate-200 rounded"
									></div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export const CalendarSkeleton = () => {
	return (
		<div className="animate-pulse">
			<div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
				<div className="space-y-4">
					<div className="h-8 bg-slate-200 rounded w-1/3"></div>
					<div className="grid grid-cols-7 gap-2">
						{Array.from({ length: 35 }).map((_, i) => (
							<div
								key={i}
								className="h-24 bg-slate-100 rounded"
							></div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

export const CardSkeleton = () => {
	return (
		<div className="animate-pulse">
			<div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
				<div className="space-y-3">
					<div className="h-4 bg-slate-200 rounded w-3/4"></div>
					<div className="h-4 bg-slate-200 rounded w-1/2"></div>
					<div className="h-4 bg-slate-200 rounded w-5/6"></div>
				</div>
			</div>
		</div>
	)
}
