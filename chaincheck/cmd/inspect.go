package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/tripleaze/chaincheck/internal/config"
	"github.com/tripleaze/chaincheck/internal/registry"
	"github.com/tripleaze/chaincheck/internal/report"
	"github.com/tripleaze/chaincheck/internal/verify"
)

var Version string

var rootCmd = &cobra.Command{
	Use:   "chaincheck",
	Short: "Inspect container image supply chain security",
	Run: func(cmd *cobra.Command, args []string) {
		if v, _ := cmd.Flags().GetBool("version"); v {
			fmt.Printf("chaincheck %s\n", Version)
			return
		}
		cmd.Help()
	},
}

var inspectCmd = &cobra.Command{
	Use:   "inspect <image>",
	Short: "Inspect a container image's supply chain artifacts",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		cfg := config.Default()
		cfg.ImageRef = args[0]

		var err error
		cfg.OutputFormat, err = cmd.Flags().GetString("output")
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		cfg.SkipTLog, err = cmd.Flags().GetBool("skip-tlog")
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		cfg.CertIdentity, err = cmd.Flags().GetString("cert-identity")
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		cfg.CertOIDCIssuer, err = cmd.Flags().GetString("cert-oidc-issuer")
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		cfg.FailOn, err = cmd.Flags().GetString("fail-on")
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}

		resolvedRef, err := registry.ResolveToDigest(cfg.ImageRef)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error resolving image: %v\n", err)
			os.Exit(1)
		}

		repo, digest, err := registry.ParseImageRef(resolvedRef)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error parsing image ref: %v\n", err)
			os.Exit(1)
		}

		result := report.InspectResult{
			Image:  repo,
			Digest: digest,
		}

		result.Signature, _ = verify.VerifySignature(resolvedRef, cfg)
		result.SBOM, _ = verify.VerifySBOM(resolvedRef, cfg)
		result.VulnScan, _ = verify.VerifyVuln(resolvedRef, cfg)
		result.Provenance, _ = verify.VerifyProvenance(resolvedRef, cfg)

		passed := true
		if cfg.FailOn == "any" {
			passed = result.Signature.Passed && result.SBOM.Passed && result.VulnScan.Passed && result.Provenance.Passed
		} else if cfg.FailOn == "critical" {
			passed = result.Signature.Passed && result.SBOM.Passed && result.Provenance.Passed && (result.VulnScan.Summary.Critical == 0)
		}

		if passed {
			result.Overall = "PASS"
			result.Passed = true
		} else {
			result.Overall = "FAIL"
			result.Passed = false
		}

		if cfg.OutputFormat == "json" {
			report.RenderJSON(result)
		} else {
			report.RenderText(result)
		}

		if !result.Passed {
			os.Exit(1)
		}
	},
}

var uninstallCmd = &cobra.Command{
	Use:   "uninstall",
	Short: "Uninstall chaincheck from your system",
	Run: func(cmd *cobra.Command, args []string) {
		// Find the executable path
		exePath, err := os.Executable()
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error finding chaincheck executable: %v\n", err)
			os.Exit(1)
		}

		fmt.Printf("Uninstalling chaincheck from %s...\n", exePath)

		// Try to remove it
		err = os.Remove(exePath)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error uninstalling chaincheck: %v\n", err)
			fmt.Fprintln(os.Stderr, "You might need to run this command with sudo.")
			os.Exit(1)
		}

		fmt.Println("✅ Successfully uninstalled chaincheck!")
	},
}

func init() {
	rootCmd.Flags().BoolP("version", "v", false, "Print version information")
	inspectCmd.Flags().StringP("output", "o", "text", "Output format: 'text' or 'json'")
	inspectCmd.Flags().Bool("skip-tlog", false, "Skip Rekor transparency log verification")
	inspectCmd.Flags().String("cert-identity", "", "Expected certificate identity regexp")
	inspectCmd.Flags().String("cert-oidc-issuer", "https://token.actions.githubusercontent.com", "Expected OIDC issuer")
	inspectCmd.Flags().String("fail-on", "any", "Minimum check level to fail on: 'any' or 'critical'")

	rootCmd.AddCommand(inspectCmd)
	rootCmd.AddCommand(uninstallCmd)
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
