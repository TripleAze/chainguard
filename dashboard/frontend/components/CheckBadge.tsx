'use client'

interface Props {
	label:  string
	passed: boolean
	detail?: string
}

function PassIcon() {
	return (
		<svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
			<polyline points="22 4 12 14.01 9 11.01" />
		</svg>
	)
}

function FailIcon() {
	return (
		<svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="10" />
			<line x1="15" y1="9" x2="9" y2="15" />
			<line x1="9" y1="9" x2="15" y2="15" />
		</svg>
	)
}

export default function CheckBadge({ label, passed, detail }: Props) {
	return (
		<div className={`bg-gray-900 border rounded-xl p-4 flex items-start gap-4 ${
			passed ? 'border-gray-800' : 'border-red-900/50'
		}`}>
			<div className="mt-0.5">
				{passed ? <PassIcon /> : <FailIcon />}
			</div>
			<div className="flex-1 min-w-0">
				<p className="font-medium text-white">{label}</p>
				{detail && (
					<p className="text-sm text-gray-400 mt-0.5 truncate">{detail}</p>
				)}
			</div>
			<span className={`px-2 py-0.5 rounded text-xs font-medium self-start ${
				passed
					? 'bg-green-900/50 text-green-400 border border-green-800'
					: 'bg-red-900/50 text-red-400 border border-red-800'
			}`}>
				{passed ? 'PASS' : 'FAIL'}
			</span>
		</div>
	)
}
