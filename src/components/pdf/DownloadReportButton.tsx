"use client";

import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import VyntaReport, { type PDFReportData } from "./VyntaReport";

interface Props {
  data: PDFReportData;
  style?: React.CSSProperties;
  label?: string;
}

export default function DownloadReportButton({ data, style, label = "Download PDF Report" }: Props) {
  const [ready, setReady] = useState(false);

  // Avoid SSR hydration mismatch — PDFDownloadLink is client-only
  useEffect(() => { setReady(true); }, []);

  if (!ready) {
    return (
      <button disabled style={{ ...buttonStyle, opacity: 0.5, ...style }}>
        {label}
      </button>
    );
  }

  const fileName = `${data.businessName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-vynta-report.pdf`;

  return (
    <PDFDownloadLink document={<VyntaReport data={data} />} fileName={fileName}>
      {({ loading }) => (
        <span style={{ ...buttonStyle, opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer", ...style }}>
          {loading ? "Building PDF…" : label}
        </span>
      )}
    </PDFDownloadLink>
  );
}

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "#2D9B8A",
  color: "white",
  borderRadius: "10px",
  padding: "10px 18px",
  fontSize: "13px",
  fontWeight: 600,
  border: "none",
  textDecoration: "none",
  cursor: "pointer",
  transition: "opacity 150ms",
  whiteSpace: "nowrap",
};
