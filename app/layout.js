import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'sonner';
import "./globals.css";

export const metadata = {
  title: "IntelliCourse - AI Course Generator",
  description: "IntelliCourse creates comprehensive AI-powered courses in seconds. Transform your ideas into professional learning experiences with our intelligent course generation platform.",
  keywords: "IntelliCourse, AI course generator, online learning, course creation, artificial intelligence",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased antigravity-scroll-lock" suppressHydrationWarning>
          <ThemeProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
