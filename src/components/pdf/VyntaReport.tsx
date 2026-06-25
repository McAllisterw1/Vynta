"use client";

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export interface PDFReportData {
  businessName: string;
  rating: number | null;
  totalReviews: number | null;
  positive: number | null;
  trending: "improving" | "declining" | "stable" | null;
  praiseThemes: string[];
  complaintThemes: Array<{ theme: string; severity: string }>;
  topAction: string | null;
  competitors?: Array<{ name: string; rating: number; reviewCount: number }>;
  opportunities?: Array<{ title: string; estimatedValue: string; detail: string }>;
  isProspect?: boolean;
  generatedDate: string;
}

const TEAL   = "#2D9B8A";
const DARK   = "#2C1A0E";
const AMBER  = "#C4874A";
const MUTED  = "#A0856A";
const CREAM  = "#FAF6F0";
const RED    = "#DC2626";
const WHITE  = "#FFFFFF";
const BORDER = "#E5DDD0";

const s = StyleSheet.create({
  page: { backgroundColor: WHITE, fontFamily: "Helvetica", paddingBottom: 60 },

  // Header
  header: { backgroundColor: TEAL, paddingHorizontal: 36, paddingVertical: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "column" },
  headerBrand: { color: WHITE, fontSize: 22, fontFamily: "Helvetica-Bold", letterSpacing: 2 },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 9, letterSpacing: 1, marginTop: 2 },
  headerRight: { color: "rgba(255,255,255,0.5)", fontSize: 8, textAlign: "right" },

  // Name bar
  nameBar: { backgroundColor: DARK, paddingHorizontal: 36, paddingVertical: 14 },
  nameBarLabel: { color: "rgba(255,255,255,0.5)", fontSize: 7, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 },
  nameBarTitle: { color: WHITE, fontSize: 16, fontFamily: "Helvetica-Bold" },

  // Body
  body: { paddingHorizontal: 36, paddingTop: 24 },

  // Section header
  sectionLabel: { fontSize: 7, letterSpacing: 1.5, color: TEAL, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 8 },
  divider: { height: 1, backgroundColor: BORDER, marginBottom: 18 },

  // Stats row
  statsRow: { flexDirection: "row", marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: CREAM, borderRadius: 8, padding: 14, marginRight: 10, alignItems: "center" },
  statBoxLast: { flex: 1, backgroundColor: CREAM, borderRadius: 8, padding: 14, alignItems: "center" },
  statValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: TEAL, marginBottom: 3 },
  statLabel: { fontSize: 7.5, color: MUTED, letterSpacing: 0.5, textAlign: "center" },

  // Two-column sentiment
  sentimentRow: { flexDirection: "row", marginBottom: 24 },
  sentimentCol: { flex: 1 },
  sentimentColRight: { flex: 1, marginLeft: 16 },
  sentimentTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 8 },
  sentimentItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 5 },
  sentimentDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3, marginRight: 7, flexShrink: 0 },
  sentimentText: { fontSize: 9, color: DARK, flex: 1, lineHeight: 1.4 },
  sentimentBadge: { fontSize: 7, color: MUTED, marginLeft: 4 },

  // Competitor table
  tableHeader: { flexDirection: "row", backgroundColor: DARK, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 4 },
  tableHeaderText: { fontSize: 7.5, color: WHITE, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", borderWidth: 1, borderColor: BORDER, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 3 },
  tableCell: { fontSize: 9, color: DARK },
  tableCellMuted: { fontSize: 9, color: MUTED },
  colName: { flex: 3 },
  colRating: { flex: 1, textAlign: "center" },
  colReviews: { flex: 1.5, textAlign: "right" },

  // Opportunity cards
  oppCard: { backgroundColor: CREAM, borderRadius: 8, padding: 14, marginBottom: 10 },
  oppHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  oppTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: DARK, flex: 1, marginRight: 8 },
  oppValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: TEAL, flexShrink: 0 },
  oppDetail: { fontSize: 8.5, color: MUTED, lineHeight: 1.5 },

  // Top action
  actionCard: { backgroundColor: "#EBF7F5", borderLeftWidth: 3, borderLeftColor: TEAL, borderRadius: 4, padding: 14, marginBottom: 24 },
  actionLabel: { fontSize: 7.5, color: TEAL, fontFamily: "Helvetica-Bold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 },
  actionText: { fontSize: 9.5, color: DARK, lineHeight: 1.6 },

  // Prospect pitch section
  pitchCard: { backgroundColor: DARK, borderRadius: 8, padding: 18, marginBottom: 24 },
  pitchTitle: { color: WHITE, fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 10 },
  pitchItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 7 },
  pitchBullet: { color: TEAL, fontSize: 14, lineHeight: 1, marginRight: 8, marginTop: -2 },
  pitchText: { color: "rgba(255,255,255,0.85)", fontSize: 9, lineHeight: 1.5, flex: 1 },

  // Footer
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: TEAL, paddingHorizontal: 36, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerLeft: { color: WHITE, fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  footerRight: { color: "rgba(255,255,255,0.7)", fontSize: 7.5 },
});

