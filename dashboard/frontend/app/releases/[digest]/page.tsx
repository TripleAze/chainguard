import { getRelease } from '@/lib/api'
import CheckBadge from '@/components/CheckBadge'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
	params: { digest: string }
}

export default async function ReleasePage({ params }: Props) {
	const release = await getRelease(params.digest).catch(() => null)
	if (!release) notFound()

	const shortDigest = release.digest.replace('sha256:', 'sha256:').slice(0, 19) + '...'
	const shortCommit = release.git_commit?.slice(0, 7) ?? '—'

	return (
		<main className="min-h-screen bg-gray-950 text-gray-100">
			<header className="border-b border-gray-800 bg-gray-900">
				<div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
					<Link href="/" className="text-gray-400 hover:text-white text-sm">
						← Dashboard
					</Link>
					<span className="text-gray-600">/</span>
					<span className="text-sm text-gray-300 font-mono">{shortDigest}</span>
				</div>
			</header>

			<div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
				{/* Release header */}
				<div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
					<div className="flex items-start justify-between">
						<div>
							<h1 className="text-lg font-semibold text-white font-mono">
								{release.image_ref}
							</h1>
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
					<a
						href={release.workflow_run}
						target="_blank"
						rel="noopener noreferrer"
						className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
					>
						View in GitHub Actions ↗
					</a>
				</div>
			</div>
		</main>
	)
}
