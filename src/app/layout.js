import localFont from "next/font/local";
import "./globals.css";

const marvelFont = localFont({
  src: "../assets/Fonts/Marvel-Regular.ttf",
  variable: "--font-marvel",
  display: "swap",
});

export const metadata = {
  title: "Ask Heroes",
  description: "Ask Heroes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={marvelFont.variable}>
      <body>{children}</body>
    </html>
  );
}
