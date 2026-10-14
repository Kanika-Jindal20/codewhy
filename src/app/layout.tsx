import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'CodeWhy — Engineering Decision Intelligence',
  description: 'AI-powered codebase reasoning and architectural decision intelligence platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-app-bg text-text-primary antialiased min-h-screen flex flex-col font-sans">
        <div className="flex flex-1 min-h-screen overflow-hidden">
          {/* Persistent Sidebar */}
          <Sidebar />

          {/* Main Content Workspace */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 bg-app-bg">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
