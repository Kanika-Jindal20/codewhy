import React from 'react';
import type { Metadata } from 'next';
import { ArchitectureHealthClient } from './ArchitectureHealthClient';

export const metadata: Metadata = {
  title: 'Architecture Health Score — CodeWhy',
  description:
    'Mathematically explainable architecture health auditing, cycle detection, coupling control, and test coverage ratios.',
};

export default function ArchitectureHealthPage() {
  return <ArchitectureHealthClient />;
}
