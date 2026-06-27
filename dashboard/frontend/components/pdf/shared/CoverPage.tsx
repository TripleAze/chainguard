'use client'

import { Page, View, Text, Image } from '@react-pdf/renderer'
import { styles, colors } from './styles'
import type { Release } from '@/types/release'

interface CoverPageProps {
  subtitle: 'Single Release Report' | 'Portfolio Summary Report'
  release?: Release
  totalReleases?: number
  passRate?: number
  lastDeployAt?: string | null
}

export function CoverPage({ subtitle, release, totalReleases, passRate, lastDeployAt }: CoverPageProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = String(date.getUTCDate()).padStart(2, '0')
    const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
    const year = date.getUTCFullYear()
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    return `${day} ${month} ${year} ${hours}:${minutes} UTC`
  }

  const passedChecks = [release?.sig_passed, release?.sbom_passed, release?.vuln_passed, release?.prov_passed].filter(Boolean).length
  const totalChecks = 4

  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.logoContainer}>
        <Image src="/chainguard-logo.png" style={styles.logo} />
      </View>

      <View style={styles.divider} />

      <Text style={styles.reportTitle}>Supply Chain Compliance Report</Text>
      <Text style={styles.reportSubtitle}>{subtitle}</Text>

      {release && (
        <View style={styles.metadataContainer}>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Image:</Text>
            <Text style={styles.metadataValue}>{release.image_ref}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Digest:</Text>
            <Text style={styles.metadataValue}>{release.digest.slice(0, 16)}...</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Branch:</Text>
            <Text style={styles.metadataValue}>{release.git_ref}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Commit:</Text>
            <Text style={styles.metadataValue}>{release.git_commit.slice(0, 7)}</Text>
          </View>
        </View>
      )}

      <View style={styles.overallContainer}>
        {release ? (
          <>
            <Text style={styles.overallLabel}>Overall Result:</Text>
            <Text style={release.passed ? styles.overallPass : styles.overallFail}>
              {release.passed ? '✅ PASS' : '❌ FAIL'}
            </Text>
            <Text style={styles.checksPassed}>Checks passed: {passedChecks} / {totalChecks}</Text>
          </>
        ) : (
          <View style={styles.summaryCoverStats}>
            <Text style={styles.summaryCoverStat}>Total Releases: {totalReleases}</Text>
            <Text style={styles.summaryCoverStat}>Pass Rate: {passRate?.toFixed(1)}%</Text>
            <Text style={styles.summaryCoverStat}>
              Last Deploy: {lastDeployAt ? formatDate(lastDeployAt) : 'N/A'}
            </Text>
          </View>
        )}
      </View>
    </Page>
  )
}
