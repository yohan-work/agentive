import { siteConfig } from "@/lib/site";
import "../globals.css";

export const metadata = {
  title: siteConfig.name,
  description: siteConfig.description
};

// Root layout for "/", which only redirects to the default locale.
export default function RootRedirectLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
