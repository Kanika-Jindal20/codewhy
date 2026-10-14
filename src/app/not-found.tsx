import Link from 'next/link';
import { Layers } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="p-3 mb-3 rounded-full bg-app-surface text-accent-primary border border-app-border">
        <Layers className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-text-primary mb-2">404 — Page Not Found</h2>
      <p className="text-sm text-text-muted max-w-md mb-6">
        The requested CodeWhy intelligence module or route does not exist.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-lg bg-accent-primary hover:bg-[#5274e6] text-white text-xs font-semibold"
      >
        Return to Overview Dashboard
      </Link>
    </div>
  );
}
