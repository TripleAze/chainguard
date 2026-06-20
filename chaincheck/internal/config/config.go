package config

type Config struct {
	ImageRef       string
	OutputFormat   string // "text" or "json"
	SkipTLog       bool
	CertIdentity   string
	CertOIDCIssuer string
	FailOn         string // "any" or "critical"
}

func Default() Config {
	return Config{
		OutputFormat:   "text",
		SkipTLog:       false,
		CertIdentity:   "https://github.com/TripleAze/chainguard/.github/workflows/ci.yml@refs/heads/main",
		CertOIDCIssuer: "https://token.actions.githubusercontent.com",
		FailOn:         "any",
	}
}
