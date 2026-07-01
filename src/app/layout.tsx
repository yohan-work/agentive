import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Agent Archive",
    template: "%s | Agent Archive"
  },
  description: "A curated library of AI agents, prompts, and workflow recipes for real-world work."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
