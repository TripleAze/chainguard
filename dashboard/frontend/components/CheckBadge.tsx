'use client'

interface Props {
	label:  string
	passed: boolean
	detail?: string
}

export default function CheckBadge({ label, passed, detail }: Props) {
	return (
		<div className={`bg-gray-900 border rounded-xl p-4 flex items-start gap-4 ${
			passed ? 'border-gray-800' : 'border-red-900/50'
		}`}>
			<span className="text-xl mt-0.5">{passed ? '✅' : '❌'}</span>
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
