'use client'

import { Document, Page, View, Text } from '@react-pdf/renderer'
import { CoverPage } from './shared/CoverPage'
import { Footer } from './shared/Footer'
import { styles, colors } from './shared/styles'
import type { Release, Summary } from '@/types/release'

interface SummaryReportProps {
  stats: Summary
  releases: Release[]
}

export function SummaryReport({ stats, releases }: SummaryReportProps) {
  const formatDate = (d: string | Date) => {
    const date = new Date(d)
    return date.toUTCString().replace(/:\d{2} GMT/, ' UTC')
      .replace(/\w+, /, '')
  }

  const generatedDate = formatDate(new Date())

  const calculateChecksPassed = (release: Release) => {
    return [
      release.sig_passed,
      release.sbom_passed,
      release.vuln_passed,
      release.prov_passed,
    ].filter(Boolean).length
  }

  const truncateImage = (imageRef: string) => {
    const parts = imageRef.split('/')
    return parts[parts.length - 1]
  }

  const recentReleases = releases.slice(0, 20)

  return (
    <Document>
      <CoverPage
        subtitle="Portfolio Summary Report"
        totalReleases={stats.total_releases}
        passRate={stats.pass_rate}
        lastDeployAt={stats.last_deploy_at}
      />

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeader}>Recent Releases</Text>

        <View style={styles.executiveSummaryTable}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableHeaderCell}>COMMIT</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellImage]}>IMAGE</Text>
            <Text style={styles.tableHeaderCell}>DATE</Text>
            <Text style={styles.tableHeaderCell}>RESULT</Text>
            <Text style={styles.tableHeaderCell}>CHECKS</Text>
          </View>

          {recentReleases.map((release, idx) => {
            const checksPassed = calculateChecksPassed(release)
            return (
              <View
                key={release.id}
                style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}].filter(Boolean)}
              >
                <Text style={styles.tableCell}>{release.git_commit.slice(0, 7)}</Text>
                <Text style={[styles.tableCell, styles.tableCellImage]}>{truncateImage(release.image_ref)}</Text>
                <Text style={styles.tableCell}>{formatDate(release.built_at)}</Text>
                <View style={styles.tableCell}>
                  <View style={[
                    styles.resultBadge,
                    release.passed ? styles.resultBadgePass : styles.resultBadgeFail
                  ]}>
                    <Text style={release.passed ? styles.resultBadgeTextPass : styles.resultBadgeTextFail}>
                      {release.passed ? 'PASS' : 'FAIL'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.tableCell}>{checksPassed}/4</Text>
              </View>
            )
          })}
        </View>

        <Footer pageNumber={2} date={generatedDate} />
      </Page>
    </Document>
  )
}
