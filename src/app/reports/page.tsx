import React from 'react';
import type { Metadata } from 'next';
import { ReportsClient } from './ReportsClient';

export const metadata: Metadata = {
  title: 'Engineering Decision Reports — CodeWhy',
  description:
    'Generate and export publication-grade, traceable engineering decision reports and pre-change impact audits in PDF format.',
};

export default function ReportsPage() {
  return <ReportsClient />;
}
