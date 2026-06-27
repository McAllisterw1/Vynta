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
  // Intel page data
  businessSummary?: string;
  priorityActions?: string[];
  earlyWarnings?: Array<{ title: string; detail: string; action: string; severity: string; type: string }>;
  threatAnalysis?: { biggestThreat: string; beatingUser: string; userBeating: string; actions: string[] };
  marketIntel?: { emergingThemes: string[]; opportunityGap: string; whatTopBusinessesDo: string };
  revenueOpportunities?: Array<{ title: string; estimatedValue: string; detail: string; action: string; timeToImpact: string }>;
  competitorGaps?: Array<{ title: string; competitor: string; opportunity: string }>;
  quickWins?: Array<{ action: string; why: string }>;
  operationalRecs?: string[];
  risks?: Array<{ description: string; severity: string }>;
}

const TEAL   = "#2D9B8A";
const DARK   = "#2C1A0E";
const AMBER  = "#C4874A";
const MUTED  = "#A0856A";
const CREAM  = "#FAF6F0";
const RED    = "#DC2626";
const WHITE  = "#FFFFFF";
const BORDER = "#E5DDD0";
const CARD   = "#E8DCC8";

const s = StyleSheet.create({
  page: { backgroundColor: WHITE, fontFamily: "Helvetica", paddingBottom: 56 },

  // ── Header ──
  header: { backgroundColor: TEAL, paddingHorizontal: 36, paddingVertical: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerBrand: { color: WHITE, fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: 2 },
  headerSub: { color: "rgba(255,255,255,0.72)", fontSize: 8, letterSpacing: 1, marginTop: 2 },
  headerDate: { color: "rgba(255,255,255,0.55)", fontSize: 8, textAlign: "right" },

  // ── Name bar ──
  nameBar: { backgroundColor: DARK, paddingHorizontal: 36, paddingVertical: 13 },
  nameBarLabel: { color: "rgba(255,255,255,0.45)", fontSize: 7, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 },
  nameBarTitle: { color: WHITE, fontSize: 15, fontFamily: "Helvetica-Bold" },

  // ── Body ──
  body: { paddingHorizontal: 36, paddingTop: 20 },

  // ── Section heading ──
  secLabel: { fontSize: 7, letterSpacing: 1.5, color: TEAL, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 7 },
  secDivider: { height: 1, backgroundColor: BORDER, marginBottom: 14 },

  // ── Stats row ──
  statsRow: { flexDirection: "row", marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: CREAM, borderRadius: 6, padding: 12, marginRight: 8, alignItems: "center" },
  statBoxLast: { flex: 1, backgroundColor: CREAM, borderRadius: 6, padding: 12, alignItems: "center" },
  statVal: { fontSize: 20, fontFamily: "Helvetica-Bold", color: TEAL, marginBottom: 2 },
  statLbl: { fontSize: 7, color: MUTED, letterSpacing: 0.5, textAlign: "center" },

  // ── Summary paragraph ──
  summaryCard: { backgroundColor: CREAM, borderRadius: 8, padding: 14, marginBottom: 18 },
  summaryText: { fontSize: 9.5, color: DARK, lineHeight: 1.65 },

  // ── Priority actions ──
  actionRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  actionNum: { width: 18, height: 18, borderRadius: 9, backgroundColor: TEAL, color: WHITE, fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "center", paddingTop: 3, marginRight: 10, flexShrink: 0 },
  actionNumAmber: { backgroundColor: AMBER },
  actionNumMuted: { backgroundColor: CARD },
  actionNumMutedText: { color: DARK },
  actionText: { fontSize: 9.5, color: DARK, flex: 1, lineHeight: 1.5, paddingTop: 1 },

  // ── Warning cards ──
  warnCard: { borderRadius: 8, padding: 11, marginBottom: 7 },
  warnTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 4 },
  warnDetail: { fontSize: 8.5, color: "#5C3D1E", lineHeight: 1.5, marginBottom: 5 },
  warnAction: { fontSize: 8.5, color: AMBER, fontFamily: "Helvetica-Bold", lineHeight: 1.4 },
  sevBadge: { fontSize: 7, fontFamily: "Helvetica-Bold", padding: 3, paddingHorizontal: 7, borderRadius: 10 },

  // ── Two-column sentiments ──
  twoCol: { flexDirection: "row", marginBottom: 18 },
  col: { flex: 1 },
  colRight: { flex: 1, marginLeft: 14 },
  colTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 8 },
  dotRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2, marginRight: 7, flexShrink: 0 },
  dotText: { fontSize: 8.5, color: DARK, flex: 1, lineHeight: 1.4 },
  sevText: { fontSize: 7, color: MUTED, marginLeft: 4 },

  // ── Risks ──
  riskRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  riskDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2, marginRight: 7, flexShrink: 0 },
  riskText: { fontSize: 8.5, color: DARK, flex: 1, lineHeight: 1.4 },

  // ── Ops recs ──
  opRecRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 5 },
  opRecBullet: { fontSize: 8, color: TEAL, marginRight: 7, fontFamily: "Helvetica-Bold" },
  opRecText: { fontSize: 8.5, color: DARK, flex: 1, lineHeight: 1.4 },

  // ── Threat analysis cards ──
  threatCard: { borderRadius: 8, padding: 11, marginBottom: 7 },
  threatCardLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  threatCardText: { fontSize: 9, color: DARK, lineHeight: 1.5 },

  // ── Competitor table ──
  tableHead: { flexDirection: "row", backgroundColor: DARK, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 3 },
  tableHeadTxt: { fontSize: 7.5, color: WHITE, fontFamily: "Helvetica-Bold", letterSpacing: 0.4 },
  tableRow: { flexDirection: "row", borderWidth: 1, borderColor: BORDER, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 3 },
  tableCell: { fontSize: 8.5, color: DARK },
  tableMuted: { fontSize: 8.5, color: MUTED },
  colName: { flex: 3 },
  colRating: { flex: 1, textAlign: "center" },
  colReviews: { flex: 1.5, textAlign: "right" },

  // ── Market intel ──
  tagRow: { flexDirection: "row", flexWrap: "wrap" },
  tag: { backgroundColor: "rgba(45,155,138,0.1)", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3, marginRight: 5, marginBottom: 5 },
  tagText: { fontSize: 8, color: TEAL, fontFamily: "Helvetica-Bold" },
  marketCard: { borderRadius: 8, padding: 11, marginBottom: 8 },
  marketCardLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  marketCardText: { fontSize: 9, color: DARK, lineHeight: 1.55 },

  // ── Revenue / Opportunity cards ──
  oppCard: { backgroundColor: CREAM, borderRadius: 8, padding: 12, marginBottom: 9 },
  oppTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 },
  oppTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: DARK, flex: 1, marginRight: 8 },
  oppValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEAL, flexShrink: 0 },
  oppDetail: { fontSize: 8.5, color: MUTED, lineHeight: 1.5, marginBottom: 5 },
  oppAction: { fontSize: 8.5, color: AMBER, fontFamily: "Helvetica-Bold" },
  oppTime: { fontSize: 7.5, color: MUTED, marginLeft: 8 },

  // ── Competitor gaps ──
  gapCard: { borderLeftWidth: 3, borderLeftColor: AMBER, backgroundColor: CREAM, borderRadius: 8, padding: 11, marginBottom: 8 },
  gapCompetitor: { fontSize: 7.5, color: TEAL, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  gapTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 5 },
  gapOpp: { fontSize: 8.5, color: TEAL, lineHeight: 1.5 },

  // ── Quick wins ──
  winRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  winAction: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 3 },
  winWhy: { fontSize: 8.5, color: MUTED, lineHeight: 1.4 },

  // ── Action card (topAction) ──
  actionCard: { backgroundColor: "rgba(45,155,138,0.07)", borderLeftWidth: 3, borderLeftColor: TEAL, borderRadius: 5, padding: 13, marginBottom: 18 },
  actionCardLabel: { fontSize: 7.5, color: TEAL, fontFamily: "Helvetica-Bold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 5 },
  actionCardText: { fontSize: 9.5, color: DARK, lineHeight: 1.6 },

  // ── Prospect pitch ──
  pitchCard: { backgroundColor: DARK, borderRadius: 8, padding: 16, marginBottom: 18 },
  pitchTitle: { color: WHITE, fontSize: 10.5, fontFamily: "Helvetica-Bold", marginBottom: 9 },
  pitchRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  pitchBullet: { color: TEAL, fontSize: 12, lineHeight: 1, marginRight: 8, marginTop: -1 },
  pitchText: { color: "rgba(255,255,255,0.82)", fontSize: 8.5, lineHeight: 1.5, flex: 1 },

  // ── Spacer ──
  spacer: { marginBottom: 18 },
  spacerSm: { marginBottom: 10 },

  // ── Footer ──
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: TEAL, paddingHorizontal: 36, paddingVertical: 11, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerL: { color: WHITE, fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 0.4 },
  footerR: { color: "rgba(255,255,255,0.65)", fontSize: 7.5 },
});

