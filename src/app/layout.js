import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import KeyboardBindingsProvider from '@/components/KeyboardBindingsProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AI Tools Marketplace - Discover the Best AI Tools",
  description: "Discover and share the best AI tools for your needs",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
    return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0A0F24] min-h-screen flex flex-col`}>
        <Providers>
          <KeyboardBindingsProvider>
            <Navbar />
            <main className="relative flex-grow">
              {children}
            </main>
            <Footer />
          </KeyboardBindingsProvider>
        </Providers>
      </body>
    </html>
  );
}
