'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useRouter, notFound } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import CheckBadge from '@/components/CheckBadge'
import { ChainGuardReport } from '@/components/pdf/ChainGuardReport'
import Link from 'next/link'
import { clientGetRelease } from '@/lib/clientApi'
import { Release } from '@/types/release'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
)

function ArrowLeftIcon() {
	return (
		<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<line x1="19" y1="12" x2="5" y2="12" />
			<polyline points="12 19 5 12 12 5" />
		</svg>
	)
}

function ExternalLinkIcon() {
	return (
		<svg className="w-4 h-4 inline ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
			<polyline points="15 3 21 3 21 9" />
			<line x1="10" y1="14" x2="21" y2="3" />
		</svg>
	)
}

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

export default function ReleasePage() {
	const params = useParams()
	const digest = params.digest as string
	const { user, loading: authLoading, login, logout } = useAuth()
	const router = useRouter()
	const [release, setRelease] = useState<Release | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!authLoading) {
			if (user) {
				loadRelease()
			} else {
				setLoading(false)
			}
		}
	}, [authLoading, user, digest])

	const loadRelease = async () => {
		setLoading(true)
		setError(null)
		try {
			const data = await clientGetRelease(digest)
			setRelease(data)
		} catch (err) {
			console.error('Failed to load release:', err)
			setError('Failed to load release')
		} finally {
			setLoading(false)
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

	if (loading) {
		return (
			<main className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
				<div className="text-gray-400">Loading release...</div>
			</main>
		)
	}

	if (!release) {
		notFound()
	}

	const shortDigest = release.digest.replace('sha256:', 'sha256:').slice(0, 19) + '...'
	const shortCommit = release.git_commit?.slice(0, 7) ?? '—'

	return (
		<main className="min-h-screen bg-gray-950 text-gray-100">
			{/* Header */}
			<header className="border-b border-gray-800 bg-gray-900">
				<div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
					<Link href="/" className="text-gray-400 hover:text-white text-sm flex items-center gap-2">
						<ArrowLeftIcon />
						Dashboard
					</Link>
					<span className="text-gray-600">/</span>
					<span className="text-sm text-gray-300 font-mono">{shortDigest}</span>
					<div className="ml-auto flex items-center gap-4">
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
				</div>
			</header>

			<div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
				{error && (
					<div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
						<p className="text-red-400">{error}</p>
						<button onClick={loadRelease} className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm">
							Try again
						</button>
					</div>
				)}

				{/* Release header */}
				<div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
					<div className="flex items-start justify-between">
						<div>
							<h1 className="text-lg font-semibold text-white">{release.image_ref}</h1>
							<p className="text-sm text-gray-400 font-mono mt-1">{release.digest}</p>
						</div>
						<span className={`px-3 py-1 rounded-full text-sm font-medium ${
							release.passed
								? 'bg-green-900/50 text-green-400 border border-green-800'
								: 'bg-red-900/50 text-red-400 border border-red-800'
						}`}>
							{release.overall}
						</span>
					</div>

					<div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
						<div>
							<p className="text-gray-500">Commit</p>
							<p className="text-gray-200 font-mono">{shortCommit}</p>
						</div>
						<div>
							<p className="text-gray-500">Branch</p>
							<p className="text-gray-200 font-mono">{release.git_ref?.replace('refs/heads/', '') ?? '—'}</p>
						</div>
						<div>
							<p className="text-gray-500">Built</p>
							<p className="text-gray-200">{new Date(release.built_at).toLocaleString()}</p>
						</div>
						<div>
							<p className="text-gray-500">SLSA Level</p>
							<p className="text-gray-200">Level {release.slsa_level}</p>
						</div>
					</div>
				</div>

				{/* Check results */}
				<div className="space-y-3">
					<h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
						Security Checks
					</h2>

					<CheckBadge
						label="Signature"
						passed={release.sig_passed}
						detail={release.sig_detail}
					/>

					<CheckBadge
						label="SBOM"
						passed={release.sbom_passed}
						detail={`${release.sbom_packages} packages · ${release.sbom_version}`}
					/>

					<CheckBadge
						label="Vulnerability Scan"
						passed={release.vuln_passed}
						detail={`${release.vuln_critical} critical · ${release.vuln_high} high · ${release.vuln_medium} medium · ${release.vuln_low} low · ${release.vuln_scanner}`}
					/>

					<CheckBadge
						label="Provenance"
						passed={release.prov_passed}
						detail={`Commit ${release.prov_commit} · ${release.prov_ref?.replace('refs/heads/', '')} · ${release.prov_builder?.split('/').pop()}`}
					/>
				</div>

				{/* Actions */}
				<div className="flex gap-3">
					<PDFDownloadLink
						document={<ChainGuardReport release={release} />}
						fileName={`chainguard-report-${release.digest.slice(7, 19)}.pdf`}
					>
						{({ loading }) => (
							<button className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
								{loading ? 'Generating...' : '⬇ Export PDF Report'}
							</button>
						)}
					</PDFDownloadLink>
					<a
						href={release.workflow_run}
						target="_blank"
						rel="noopener noreferrer"
						className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors flex items-center gap-2"
					>
						View in GitHub Actions
						<ExternalLinkIcon />
					</a>
				</div>
			</div>
		</main>
	)
}