function trendLabel(t: string | null) {
  if (t === "improving") return "↑ Improving";
  if (t === "declining")  return "↓ Declining";
  return "→ Stable";
}

function sevColor(sev: string) {
  if (sev === "high")   return RED;
  if (sev === "medium") return AMBER;
  return "#7B5E45";
}

function SectionHead({ children }: { children: string }) {
  return (
    <>
      <Text style={s.secLabel}>{children}</Text>
      <View style={s.secDivider} />
    </>
  );
}

export default function VyntaReport({ data }: { data: PDFReportData }) {
  const hasSentiment     = data.praiseThemes.length > 0 || data.complaintThemes.length > 0;
  const hasCompetitors   = (data.competitors?.length ?? 0) > 0;
  const hasOpps          = (data.opportunities?.length ?? 0) > 0;
  const hasPriorities    = (data.priorityActions?.length ?? 0) > 0;
  const hasWarnings      = (data.earlyWarnings?.length ?? 0) > 0;
  const hasThreat        = !!data.threatAnalysis;
  const hasMarket        = !!data.marketIntel;
  const hasRevOpps       = (data.revenueOpportunities?.length ?? 0) > 0;
  const hasGaps          = (data.competitorGaps?.length ?? 0) > 0;
  const hasWins          = (data.quickWins?.length ?? 0) > 0;
  const hasRisks         = (data.risks?.length ?? 0) > 0;
  const hasOpRecs        = (data.operationalRecs?.length ?? 0) > 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.headerBrand}>VYNTA</Text>
            <Text style={s.headerSub}>REPUTATION INTELLIGENCE REPORT</Text>
          </View>
          <Text style={s.headerDate}>{data.generatedDate}</Text>
        </View>

        {/* ── Name bar ── */}
        <View style={s.nameBar}>
          <Text style={s.nameBarLabel}>Prepared for</Text>
          <Text style={s.nameBarTitle}>{data.businessName}</Text>
        </View>

        <View style={s.body}>

          {/* ── Stats ── */}
          <Text style={[s.secLabel, { marginTop: 6 }]}>Reputation Overview</Text>
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statVal}>{data.rating != null ? `${data.rating}★` : "—"}</Text>
              <Text style={s.statLbl}>Google Rating</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statVal}>{data.totalReviews != null ? data.totalReviews.toLocaleString() : "—"}</Text>
              <Text style={s.statLbl}>Total Reviews</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statVal}>{data.positive != null ? `${data.positive}%` : "—"}</Text>
              <Text style={s.statLbl}>Positive Sentiment</Text>
            </View>
            <View style={s.statBoxLast}>
              <Text style={[s.statVal, { fontSize: 13, marginTop: 3 }]}>{trendLabel(data.trending)}</Text>
              <Text style={s.statLbl}>Trend</Text>
            </View>
          </View>

          {/* ── AI Business Summary ── */}
          {data.businessSummary && (
            <View style={s.summaryCard} wrap={false}>
              <Text style={[s.secLabel, { marginBottom: 6 }]}>AI Business Summary</Text>
              <Text style={s.summaryText}>{data.businessSummary}</Text>
            </View>
          )}

          {/* ── Priority Actions ── */}
          {hasPriorities && (
            <View wrap={false}>
              <SectionHead>{"This Week's Priorities"}</SectionHead>
              {data.priorityActions!.slice(0, 3).map((action, i) => (
                <View key={i} style={s.actionRow}>
                  <Text style={[s.actionNum, i === 1 ? s.actionNumAmber : i === 2 ? s.actionNumMuted : {}]}>
                    <Text style={i === 2 ? s.actionNumMutedText : {}}>{i + 1}</Text>
                  </Text>
                  <Text style={s.actionText}>{action}</Text>
                </View>
              ))}
              <View style={s.spacer} />
            </View>
          )}

          {/* ── Early Warnings ── */}
          {hasWarnings && (
            <View wrap={false}>
              <SectionHead>Early Warning System</SectionHead>
              {data.earlyWarnings!.slice(0, 4).map((w, i) => {
                const bg  = w.type === "warning" ? "rgba(220,38,38,0.05)" : w.type === "positive" ? "rgba(45,155,138,0.06)" : "rgba(196,135,74,0.07)";
                const bc  = w.type === "warning" ? RED : w.type === "positive" ? TEAL : AMBER;
                return (
                  <View key={i} style={[s.warnCard, { backgroundColor: bg, borderLeftWidth: 3, borderLeftColor: bc }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <Text style={s.warnTitle}>{w.title}</Text>
                      <Text style={[s.sevBadge, { backgroundColor: `${sevColor(w.severity)}18`, color: sevColor(w.severity) }]}>
                        {w.severity.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={s.warnDetail}>{w.detail}</Text>
                    <Text style={s.warnAction}>→ Action: {w.action}</Text>
                  </View>
                );
              })}
              <View style={s.spacer} />
            </View>
          )}

          {/* ── What Customers Are Saying ── */}
          {hasSentiment && (
            <>
              <SectionHead>What Customers Are Saying</SectionHead>
              <View style={s.twoCol}>
                <View style={s.col}>
                  <Text style={s.colTitle}>What they love</Text>
                  {data.praiseThemes.slice(0, 6).map((t, i) => (
                    <View key={i} style={s.dotRow}>
                      <View style={[s.dot, { backgroundColor: TEAL }]} />
                      <Text style={s.dotText}>{t}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.colRight}>
                  <Text style={s.colTitle}>Biggest complaints</Text>
                  {data.complaintThemes.slice(0, 6).map((t, i) => (
                    <View key={i} style={s.dotRow}>
                      <View style={[s.dot, { backgroundColor: sevColor(t.severity) }]} />
                      <Text style={s.dotText}>{t.theme}</Text>
                      {t.severity === "high" && <Text style={s.sevText}>(High)</Text>}
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* ── Risks ── */}
          {hasRisks && (
            <View wrap={false}>
              <SectionHead>Active Risks</SectionHead>
              {data.risks!.slice(0, 4).map((r, i) => (
                <View key={i} style={s.riskRow}>
                  <View style={[s.riskDot, { backgroundColor: sevColor(r.severity) }]} />
                  <Text style={s.riskText}>{r.description}</Text>
                </View>
              ))}
              <View style={s.spacer} />
            </View>
          )}

          {/* ── Operational Recommendations ── */}
          {hasOpRecs && (
            <View wrap={false}>
              <SectionHead>Operational Recommendations</SectionHead>
              {data.operationalRecs!.slice(0, 5).map((rec, i) => (
                <View key={i} style={s.opRecRow}>
                  <Text style={s.opRecBullet}>→</Text>
                  <Text style={s.opRecText}>{rec}</Text>
                </View>
              ))}
              <View style={s.spacer} />
            </View>
          )}

          {/* ── Top Action (simple) ── */}
          {data.topAction && !hasPriorities && (
            <View style={s.actionCard} wrap={false}>
              <Text style={s.actionCardLabel}>#1 Biggest Opportunity</Text>
              <Text style={s.actionCardText}>{data.topAction}</Text>
            </View>
          )}

          {/* ── Competitor Intelligence ── */}
          {(hasCompetitors || hasThreat) && (
            <>
              <SectionHead>Competitor Intelligence</SectionHead>

              {hasCompetitors && (
                <View wrap={false}>
                  <View style={s.tableHead}>
                    <Text style={[s.tableHeadTxt, s.colName]}>Business</Text>
                    <Text style={[s.tableHeadTxt, s.colRating]}>Rating</Text>
                    <Text style={[s.tableHeadTxt, s.colReviews]}>Reviews</Text>
                  </View>
                  {data.competitors!.slice(0, 5).map((c, i) => (
                    <View key={i} style={s.tableRow}>
                      <Text style={[s.tableCell, s.colName]}>{c.name}</Text>
                      <Text style={[s.tableCell, s.colRating, { color: c.rating > (data.rating ?? 0) ? RED : TEAL }]}>
                        {c.rating}★
                      </Text>
                      <Text style={[s.tableMuted, s.colReviews]}>{c.reviewCount.toLocaleString()}</Text>
                    </View>
                  ))}
                  <View style={s.spacerSm} />
                </View>
              )}

              {hasThreat && (
                <View wrap={false}>
                  {([
                    { label: "Biggest Threat",       value: data.threatAnalysis!.biggestThreat, color: RED,   bg: "rgba(220,38,38,0.05)"  },
                    { label: "Where They Beat You",   value: data.threatAnalysis!.beatingUser,   color: AMBER, bg: "rgba(196,135,74,0.07)" },
                    { label: "Where You Win",         value: data.threatAnalysis!.userBeating,   color: TEAL,  bg: "rgba(45,155,138,0.06)" },
                  ] as const).map(({ label, value, color, bg }) => (
                    <View key={label} style={[s.threatCard, { backgroundColor: bg, borderLeftWidth: 3, borderLeftColor: color }]}>
                      <Text style={[s.threatCardLabel, { color }]}>{label}</Text>
                      <Text style={s.threatCardText}>{value}</Text>
                    </View>
                  ))}

                  {(data.threatAnalysis!.actions ?? []).length > 0 && (
                    <>
                      <Text style={[s.secLabel, { marginTop: 10, marginBottom: 8 }]}>Recommended Actions</Text>
                      {data.threatAnalysis!.actions.map((action, i) => (
                        <View key={i} style={s.actionRow}>
                          <Text style={[s.actionNum, i === 1 ? s.actionNumAmber : i > 1 ? s.actionNumMuted : {}]}>
                            {i + 1}
                          </Text>
                          <Text style={s.actionText}>{action}</Text>
                        </View>
                      ))}
                    </>
                  )}
                  <View style={s.spacer} />
                </View>
              )}
            </>
          )}

          {/* ── Market Intelligence ── */}
          {hasMarket && (
            <View wrap={false}>
              <SectionHead>Market Intelligence</SectionHead>

              {(data.marketIntel!.emergingThemes ?? []).length > 0 && (
                <>
                  <Text style={[s.secLabel, { marginBottom: 7 }]}>Emerging Market Themes</Text>
                  <View style={[s.tagRow, { marginBottom: 12 }]}>
                    {data.marketIntel!.emergingThemes.map((t, i) => (
                      <View key={i} style={s.tag}><Text style={s.tagText}>{t}</Text></View>
                    ))}
                  </View>
                </>
              )}

              <View style={[s.marketCard, { backgroundColor: "rgba(196,135,74,0.07)", borderLeftWidth: 3, borderLeftColor: AMBER }]}>
                <Text style={[s.marketCardLabel, { color: AMBER }]}>Opportunity Gap</Text>
                <Text style={s.marketCardText}>{data.marketIntel!.opportunityGap}</Text>
              </View>

              <View style={[s.marketCard, { backgroundColor: CREAM }]}>
                <Text style={[s.marketCardLabel, { color: MUTED }]}>What Top Businesses Do</Text>
                <Text style={s.marketCardText}>{data.marketIntel!.whatTopBusinessesDo}</Text>
              </View>

              <View style={s.spacer} />
            </View>
          )}

          {/* ── Revenue Opportunities ── */}
          {hasRevOpps && (
            <>
              <SectionHead>Revenue Opportunities</SectionHead>
              {data.revenueOpportunities!.slice(0, 3).map((opp, i) => (
                <View key={i} style={s.oppCard} wrap={false}>
                  <View style={s.oppTopRow}>
                    <Text style={s.oppTitle}>{opp.title}</Text>
                    <Text style={s.oppValue}>{opp.estimatedValue}</Text>
                  </View>
                  <Text style={s.oppDetail}>{opp.detail}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={s.oppAction}>→ {opp.action}</Text>
                    <Text style={s.oppTime}>· {opp.timeToImpact}</Text>
                  </View>
                </View>
              ))}
              <View style={s.spacerSm} />
            </>
          )}

          {/* ── Legacy opportunities (admin/prospect report) ── */}
          {!hasRevOpps && hasOpps && (
            <>
              <SectionHead>Revenue Opportunities</SectionHead>
              {data.opportunities!.slice(0, 3).map((o, i) => (
                <View key={i} style={s.oppCard} wrap={false}>
                  <View style={s.oppTopRow}>
                    <Text style={s.oppTitle}>{o.title}</Text>
                    <Text style={s.oppValue}>{o.estimatedValue}</Text>
                  </View>
                  <Text style={s.oppDetail}>{o.detail}</Text>
                </View>
              ))}
              <View style={s.spacerSm} />
            </>
          )}

          {/* ── Competitor Gaps ── */}
          {hasGaps && (
            <>
              <SectionHead>Competitor Gaps</SectionHead>
              {data.competitorGaps!.slice(0, 3).map((gap, i) => (
                <View key={i} style={s.gapCard} wrap={false}>
                  <Text style={s.gapCompetitor}>{gap.competitor}</Text>
                  <Text style={s.gapTitle}>{gap.title}</Text>
                  <Text style={s.gapOpp}>{gap.opportunity}</Text>
                </View>
              ))}
              <View style={s.spacerSm} />
            </>
          )}

          {/* ── Quick Wins ── */}
          {hasWins && (
            <View wrap={false}>
              <SectionHead>Quick Wins</SectionHead>
              <View style={{ backgroundColor: CREAM, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 18 }}>
                {data.quickWins!.slice(0, 5).map((win, i) => (
                  <View key={i} style={[s.winRow, { borderBottomWidth: i < data.quickWins!.length - 1 ? 1 : 0 }]}>
                    <Text style={s.winAction}>{win.action}</Text>
                    <Text style={s.winWhy}>{win.why}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Prospect Pitch ── */}
          {data.isProspect && (
            <View style={s.pitchCard} wrap={false}>
              <Text style={s.pitchTitle}>Turn your reputation into a revenue engine.</Text>
              {[
                "Early warning system — catch complaint spikes before they hurt your leads",
                "Competitor intelligence — see exactly where rivals are beating you and close the gap",
                "Opportunity engine — specific revenue estimates and quick wins ranked by impact",
                "Sentiment analysis — understand what customers say and what it costs you",
                "AI review responses — reply to any review in seconds, in your voice",
              ].map((item, i) => (
                <View key={i} style={s.pitchRow}>
                  <Text style={s.pitchBullet}>·</Text>
                  <Text style={s.pitchText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerL}>vynta.io · Reputation Intelligence</Text>
          <Text style={s.footerR}>
            {data.isProspect
              ? `Prepared exclusively for ${data.businessName}`
              : `${data.businessName} · ${data.generatedDate}`}
          </Text>
        </View>

      </Page>
    </Document>
  );
}
