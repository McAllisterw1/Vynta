"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const md: Components = {
  p: ({ children }) => (
    <p style={{ margin: 0, lineHeight: 1.65, color: "inherit", fontSize: "inherit" }}>{children}</p>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 600, color: "inherit" }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ fontStyle: "italic", color: "inherit" }}>{children}</em>
  ),
  h1: ({ children }) => (
    <h1 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "inherit", margin: "8px 0 4px" }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display" style={{ fontSize: "1rem", fontWeight: 700, color: "inherit", margin: "6px 0 4px" }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display" style={{ fontSize: "0.9rem", fontWeight: 600, color: "inherit", margin: "4px 0 2px" }}>{children}</h3>
  ),
  ul: ({ children }) => (
    <ul style={{ paddingLeft: "18px", margin: "4px 0" }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ paddingLeft: "18px", margin: "4px 0" }}>{children}</ol>
  ),
  li: ({ children }) => (
    <li style={{ color: "inherit", lineHeight: 1.6, marginBottom: "2px" }}>{children}</li>
  ),
};

interface Props {
  children: string;
}

export default function MarkdownContent({ children }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <ReactMarkdown components={md}>{children}</ReactMarkdown>
    </div>
  );
}
