'use client'

import {
	LineChart, Line, XAxis, YAxis, CartesianGrid,
	Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { CVETrendPoint } from '@/types/release'

interface Props {
	data: CVETrendPoint[]
}

export default function CVETrendChart({ data }: Props) {
	if (!data?.length) {
		return (
			<div className="h-48 flex items-center justify-center text-gray-600 text-sm">
				No trend data yet — releases will populate this chart.
			</div>
		)
	}

	const formatted = data.map(p => ({
		...p,
		day: new Date(p.day).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
	}))

	return (
		<ResponsiveContainer width="100%" height={220}>
			<LineChart data={formatted} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
				<CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
				<XAxis
					dataKey="day"
					tick={{ fill: '#6b7280', fontSize: 11 }}
					axisLine={false}
					tickLine={false}
				/>
				<YAxis
					tick={{ fill: '#6b7280', fontSize: 11 }}
					axisLine={false}
					tickLine={false}
					allowDecimals={false}
				/>
				<Tooltip
					contentStyle={{
						backgroundColor: '#111827',
						border: '1px solid #374151',
						borderRadius: '8px',
						color: '#f9fafb',
						fontSize: 12,
					}}
				/>
				<Legend
					wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
				/>
				<Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} dot={false} name="Critical" />
				<Line type="monotone" dataKey="high"     stroke="#f97316" strokeWidth={2} dot={false} name="High" />
				<Line type="monotone" dataKey="medium"   stroke="#eab308" strokeWidth={2} dot={false} name="Medium" />
				<Line type="monotone" dataKey="low"      stroke="#6b7280" strokeWidth={1} dot={false} name="Low" />
			</LineChart>
		</ResponsiveContainer>
	)
}
