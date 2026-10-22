import React from 'react';
import type { Metadata } from 'next';
import { TestGapsClient } from './TestGapsClient';

export const metadata: Metadata = {
  title: 'Test Gap & Failure Path Finder — CodeWhy',
  description:
    'Identify untested execution paths, audit downstream blast radius, and generate concrete regression test suites.',
};

export default function TestGapsPage() {
  return <TestGapsClient />;
}
