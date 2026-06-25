'use client'

import { Summary } from '@/types/release'

interface Props {
	summary: Summary
}

export default function SummaryCards({ summary }: Props) {
	const cards = [
		{
			label: 'Total Releases',
			value: summary.total_releases,
			sub: `${summary.passed_releases} passed · ${summary.failed_releases} failed`,
			color: 'text-white',
		},
		{
			label: 'Pass Rate',
			value: `${summary.pass_rate}%`,
			sub: 'Last 30 days',
			color: summary.pass_rate >= 95
				? 'text-green-400'
				: summary.pass_rate >= 80
					? 'text-yellow-400'
					: 'text-red-400',
		},
		{
			label: 'Critical CVEs',
			value: summary.total_critical,
			sub: `${summary.total_high} high severity`,
			color: summary.total_critical > 0 ? 'text-red-400' : 'text-green-400',
		},
		{
			label: 'SLSA Level',
			value: 'Level 2',
			sub: 'Hosted CI, isolated provenance',
			color: 'text-blue-400',
		},
	]

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{cards.map((card) => (
				<div
					key={card.label}
					className="bg-gray-900 border border-gray-800 rounded-xl p-5"
				>
					<p className="text-xs text-gray-500 uppercase tracking-wider">{card.label}</p>
					<p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
					<p className="text-xs text-gray-500 mt-1">{card.sub}</p>
				</div>
			))}
		</div>
	)
}
