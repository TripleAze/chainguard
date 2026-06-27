'use client'

import { View, Text } from '@react-pdf/renderer'
import { styles } from './styles'

interface FooterProps {
  pageNumber: number
  date: string
}

export function Footer({ pageNumber, date }: FooterProps) {
  const formatDate = (d: string | Date) => {
    const date = new Date(d)
    return date.toUTCString().replace(/:\d{2} GMT/, ' UTC')
      .replace(/\w+, /, '')
  }

  return (
    <View style={styles.footer}>
      <Text style={styles.footerLeft}>
        ChainGuard · Supply Chain Security · github.com/TripleAze/chainguard
      </Text>
      <Text style={styles.footerRight}>
        Page {pageNumber} · Generated {formatDate(date)}
      </Text>
    </View>
  )
}
