import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0b0b0f",
          color: "#f4f4f5",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: "#60a5fa" }}>Open-source agent library</div>
        <div style={{ marginTop: 24, fontSize: 88, fontWeight: 700 }}>{siteConfig.name}</div>
        <div style={{ marginTop: 24, fontSize: 36, lineHeight: 1.4, color: "#a1a1aa", maxWidth: 960 }}>
          Curated AI agents with prompts, runbooks, evaluations, and install kits for Codex, Claude, and Cursor.
        </div>
      </div>
    ),
    size
  );
}
