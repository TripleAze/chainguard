import { Release, Summary, CVETrendResponse, ReleasesResponse } from '@/types/release'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function apiFetch<T>(path: string): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		next: { revalidate: 60 },
	})
	if (!res.ok) {
		throw new Error(`API ${path} returned ${res.status}`)
	}
	return res.json()
}

export function getSummary(): Promise<Summary> {
	return apiFetch<Summary>('/api/stats')
}

export function getReleases(params: { page?: number; limit?: number }): Promise<ReleasesResponse> {
	const q = new URLSearchParams({
		page:  String(params.page  ?? 1),
		limit: String(params.limit ?? 20),
	})
	return apiFetch<ReleasesResponse>(`/api/releases?${q}`)
}

export function getRelease(digest: string): Promise<Release> {
	return apiFetch<Release>(`/api/releases/${digest}`)
}

export function getCVETrend(days: number): Promise<CVETrendResponse> {
	return apiFetch<CVETrendResponse>(`/api/stats/cve-trend?days=${days}`)
}
