'use client'

import { StyleSheet } from '@react-pdf/renderer'

export const colors = {
  primaryBlue: '#2563EB',
  secondaryBlue: '#3B82F6',
  darkNavy: '#0F172A',
  white: '#FFFFFF',
  textLight: '#1E293B',
  textGray: '#94A3B8',
  textMuted: '#64748B',
  accentGreen: '#22C55E',
  accentRed: '#EF4444',
  backgroundLight: '#F8FAFC',
  borderLight: '#E2E8F0',
}

export const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    padding: 30,
  },
  coverPage: {
    flexDirection: 'column',
    backgroundColor: colors.darkNavy,
    padding: 40,
    height: '100%',
  },
  logoContainer: {
    height: '40%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 220,
  },
  divider: {
    height: 2,
    backgroundColor: colors.primaryBlue,
    marginVertical: 20,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  reportSubtitle: {
    fontSize: 16,
    color: colors.textGray,
    textAlign: 'center',
    marginBottom: 30,
  },
  metadataContainer: {
    marginBottom: 30,
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  metadataLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.textGray,
    width: 100,
  },
  metadataValue: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.white,
  },
  overallContainer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  overallLabel: {
    fontSize: 14,
    color: colors.textGray,
    marginBottom: 4,
  },
  overallPass: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accentGreen,
  },
  overallFail: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accentRed,
  },
  checksPassed: {
    fontSize: 12,
    color: colors.textGray,
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primaryBlue,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryBlue,
  },
  executiveSummaryTable: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.primaryBlue,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
    padding: 8,
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableRowAlt: {
    backgroundColor: colors.backgroundLight,
  },
  tableCell: {
    fontSize: 9,
    color: colors.textLight,
    padding: 8,
    flex: 1,
  },
  detailedSection: {
    marginBottom: 24,
  },
  detailedSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primaryBlue,
    marginBottom: 12,
  },
  keyValueRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  keyColumn: {
    fontSize: 9,
    color: colors.textMuted,
    width: 150,
  },
  valueColumn: {
    fontSize: 9,
    color: colors.textLight,
    flex: 1,
  },
  valueCritical: {
    color: colors.accentRed,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 8,
  },
  footerLeft: {
    fontSize: 8,
    color: colors.textMuted,
  },
  footerRight: {
    fontSize: 8,
    color: colors.textMuted,
  },
  summaryCoverStats: {
    alignItems: 'center',
    marginTop: 20,
  },
  summaryCoverStat: {
    fontSize: 12,
    color: colors.white,
    marginBottom: 6,
  },
})
