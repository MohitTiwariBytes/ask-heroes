import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/glaze/glaze.css";
import "./globals.css";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { PopupProvider } from "@/components/popup/PopupProvider";

const marvelFont = localFont({
  src: "../assets/Fonts/Marvel-Regular.ttf",
  variable: "--font-marvel",
  display: "swap",
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata = {
  title: "Ask Heroes",
  description: "Ask Heroes",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${marvelFont.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="glaze">
        <ToastProvider>
          <PopupProvider>
            <div className="app-content">{children}</div>
          </PopupProvider>
        </ToastProvider>
        <div className="small-screen-message">
          <p>
            Ask Heroes isn&apos;t available on smaller screens yet. Please use a
            laptop or desktop to continue.
          </p>
        </div>
      </body>
    </html>
  );
}
