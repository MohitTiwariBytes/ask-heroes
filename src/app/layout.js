import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { PopupProvider } from "@/components/popup/PopupProvider";

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
      <body>
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
