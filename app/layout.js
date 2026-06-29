import "./globals.css";

export const metadata = {
  title: "Journey Funnel",
  description:
    "Map a customer journey as a visual funnel: per-device steps, branching, notes, links and a present-mode walkthrough.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
