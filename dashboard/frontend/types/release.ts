export interface Release {
	id:           string
	image_ref:    string
	digest:       string
	git_commit:   string
	git_ref:      string
	workflow_run: string
	built_at:     string
	ingested_at:  string

	passed:  boolean
	overall: string

	sig_passed: boolean
	sig_detail: string

	sbom_passed:   boolean
	sbom_packages: number
	sbom_format:   string
	sbom_version:  string

	vuln_passed:   boolean
	vuln_critical: number
	vuln_high:     number
	vuln_medium:   number
	vuln_low:      number
	vuln_scanner:  string
	vuln_db_date:  string

	prov_passed:  boolean
	prov_commit:  string
	prov_ref:     string
	prov_builder: string
	slsa_level:   number

	raw_report: object
}

export interface Summary {
	total_releases:  number
	passed_releases: number
	failed_releases: number
	pass_rate:       number
	last_deploy_at:  string | null
	total_critical:  number
	total_high:      number
}

export interface CVETrendPoint {
	day:      string
	releases: number
	critical: number
	high:     number
	medium:   number
	low:      number
}

export interface CVETrendResponse {
	days:   number
	points: CVETrendPoint[]
}

export interface ReleasesResponse {
	releases: Release[]
	total:    number
	page:     number
	limit:    number
	pages:    number
}
