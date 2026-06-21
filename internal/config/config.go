package config

type Identity struct {
	SubjectRegExp string
	Issuer        string
}

type Config struct {
	ImageRef       string
	OutputFormat   string // "text" or "json"
	SkipTLog       bool
	CertIdentity   string
	CertOIDCIssuer string
	Identities     []Identity
	FailOn         string // "any" or "critical"
}

func Default() Config {
	return Config{
		OutputFormat:   "text",
		SkipTLog:       false,
		CertIdentity:   "",
		CertOIDCIssuer: "https://token.actions.githubusercontent.com",
		Identities: []Identity{
			{
				SubjectRegExp: "https://github.com/TripleAze/chainguard/.github/workflows/ci.yml@refs/heads/main",
				Issuer:        "https://token.actions.githubusercontent.com",
			},
			{
				SubjectRegExp: "https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@refs/tags/v2.0.0",
				Issuer:        "https://token.actions.githubusercontent.com",
			},
		},
		FailOn: "any",
	}
}
