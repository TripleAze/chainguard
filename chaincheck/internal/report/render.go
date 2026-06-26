package report

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/fatih/color"
)

func RenderText(result InspectResult) {
	color.NoColor = false

	fmt.Println("\n� ChainGuard Inspection Report")
	fmt.Println("══════════════════════════════════════════════════════")
	fmt.Printf("Image:   %s\n", result.Image)
	fmt.Printf("Digest:  %s\n", result.Digest)
	fmt.Println()

	renderCheck("Signature", result.Signature)
	renderCheck("SBOM", result.SBOM.CheckResult)
	if result.SBOM.Passed {
		detail := fmt.Sprintf("Present — SPDX %s", result.SBOM.SPDXVersion)
		if result.SBOM.PackageCount > 0 {
			detail += fmt.Sprintf("\n                  %d packages catalogued", result.SBOM.PackageCount)
		}
		renderDetail(detail)
	}
	fmt.Println()

	renderCheck("Vuln Scan", result.VulnScan.CheckResult)
	if result.VulnScan.Passed {
		detail := fmt.Sprintf("Scanner: %s v%s (DB: %s)",
			result.VulnScan.Scanner,
			result.VulnScan.ScannerVersion,
			strings.Split(result.VulnScan.DBBuiltAt, "T")[0])
		summary := fmt.Sprintf("%d critical  %d high  %d medium  %d low",
			result.VulnScan.Summary.Critical,
			result.VulnScan.Summary.High,
			result.VulnScan.Summary.Medium,
			result.VulnScan.Summary.Low)
		renderDetail(detail + "\n                  " + summary)
	}
	fmt.Println()

	renderCheck("Provenance", result.Provenance.CheckResult)
	if result.Provenance.Passed {
		var details []string
		details = append(details, fmt.Sprintf("Repo:    %s", strings.TrimPrefix(result.Provenance.SourceRepo, "https://")))
		details = append(details, fmt.Sprintf("Commit:  %s", result.Provenance.SourceCommit))
		details = append(details, fmt.Sprintf("Branch:  %s", result.Provenance.SourceRef))
		details = append(details, fmt.Sprintf("Builder: %s", strings.TrimPrefix(result.Provenance.BuilderID, "https://")))
		renderDetail(strings.Join(details, "\n                  "))
	}
	fmt.Println()

	fmt.Println("══════════════════════════════════════════════════════")
	if result.Passed {
		fmt.Println("Overall:", color.GreenString("✓ SUCCESS"))
	} else {
		fmt.Println("Overall:", color.RedString("✗ FAILURE"))
	}
	fmt.Println()
}

func renderCheck(name string, result CheckResult) {
	if result.Passed {
		fmt.Printf("✓ %-15s%s\n", name, color.GreenString("Passed"))
		if result.Detail != "" {
			renderDetail(result.Detail)
		}
	} else {
		fmt.Printf("✗ %-15s%s\n", name, color.RedString("Failed"))
		renderDetail(color.RedString(result.Message))
	}
}

func renderDetail(detail string) {
	lines := strings.Split(detail, "\n")
	for _, line := range lines {
		fmt.Printf("                  %s\n", line)
	}
}

func RenderJSON(result InspectResult) {
	data, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshalling JSON: %v\n", err)
		return
	}
	fmt.Println(string(data))
}
