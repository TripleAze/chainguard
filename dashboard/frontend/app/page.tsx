import { getSummary, getReleases, getCVETrend } from '@/lib/api'
import SummaryCards from '@/components/SummaryCards'
import CVETrendChart from '@/components/CVETrendChart'
import ReleaseTimeline from '@/components/ReleaseTimeline'

export const revalidate = 60 // revalidate every 60s

export default async function DashboardPage() {
	const [summary, { releases, total }, trend] = await Promise.all([
		getSummary(),
		getReleases({ page: 1, limit: 20 }),
		getCVETrend(30),
	])

	return (
		<main className="min-h-screen bg-gray-950 text-gray-100">
			{/* Header */}
			<header className="border-b border-gray-800 bg-gray-900">
				<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<span className="text-2xl">🛡️</span>
						<div>
							<h1 className="text-lg font-semibold text-white">ChainGuard</h1>
							<p className="text-xs text-gray-400">Supply Chain Compliance Dashboard</p>
						</div>
					</div>
					{summary.last_deploy_at && (
						<p className="text-sm text-gray-400">
							Last deploy:{' '}
							<span className="text-gray-200">
								{new Date(summary.last_deploy_at).toLocaleString()}
							</span>
						</p>
					)}
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
				{/* Summary cards */}
				<SummaryCards summary={summary} />

				{/* CVE Trend chart */}
				<section>
					<h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
						CVE Trend — Last 30 Days
					</h2>
					<div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
						<CVETrendChart data={trend.points} />
					</div>
				</section>

				{/* Release timeline */}
				<section>
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
							Recent Releases
						</h2>
						<span className="text-xs text-gray-500">{total} total</span>
					</div>
					<ReleaseTimeline releases={releases} />
				</section>
			</div>
		</main>
	)
}
