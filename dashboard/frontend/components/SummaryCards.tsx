'use client'

import { Summary } from '@/types/release'

interface Props {
	summary: Summary
}

function BoxIcon() {
	return (
		<svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
			<polyline points="3.27 6.96 12 12.01 20.73 6.96" />
			<line x1="12" y1="22.08" x2="12" y2="12" />
		</svg>
	)
}

function CheckCircleIcon() {
	return (
		<svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
			<polyline points="22 4 12 14.01 9 11.01" />
		</svg>
	)
}

function AlertTriangleIcon() {
	return (
		<svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
			<line x1="12" y1="9" x2="12" y2="13" />
			<line x1="12" y1="17" x2="12.01" y2="17" />
		</svg>
	)
}

function LockIcon() {
	return (
		<svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" />
		</svg>
	)
}

export default function SummaryCards({ summary }: Props) {
	const cards = [
		{
			label: 'Total Releases',
			value: summary.total_releases,
			sub: `${summary.passed_releases} passed · ${summary.failed_releases} failed`,
			color: 'text-white',
			icon: <BoxIcon />,
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
			icon: <CheckCircleIcon />,
		},
		{
			label: 'Critical CVEs',
			value: summary.total_critical,
			sub: `${summary.total_high} high severity`,
			color: summary.total_critical > 0 ? 'text-red-400' : 'text-green-400',
			icon: <AlertTriangleIcon />,
		},
		{
			label: 'SLSA Level',
			value: 'Level 3',
			sub: 'Verified provenance',
			color: 'text-blue-400',
			icon: <LockIcon />,
		},
	]

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{cards.map((card) => (
				<div
					key={card.label}
					className="bg-gray-900 border border-gray-800 rounded-xl p-5"
				>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<p className="text-xs text-gray-500 uppercase tracking-wider">{card.label}</p>
							<p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
							<p className="text-xs text-gray-500 mt-1">{card.sub}</p>
						</div>
						<div className="mt-1">{card.icon}</div>
					</div>
				</div>
			))}
		</div>
	)
}
