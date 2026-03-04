import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "G&M Studio Tasks",
  description: "Task management for G&M Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Mobile blocker - shown only on screens smaller than desktop */}
        <div className="lg:hidden min-h-screen bg-gray-950 flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Go to desktop, I have a life
            </h1>
            <p className="text-gray-400 text-lg">
              This application is only available on desktop screens
            </p>
          </div>
        </div>

        {/* Website content - shown only on desktop screens */}
        <div className="hidden lg:block">
          {children}
        </div>
      </body>
    </html>
  );
}
