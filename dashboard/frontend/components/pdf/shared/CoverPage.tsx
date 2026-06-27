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
  const formatDate = (d: string | Date) => {
    const date = new Date(d)
    return date.toUTCString().replace(/:\d{2} GMT/, ' UTC')
      .replace(/\w+, /, '')
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
            <Text style={styles.metadataValue}>{release.git_ref.replace('refs/heads/', '')}</Text>
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
            <View style={[styles.overallBadge, release.passed ? styles.overallBadgePass : styles.overallBadgeFail]}>
              <Text style={styles.overallBadgeText}>{release.passed ? 'PASS' : 'FAIL'}</Text>
            </View>
            <Text style={styles.checksPassed}>Checks passed: {passedChecks} / {totalChecks}</Text>
          </>
        ) : (
          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>Total Releases:</Text>
              <Text style={styles.summaryStatValue}>{totalReleases}</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>Pass Rate:</Text>
              <Text style={[styles.summaryStatValue, (passRate ?? 0) >= 90 ? styles.summaryStatValueHigh : styles.summaryStatValueLow]}>
                {passRate?.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>Last Deploy:</Text>
              <Text style={styles.summaryStatValue}>
                {lastDeployAt ? formatDate(lastDeployAt) : 'N/A'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Page>
  )
}
