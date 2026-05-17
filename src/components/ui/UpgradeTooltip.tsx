"use client";

import { useState } from "react";

interface Props {
  children: React.ReactNode;
  locked: boolean;
  requiredPlan?: string;
}

export default function UpgradeTooltip({ children, locked, requiredPlan = "Pro" }: Props) {
  const [showTip, setShowTip] = useState(false);

  if (!locked) return <>{children}</>;

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      {/* Dimmed, non-interactive children */}
      <div style={{ opacity: 0.45, pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>

      {/* Lock badge */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "#2C1A0E",
          borderRadius: "20px",
          padding: "3px 10px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "10px",
          color: "white",
          fontWeight: 600,
          zIndex: 10,
          pointerEvents: "auto",
          cursor: "default",
          letterSpacing: "0.04em",
        }}
      >
        🔒 {requiredPlan}
      </div>

      {/* Tooltip */}
      {showTip && (
        <div
          style={{
            position: "absolute",
            top: "0px",
            right: "0px",
            transform: "translateY(calc(-100% - 8px))",
            background: "#2C1A0E",
            color: "white",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "11px",
            fontWeight: 500,
            whiteSpace: "nowrap",
            zIndex: 200,
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(44,26,14,0.2)",
          }}
        >
          Upgrade to {requiredPlan} to unlock
          <div
            style={{
              position: "absolute",
              bottom: "-5px",
              right: "22px",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #2C1A0E",
            }}
          />
        </div>
      )}
    </div>
  );
}
