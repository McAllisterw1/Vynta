"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { PDFReportData } from "@/components/pdf/VyntaReport";

const DownloadReportButton = dynamic(
  () => import("@/components/pdf/DownloadReportButton"),
  { ssr: false }
);

interface FetchedData {
  businessName: string;
  rating: number | null;
  totalReviews: number | null;
  positive: number | null;
  trending: "improving" | "declining" | "stable" | null;
  praiseThemes: string[];
  complaintThemes: Array<{ theme: string; severity: string }>;
  topAction: string | null;
  error?: string;
}

const FIELD: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5DDD0",
  borderRadius: "10px",
  padding: "11px 14px",
  fontSize: "14px",
  color: "#2C1A0E",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export default function AdminReportPage() {
  const [placeId, setPlaceId]           = useState("");
  const [nameOverride, setNameOverride] = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [result, setResult]             = useState<FetchedData | null>(null);

  async function fetchProspect() {
    if (!placeId.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/prospect-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: placeId.trim(), businessName: nameOverride.trim() || undefined }),
      });
      const data = await res.json() as FetchedData;
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to fetch");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const reportData: PDFReportData | null = result
    ? {
        businessName: result.businessName,
        rating: result.rating,
        totalReviews: result.totalReviews,
        positive: result.positive,
        trending: result.trending,
        praiseThemes: result.praiseThemes,
        complaintThemes: result.complaintThemes as PDFReportData["complaintThemes"],
        topAction: result.topAction,
        isProspect: true,
        generatedDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      }
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#FAF6F0", padding: "40px 24px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", color: "#2D9B8A", textTransform: "uppercase" }}>Admin</span>
            <span style={{ fontSize: "11px", color: "#A0856A" }}>·</span>
            <span style={{ fontSize: "11px", color: "#A0856A" }}>Prospect Report Generator</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C1A0E", margin: 0 }}>Generate Prospect Report</h1>
          <p style={{ fontSize: "13px", color: "#A0856A", marginTop: "6px", lineHeight: 1.6 }}>
            Enter a Google Place ID to pull their data, run sentiment analysis, and download a branded PDF you can attach to your cold email.
          </p>
          <p style={{ fontSize: "11px", color: "#C4874A", marginTop: "6px" }}>
            Uses Outscraper credits (25 reviews) + Claude Haiku. Use selectively.
          </p>
        </div>

        {/* Form */}
        <div style={{ background: "#E8DCC8", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#A0856A", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Google Place ID *
            </label>
            <input
              type="text"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              placeholder="ChIJ…"
              style={FIELD}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#A0856A", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Business Name Override (optional)
            </label>
            <input
              type="text"
              value={nameOverride}
              onChange={(e) => setNameOverride(e.target.value)}
              placeholder="Leave blank to use the name from Google"
              style={FIELD}
            />
          </div>

          {error && (
            <p style={{ fontSize: "12px", color: "#DC2626", marginBottom: "12px" }}>{error}</p>
          )}

          <button
            type="button"
            onClick={fetchProspect}
            disabled={!placeId.trim() || loading}
            style={{
              width: "100%",
              background: loading || !placeId.trim() ? "rgba(45,155,138,0.5)" : "#2D9B8A",
              color: "white",
              borderRadius: "10px",
              padding: "13px",
              fontSize: "14px",
              fontWeight: 700,
              border: "none",
              cursor: loading || !placeId.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Fetching data… (up to 30s)" : "Pull Data & Analyze"}
          </button>
        </div>

        {/* Result preview + download */}
        {result && reportData && (
          <div style={{ background: "#E8DCC8", borderRadius: "16px", padding: "24px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#2D9B8A", textTransform: "uppercase", marginBottom: "14px" }}>
              Ready to Download
            </p>

            {/* Preview stats */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
              {[
                { label: "Business", value: result.businessName },
                { label: "Rating", value: result.rating != null ? `${result.rating}★` : "—" },
                { label: "Reviews", value: result.totalReviews?.toLocaleString() ?? "—" },
                { label: "Sentiment", value: result.positive != null ? `${result.positive}% positive` : "—" },
              ].map((s) => (
                <div key={s.label} style={{ background: "white", borderRadius: "8px", padding: "8px 12px", minWidth: "100px" }}>
                  <p style={{ fontSize: "9px", color: "#A0856A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>{s.label}</p>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#2C1A0E" }}>{s.value}</p>
                </div>
              ))}
            </div>

            {result.topAction && (
              <div style={{ background: "rgba(45,155,138,0.08)", border: "1px solid rgba(45,155,138,0.2)", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>
                <p style={{ fontSize: "9px", color: "#2D9B8A", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>#1 Recommendation</p>
                <p style={{ fontSize: "12px", color: "#2C1A0E", lineHeight: 1.6 }}>{result.topAction}</p>
              </div>
            )}

            <DownloadReportButton
              data={reportData}
              label="⬇ Download PDF Report"
              style={{ width: "100%", justifyContent: "center" }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
