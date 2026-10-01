import React from "react";

// "Neon Hour" wordmark styled like a backlit neon bar sign:
// a blue "Neon" tube and a gold "Hour" tube with layered glows and a subtle flicker.
export default function NeonSign({ className = "" }) {
  return (
    <span className={`font-display uppercase tracking-widest whitespace-nowrap neon-flicker ${className}`}>
      <span
        className="text-neon"
        style={{
          textShadow:
            "0 0 6px rgba(255,59,78,0.9), 0 0 18px rgba(255,59,78,0.55), 0 0 42px rgba(255,59,78,0.4)",
        }}
      >
        Neon
      </span>{" "}
      <span
        className="text-amber"
        style={{
          textShadow:
            "0 0 6px rgba(255,196,0,0.9), 0 0 18px rgba(255,196,0,0.5), 0 0 42px rgba(255,196,0,0.35)",
        }}
      >
        Hour
      </span>
    </span>
  );
}