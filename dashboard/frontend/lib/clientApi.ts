import { Release, Summary, CVETrendResponse, ReleasesResponse } from '@/types/release'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function clientApiFetch<T>(path: string): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		credentials: 'include',
	})
	if (!res.ok) {
		throw new Error(`API ${path} returned ${res.status}`)
	}
	return res.json()
}

export function clientGetSummary(): Promise<Summary> {
	return clientApiFetch<Summary>('/api/stats')
}

export function clientGetReleases(params: { page?: number; limit?: number }): Promise<ReleasesResponse> {
	const q = new URLSearchParams({
		page:  String(params.page  ?? 1),
		limit: String(params.limit ?? 20),
	})
	return clientApiFetch<ReleasesResponse>(`/api/releases?${q}`)
}

export function clientGetRelease(digest: string): Promise<Release> {
	return clientApiFetch<Release>(`/api/releases/${digest}`)
}

export function clientGetCVETrend(days: number): Promise<CVETrendResponse> {
	return clientApiFetch<CVETrendResponse>(`/api/stats/cve-trend?days=${days}`)
}
