import "./globals.css";
import PayPalProvider from "../components/PayPalProvider";

export const metadata = {
  title: "GrowUp - Modern Sosyal Platform",
  description: "Neon renklerle modern sosyal medya deneyimi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <PayPalProvider>{children}</PayPalProvider>
      </body>
    </html>
  );
}