function trendLabel(t: string | null) {
  if (t === "improving") return "↑ Improving";
  if (t === "declining")  return "↓ Declining";
  return "→ Stable";
}

export default function VyntaReport({ data }: { data: PDFReportData }) {
  const hasSentiment   = data.praiseThemes.length > 0 || data.complaintThemes.length > 0;
  const hasCompetitors = (data.competitors?.length ?? 0) > 0;
  const hasOpps        = (data.opportunities?.length ?? 0) > 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerBrand}>VYNTA</Text>
            <Text style={s.headerSub}>REPUTATION INTELLIGENCE REPORT</Text>
          </View>
          <Text style={s.headerRight}>{data.generatedDate}</Text>
        </View>

        {/* ── Business name bar ── */}
        <View style={s.nameBar}>
          <Text style={s.nameBarLabel}>Prepared for</Text>
          <Text style={s.nameBarTitle}>{data.businessName}</Text>
        </View>

        <View style={s.body}>

          {/* ── Stats row ── */}
          <Text style={[s.sectionLabel, { marginTop: 8 }]}>Reputation Overview</Text>
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{data.rating != null ? `${data.rating}★` : "—"}</Text>
              <Text style={s.statLabel}>Google Rating</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{data.totalReviews != null ? data.totalReviews.toLocaleString() : "—"}</Text>
              <Text style={s.statLabel}>Total Reviews</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{data.positive != null ? `${data.positive}%` : "—"}</Text>
              <Text style={s.statLabel}>Positive Sentiment</Text>
            </View>
            <View style={s.statBoxLast}>
              <Text style={[s.statValue, { fontSize: 14, marginTop: 4 }]}>{trendLabel(data.trending)}</Text>
              <Text style={s.statLabel}>Trend</Text>
            </View>
          </View>

          {/* ── Sentiment ── */}
          {hasSentiment && (
            <>
              <Text style={s.sectionLabel}>What Customers Are Saying</Text>
              <View style={s.divider} />
              <View style={s.sentimentRow}>
                <View style={s.sentimentCol}>
                  <Text style={s.sentimentTitle}>What they love</Text>
                  {data.praiseThemes.slice(0, 5).map((t, i) => (
                    <View key={i} style={s.sentimentItem}>
                      <View style={[s.sentimentDot, { backgroundColor: TEAL }]} />
                      <Text style={s.sentimentText}>{t}</Text>
                    </View>
                  ))}
                  {data.praiseThemes.length === 0 && (
                    <Text style={[s.sentimentText, { color: MUTED }]}>No data yet</Text>
                  )}
                </View>
                <View style={s.sentimentColRight}>
                  <Text style={s.sentimentTitle}>Biggest complaints</Text>
                  {data.complaintThemes.slice(0, 5).map((t, i) => (
                    <View key={i} style={s.sentimentItem}>
                      <View style={[s.sentimentDot, { backgroundColor: t.severity === "high" ? RED : t.severity === "medium" ? AMBER : MUTED }]} />
                      <Text style={s.sentimentText}>{t.theme}</Text>
                      {t.severity === "high" && <Text style={s.sentimentBadge}>(High)</Text>}
                    </View>
                  ))}
                  {data.complaintThemes.length === 0 && (
                    <Text style={[s.sentimentText, { color: MUTED }]}>No complaints found</Text>
                  )}
                </View>
              </View>
            </>
          )}

          {/* ── Top action ── */}
          {data.topAction && (
            <>
              <Text style={s.sectionLabel}>Biggest Opportunity</Text>
              <View style={s.divider} />
              <View style={s.actionCard}>
                <Text style={s.actionLabel}>#1 Thing to Fix</Text>
                <Text style={s.actionText}>{data.topAction}</Text>
              </View>
            </>
          )}

          {/* ── Competitors ── */}
          {hasCompetitors && (
            <>
              <Text style={s.sectionLabel}>Competitor Snapshot</Text>
              <View style={s.divider} />
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderText, s.colName]}>Business</Text>
                <Text style={[s.tableHeaderText, s.colRating]}>Rating</Text>
                <Text style={[s.tableHeaderText, s.colReviews]}>Reviews</Text>
              </View>
              {data.competitors!.slice(0, 5).map((c, i) => (
                <View key={i} style={s.tableRow}>
                  <Text style={[s.tableCell, s.colName]}>{c.name}</Text>
                  <Text style={[s.tableCell, s.colRating, { color: c.rating > (data.rating ?? 0) ? RED : TEAL }]}>{c.rating}★</Text>
                  <Text style={[s.tableCellMuted, s.colReviews]}>{c.reviewCount.toLocaleString()}</Text>
                </View>
              ))}
              <View style={{ marginBottom: 20 }} />
            </>
          )}

          {/* ── Opportunities ── */}
          {hasOpps && (
            <>
              <Text style={s.sectionLabel}>Revenue Opportunities</Text>
              <View style={s.divider} />
              {data.opportunities!.slice(0, 3).map((o, i) => (
                <View key={i} style={s.oppCard}>
                  <View style={s.oppHeader}>
                    <Text style={s.oppTitle}>{o.title}</Text>
                    <Text style={s.oppValue}>{o.estimatedValue}</Text>
                  </View>
                  <Text style={s.oppDetail}>{o.detail}</Text>
                </View>
              ))}
              <View style={{ marginBottom: 8 }} />
            </>
          )}

          {/* ── Prospect pitch ── */}
          {data.isProspect && (
            <>
              <Text style={s.sectionLabel}>How Vynta Can Help You</Text>
              <View style={s.divider} />
              <View style={s.pitchCard}>
                <Text style={s.pitchTitle}>Turn your reputation into a revenue engine.</Text>
                {[
                  "Early warning system — catch complaint spikes before they hurt your leads",
                  "Competitor intelligence — see exactly where rivals are beating you and close the gap",
                  "Opportunity engine — specific revenue estimates and quick wins ranked by impact",
                  "Sentiment analysis — understand what customers say and what it costs you",
                  "AI review responses — reply to any review in seconds, in your voice",
                ].map((item, i) => (
                  <View key={i} style={s.pitchItem}>
                    <Text style={s.pitchBullet}>·</Text>
                    <Text style={s.pitchText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>vynta.io · Reputation Intelligence</Text>
          <Text style={s.footerRight}>
            {data.isProspect
              ? `Prepared exclusively for ${data.businessName}`
              : `${data.businessName} · ${data.generatedDate}`}
          </Text>
        </View>

      </Page>
    </Document>
  );
}
