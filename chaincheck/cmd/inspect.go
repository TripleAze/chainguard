package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"github.com/TripleAze/chainguard/chaincheck/internal/config"
	"github.com/TripleAze/chainguard/chaincheck/internal/registry"
	"github.com/TripleAze/chainguard/chaincheck/internal/report"
	"github.com/TripleAze/chainguard/chaincheck/internal/verify"
	"github.com/fatih/color"
	"github.com/spf13/cobra"
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

		// If cert-identity was explicitly set, replace the identities list with it
		if cfg.CertIdentity != "" {
			cfg.Identities = []config.Identity{
				{
					SubjectRegExp: cfg.CertIdentity,
					Issuer:        cfg.CertOIDCIssuer,
				},
			}
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
	Short: "Remove chaincheck from your system",
	Long:  `Removes the chaincheck binary from the directory it was installed to.`,
	RunE:  runUninstall,
}

func runUninstall(cmd *cobra.Command, args []string) error {
	// Find where chaincheck is installed
	execPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("could not determine install location: %w", err)
	}

	// Resolve symlinks
	realPath, err := filepath.EvalSymlinks(execPath)
	if err != nil {
		realPath = execPath
	}

	bold := color.New(color.Bold)
	cyan := color.New(color.FgCyan)
	green := color.New(color.FgGreen)
	yellow := color.New(color.FgYellow)
	red := color.New(color.FgRed)

	fmt.Println()
	bold.Println("  ChainGuard · chaincheck uninstaller")
	fmt.Println()
	cyan.Printf("  →  Installed at: %s\n", realPath)
	fmt.Println()

	// Confirm
	fmt.Print("  Remove chaincheck? [y/N] ")
	var response string
	fmt.Scanln(&response)

	if response != "y" && response != "Y" {
		yellow.Println("\n  →  Uninstall cancelled.")
		fmt.Println()
		return nil
	}

	fmt.Println()

	// Try to remove directly first
	err = os.Remove(realPath)
	if err != nil {
		if os.IsPermission(err) {
			// Need elevated privileges
			yellow.Println("  !  Requires elevated privileges — requesting sudo...")
			fmt.Println()

			if runtime.GOOS == "windows" {
				return fmt.Errorf("permission denied — please delete %s manually", realPath)
			}

			sudoCmd := exec.Command("sudo", "rm", "-f", realPath)
			sudoCmd.Stdout = os.Stdout
			sudoCmd.Stderr = os.Stderr
			sudoCmd.Stdin = os.Stdin

			if err := sudoCmd.Run(); err != nil {
				red.Printf("  ✘  Failed to remove %s\n", realPath)
				fmt.Println()
				return fmt.Errorf("uninstall failed: %w", err)
			}
		} else {
			return fmt.Errorf("failed to remove %s: %w", realPath, err)
		}
	}

	green.Printf("  ✔  chaincheck removed from %s\n", realPath)
	fmt.Println()
	fmt.Println("  To reinstall:")
	cyan.Printf("  curl -sSfL https://raw.githubusercontent.com/TripleAze/chainguard/main/chaincheck/install.sh | sh\n")
	fmt.Println()

	return nil
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
