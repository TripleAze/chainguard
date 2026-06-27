'use client'

import { Document, Page, View, Text } from '@react-pdf/renderer'
import { CoverPage } from './shared/CoverPage'
import { Footer } from './shared/Footer'
import { styles, colors } from './shared/styles'
import type { Release } from '@/types/release'

interface ChainGuardReportProps {
  release: Release
}

export function ChainGuardReport({ release }: ChainGuardReportProps) {
  const formatDate = (d: string | Date) => {
    const date = new Date(d)
    return date.toUTCString().replace(/:\d{2} GMT/, ' UTC')
      .replace(/\w+, /, '')
  }

  const generatedDate = formatDate(new Date())

  const passedChecks = [
    release.sig_passed,
    release.sbom_passed,
    release.vuln_passed,
    release.prov_passed,
  ].filter(Boolean).length

  const executiveSummaryRows = [
    {
      check: 'Signature',
      passed: release.sig_passed,
      detail: release.sig_detail,
    },
    {
      check: 'SBOM',
      passed: release.sbom_passed,
      detail: `${release.sbom_packages} packages · ${release.sbom_version}`,
    },
    {
      check: 'Vuln Scan',
      passed: release.vuln_passed,
      detail: `${release.vuln_critical} critical · ${release.vuln_high} high · ${release.vuln_medium} medium`,
    },
    {
      check: 'Provenance',
      passed: release.prov_passed,
      detail: `SLSA Level ${release.slsa_level} · ${release.prov_ref}`,
    },
  ]

  const truncateBuilder = (builder: string) => {
    const parts = builder.split('/')
    const lastTwo = parts.slice(-2).join('/')
    return lastTwo
  }

  return (
    <Document>
      <CoverPage subtitle="Single Release Report" release={release} />

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeader}>Executive Summary</Text>

        <View style={styles.executiveSummaryTable}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableHeaderCell}>CHECK</Text>
            <Text style={styles.tableHeaderCell}>RESULT</Text>
            <Text style={styles.tableHeaderCell}>DETAIL</Text>
          </View>

          {executiveSummaryRows.map((row, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}].filter(Boolean)}
            >
              <Text style={styles.tableCell}>{row.check}</Text>
              <View style={styles.tableCell}>
                <View style={[
                  styles.resultBadge,
                  row.passed ? styles.resultBadgePass : styles.resultBadgeFail
                ]}>
                  <Text style={row.passed ? styles.resultBadgeTextPass : styles.resultBadgeTextFail}>
                    {row.passed ? 'PASS' : 'FAIL'}
                  </Text>
                </View>
              </View>
              <Text style={styles.tableCell}>{row.detail}</Text>
            </View>
          ))}
        </View>

        <Footer pageNumber={2} date={generatedDate} />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.detailedSection}>
          <Text style={styles.detailedSectionTitle}>Signature Verification</Text>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Signing Identity</Text>
            <Text style={styles.valueColumn}>N/A</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>OIDC Issuer</Text>
            <Text style={styles.valueColumn}>N/A</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Status</Text>
            <Text style={[styles.valueColumn, release.sig_passed ? { color: colors.accentGreen } : { color: colors.accentRed }]}>
              {release.sig_passed ? 'PASS' : 'FAIL'}
            </Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Message</Text>
            <Text style={styles.valueColumn}>{release.sig_detail}</Text>
          </View>
        </View>

        <View style={styles.detailedSection}>
          <Text style={styles.detailedSectionTitle}>SBOM Analysis</Text>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Format</Text>
            <Text style={styles.valueColumn}>{release.sbom_format}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>SPDX Version</Text>
            <Text style={styles.valueColumn}>{release.sbom_version}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Package Count</Text>
            <Text style={styles.valueColumn}>{release.sbom_packages}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Status</Text>
            <Text style={[styles.valueColumn, release.sbom_passed ? { color: colors.accentGreen } : { color: colors.accentRed }]}>
              {release.sbom_passed ? 'PASS' : 'FAIL'}
            </Text>
          </View>
        </View>

        <View style={styles.detailedSection}>
          <Text style={styles.detailedSectionTitle}>Vulnerability Scan</Text>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Scanner</Text>
            <Text style={styles.valueColumn}>{release.vuln_scanner.split(' ')[0]}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Scanner Version</Text>
            <Text style={styles.valueColumn}>{release.vuln_scanner.split(' ')[1] || 'N/A'}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>DB Date</Text>
            <Text style={styles.valueColumn}>{release.vuln_db_date}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Critical</Text>
            <Text style={[styles.valueColumn, release.vuln_critical > 0 ? styles.valueCritical : {}].filter(Boolean)}>
              {release.vuln_critical}
            </Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>High</Text>
            <Text style={styles.valueColumn}>{release.vuln_high}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Medium</Text>
            <Text style={styles.valueColumn}>{release.vuln_medium}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Low</Text>
            <Text style={styles.valueColumn}>{release.vuln_low}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Status</Text>
            <Text style={[styles.valueColumn, release.vuln_passed ? { color: colors.accentGreen } : { color: colors.accentRed }]}>
              {release.vuln_passed ? 'PASS' : 'FAIL'}
            </Text>
          </View>
        </View>

        <View style={styles.detailedSection}>
          <Text style={styles.detailedSectionTitle}>Provenance Verification</Text>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Source Repository</Text>
            <Text style={styles.valueColumn}>{release.prov_ref}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Commit</Text>
            <Text style={styles.valueColumn}>{release.prov_commit.slice(0, 7)}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Branch</Text>
            <Text style={styles.valueColumn}>{release.git_ref.replace('refs/heads/', '')}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Builder</Text>
            <Text style={styles.valueColumn}>{truncateBuilder(release.prov_builder)}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>SLSA Level</Text>
            <Text style={styles.valueColumn}>{release.slsa_level}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyColumn}>Workflow Run</Text>
            <Text style={styles.valueColumn}>{release.workflow_run}</Text>
          </View>
        </View>

        <Footer pageNumber={3} date={generatedDate} />
      </Page>
    </Document>
  )
}
