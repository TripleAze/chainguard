'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/components/AuthProvider'
import SummaryCards from '@/components/SummaryCards'
import CVETrendChart from '@/components/CVETrendChart'
import ReleaseTimeline from '@/components/ReleaseTimeline'
import { SummaryReport } from '@/components/pdf/SummaryReport'
import { clientGetSummary, clientGetReleases, clientGetCVETrend } from '@/lib/clientApi'
import { Summary, ReleasesResponse, CVETrendResponse } from '@/types/release'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
)

function ShieldIcon() {
	return (
		<svg className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
			<path d="m9 12 2 2 4-4" />
		</svg>
	)
}

function GitHubIcon() {
	return (
		<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
		</svg>
	)
}

export default function DashboardPage() {
	const { user, loading: authLoading, login, logout } = useAuth()
	const [dataLoading, setDataLoading] = useState(true)
	const [summary, setSummary] = useState<Summary | null>(null)
	const [releasesData, setReleasesData] = useState<ReleasesResponse | null>(null)
	const [cveTrend, setCveTrend] = useState<CVETrendResponse | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!authLoading && user) {
			loadData()
		} else if (!authLoading && !user) {
			setDataLoading(false)
		}
	}, [authLoading, user])

	const loadData = async () => {
		setDataLoading(true)
		setError(null)
		try {
			const [summaryRes, releasesRes, trendRes] = await Promise.all([
				clientGetSummary(),
				clientGetReleases({ page: 1, limit: 20 }),
				clientGetCVETrend(30),
			])
			setSummary(summaryRes)
			setReleasesData(releasesRes)
			setCveTrend(trendRes)
		} catch (err) {
			setError('Failed to load dashboard data')
			console.error(err)
		} finally {
			setDataLoading(false)
		}
	}

	if (authLoading) {
		return (
			<main className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
				<div className="text-gray-400">Loading...</div>
			</main>
		)
	}

	if (!user) {
		return (
			<main className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
				<div className="text-center space-y-6">
					<div className="flex justify-center">
						<ShieldIcon />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-white mb-2">ChainGuard</h1>
						<p className="text-gray-400">Supply Chain Compliance Dashboard</p>
					</div>
					<button
						onClick={login}
						className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
					>
						<GitHubIcon />
						Sign in with GitHub
					</button>
				</div>
			</main>
		)
	}

	if (error) {
		return (
			<main className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
				<div className="text-center space-y-4">
					<p className="text-red-400">{error}</p>
					<button
						onClick={loadData}
						className="text-cyan-400 hover:text-cyan-300"
					>
						Try again
					</button>
				</div>
			</main>
		)
	}

	return (
		<main className="min-h-screen bg-gray-950 text-gray-100">
			{/* Header */}
			<header className="border-b border-gray-800 bg-gray-900">
				<div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
					<ShieldIcon />
					<div className="flex-1">
						<h1 className="text-lg font-semibold text-white">ChainGuard</h1>
						<p className="text-xs text-gray-400">Supply Chain Compliance Dashboard</p>
					</div>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							{user.avatar && (
								<img src={user.avatar} alt={user.login} className="w-8 h-8 rounded-full" />
							)}
							<span className="text-sm text-gray-300">{user.name || user.login}</span>
						</div>
						<button
							onClick={logout}
							className="text-sm text-gray-400 hover:text-white transition-colors"
						>
							Sign out
						</button>
					</div>
					{summary?.last_deploy_at && (
						<p className="text-sm text-gray-400 hidden md:block">
							Last deploy:{' '}
							<span className="text-gray-200">
								{new Date(summary.last_deploy_at).toLocaleString()}
							</span>
						</p>
					)}
				</div>
			</header>

			{dataLoading ? (
				<div className="max-w-7xl mx-auto px-6 py-12 flex items-center justify-center">
					<div className="text-gray-400">Loading dashboard...</div>
				</div>
			) : (
				<div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
					{/* Summary cards */}
					{summary && <SummaryCards summary={summary} />}

					{/* CVE Trend chart */}
					{cveTrend && (
						<section>
							<h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
								CVE Trend · Last 30 Days
							</h2>
							<div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
								<CVETrendChart data={cveTrend.points} />
							</div>
						</section>
					)}

					{/* Export Button */}
					{summary && releasesData && (
						<div className="flex">
							<PDFDownloadLink
								document={<SummaryReport stats={summary} releases={releasesData.releases} />}
								fileName="chainguard-portfolio-summary.pdf"
							>
								{({ loading }) => (
									<button className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
										{loading ? 'Generating...' : '⬇ Export PDF'}
									</button>
								)}
							</PDFDownloadLink>
						</div>
					)}

					{/* Release timeline */}
					{releasesData && (
						<section>
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
									Recent Releases
								</h2>
								<span className="text-xs text-gray-500">{releasesData.total} total</span>
							</div>
							<ReleaseTimeline releases={releasesData.releases} />
						</section>
					)}
				</div>
			)}
		</main>
	)
}
