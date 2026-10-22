import React from 'react';
import type { Metadata } from 'next';
import { PrReviewerClient } from './PrReviewerClient';

export const metadata: Metadata = {
  title: 'AI Pull Request Risk Reviewer — CodeWhy',
  description:
    'Audit GitHub Pull Requests for architectural breaking changes, unverified callers, and test gaps before merging.',
};

export default function PrReviewerPage() {
  return <PrReviewerClient />;
}
