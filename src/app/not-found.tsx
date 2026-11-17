'use client';

import Link from 'next/link';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-[12px] border border-[#EDEDED]">
      <div className="p-3 mb-3 rounded-full bg-[#F4F4F5] text-[#171717] border border-[#EDEDED]">
        <Layers className="w-6 h-6 stroke-[2]" />
      </div>
      <h2 className="text-lg font-semibold text-[#171717] mb-1">404 — Page Not Found</h2>
      <p className="text-xs text-[#707070] max-w-sm mb-5">
        The requested CodeWhy intelligence module or route does not exist.
      </p>
      <Link href="/">
        <Button variant="primary" size="sm">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
