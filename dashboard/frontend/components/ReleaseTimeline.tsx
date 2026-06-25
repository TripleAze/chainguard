'use client'

import Link from 'next/link'
import { Release } from '@/types/release'

interface Props {
	releases: Release[]
}

function CheckDot({ passed }: { passed: boolean }) {
	return (
		<span className={`inline-block w-2 h-2 rounded-full ${passed ? 'bg-green-400' : 'bg-red-400'}`} />
	)
}

export default function ReleaseTimeline({ releases }: Props) {
	if (!releases?.length) {
		return (
			<div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
				<p className="text-gray-500">No releases yet.</p>
				<p className="text-gray-600 text-sm mt-1">
					Releases will appear here after a successful pipeline run.
				</p>
			</div>
		)
	}

	return (
		<div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
						<th className="px-4 py-3 text-left">Digest</th>
						<th className="px-4 py-3 text-left">Branch</th>
						<th className="px-4 py-3 text-left">Built</th>
						<th className="px-4 py-3 text-center">Sig</th>
						<th className="px-4 py-3 text-center">SBOM</th>
						<th className="px-4 py-3 text-center">Vuln</th>
						<th className="px-4 py-3 text-center">Prov</th>
						<th className="px-4 py-3 text-center">Result</th>
					</tr>
				</thead>
				<tbody>
					{releases.map((r, i) => (
						<tr
							key={r.id}
							className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
								i === releases.length - 1 ? 'border-b-0' : ''
							}`}
						>
							<td className="px-4 py-3">
								<Link
									href={`/releases/${encodeURIComponent(r.digest)}`}
									className="font-mono text-cyan-400 hover:text-cyan-300 text-xs"
								>
									{r.digest.slice(7, 19)}...
								</Link>
							</td>
							<td className="px-4 py-3 text-gray-400 font-mono text-xs">
								{r.git_ref?.replace('refs/heads/', '') ?? '—'}
							</td>
							<td className="px-4 py-3 text-gray-400 text-xs">
								{new Date(r.built_at).toLocaleString()}
							</td>
							<td className="px-4 py-3 text-center">
								<CheckDot passed={r.sig_passed} />
							</td>
							<td className="px-4 py-3 text-center">
								<CheckDot passed={r.sbom_passed} />
							</td>
							<td className="px-4 py-3 text-center">
								<CheckDot passed={r.vuln_passed} />
							</td>
							<td className="px-4 py-3 text-center">
								<CheckDot passed={r.prov_passed} />
							</td>
							<td className="px-4 py-3 text-center">
								<span className={`px-2 py-0.5 rounded text-xs font-medium ${
									r.passed
										? 'bg-green-900/50 text-green-400'
										: 'bg-red-900/50 text-red-400'
								}`}>
									{r.overall}
								</span>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
