'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/components/AuthProvider'
import Header from '@/components/Header'
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
			<main className="min-h-screen w-full flex items-center justify-center p-4" style={{
				background: 'radial-gradient(ellipse at center, #0F2744 0%, #0F172A 70%)'
			}}>
				<div className="w-full max-w-[380px] bg-[#0F172A] border border-[#1E293B] rounded-xl p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.4)]">
					<div className="flex flex-col items-center">
						<img
							src="/chainguard-logo.png"
							alt="ChainGuard"
							style={{
								height: 64,
								width: 'auto',
								background: 'transparent'
							}}
						/>

						<div className="mt-6 text-center">
							<h1 className="text-white text-xl font-semibold">ChainGuard</h1>
							<p className="text-[#64748B] text-sm mt-1">Supply Chain Security Dashboard</p>
						</div>

						<div className="mt-8 w-full">
							<button
								onClick={login}
								className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
							>
								<GitHubIcon />
								Sign in with GitHub
							</button>
						</div>

						<p className="text-[#475569] text-xs mt-6 text-center">
							Secure access · Team members only
						</p>
					</div>
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

	const lastPassed = releasesData?.releases?.[0]?.passed

	return (
		<>
			<Header lastDeployAt={summary?.last_deploy_at} lastDeployPassed={lastPassed} />
			<main className="min-h-screen bg-gray-950 text-gray-100 pt-17">
				{dataLoading ? (
					<div className="max-w-7xl mx-auto px-6 py-12 flex items-center justify-center">
						<div className="text-gray-400">Loading dashboard...</div>
					</div>
				) : (
					<div className="max-w-7xl mx-auto px-6 pt-8 pb-8 space-y-8">
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

						{/* Release timeline */}
						{releasesData && (
							<section>
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
										Recent Releases
									</h2>
									<div className="flex items-center gap-4">
										{summary && releasesData && (
											<PDFDownloadLink
												document={<SummaryReport stats={summary} releases={releasesData.releases} />}
												fileName="chainguard-portfolio-summary.pdf"
											>
												{({ loading }) => (
													<button className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
														{loading ? 'Generating...' : '⬇ Export PDF'}
													</button>
												)}
											</PDFDownloadLink>
										)}
										<span className="text-xs text-gray-500">{releasesData.total} total</span>
									</div>
								</div>
								<ReleaseTimeline releases={releasesData.releases} />
							</section>
						)}
					</div>
				)}
			</main>
		</>
	)
}
