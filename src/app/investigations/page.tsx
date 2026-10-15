import React from 'react';
import type { Metadata } from 'next';
import { InvestigationsClient } from './InvestigationsClient';

export const metadata: Metadata = {
  title: 'Investigation History & Memory — CodeWhy',
  description:
    'Preserve and revisit previous repository investigations, inspect grounded answer threads, detect stale evidence, and continue inquiries seamlessly.',
};

export default function InvestigationsPage() {
  return <InvestigationsClient />;
}
