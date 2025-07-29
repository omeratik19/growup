import "./globals.css";

export const metadata = {
  title: "GrowUp - Modern Sosyal Platform",
  description: "Neon renklerle modern sosyal medya deneyimi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
