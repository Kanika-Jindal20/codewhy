import React from 'react';
import type { Metadata } from 'next';
import { InvestigatorClient } from './InvestigatorClient';

export const metadata: Metadata = {
  title: 'Autonomous Engineering Investigator — CodeWhy',
  description:
    'Autonomous codebase risk audit and architectural investigation powered by AST parsing, graph dependency traversal, and Sarvam AI.',
};

export default function InvestigatorPage() {
  return <InvestigatorClient />;
}
