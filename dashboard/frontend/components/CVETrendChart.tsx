'use client'

import {
	LineChart, Line, XAxis, YAxis, CartesianGrid,
	Tooltip, Legend, ResponsiveContainer, Area, ComposedChart
} from 'recharts'
import { CVETrendPoint } from '@/types/release'

interface Props {
	data: CVETrendPoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-gray-950 border border-gray-800 rounded-lg shadow-xl p-4">
				<p className="text-sm font-medium text-gray-200 mb-3">{label}</p>
				<div className="space-y-2">
					{payload.map((entry: any, index: number) => (
						<div key={index} className="flex items-center gap-3">
							<div
								className="w-2 h-2 rounded-full"
								style={{ backgroundColor: entry.color }}
							/>
							<span className="text-gray-400 text-sm">{entry.name}:</span>
							<span className="text-white font-semibold text-sm">{entry.value}</span>
						</div>
					))}
				</div>
			</div>
		)
	}
	return null
}

export default function CVETrendChart({ data }: Props) {
	if (!data?.length) {
		return (
			<div className="h-52 flex items-center justify-center text-gray-500 text-sm">
				No trend data yet — releases will populate this chart.
			</div>
		)
	}

	const formatted = data.map(p => ({
		...p,
		day: new Date(p.day).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
	}))

	return (
		<ResponsiveContainer width="100%" height={260}>
			<ComposedChart data={formatted} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
				<defs>
					<linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
						<stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
					</linearGradient>
					<linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
						<stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
					</linearGradient>
					<linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
						<stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
					</linearGradient>
					<linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="#6b7280" stopOpacity={0.2}/>
						<stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
					</linearGradient>
				</defs>
				<CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
				<XAxis
					dataKey="day"
					tick={{ fill: '#9ca3af', fontSize: 12 }}
					axisLine={false}
					tickLine={false}
					tickMargin={10}
				/>
				<YAxis
					tick={{ fill: '#9ca3af', fontSize: 12 }}
					axisLine={false}
					tickLine={false}
					allowDecimals={false}
					tickMargin={10}
				/>
				<Tooltip content={<CustomTooltip />} />
				<Legend
					verticalAlign="top"
					height={36}
					wrapperStyle={{ fontSize: 13, color: '#9ca3af', paddingBottom: 10 }}
					iconType="circle"
				/>
				<Area type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCritical)" name="Critical" />
				<Area type="monotone" dataKey="high" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorHigh)" name="High" />
				<Area type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorMedium)" name="Medium" />
				<Area type="monotone" dataKey="low" stroke="#6b7280" strokeWidth={2} fillOpacity={1} fill="url(#colorLow)" name="Low" />
			</ComposedChart>
		</ResponsiveContainer>
	)
}
