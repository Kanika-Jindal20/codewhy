import React from 'react';
import type { Metadata } from 'next';
import { SimulatorClient } from './SimulatorClient';

export const metadata: Metadata = {
  title: 'What-If Change Simulator — CodeWhy',
  description:
    'Simulate proposed code modifications, predict AST blast radius, discover required tests, and generate migration checklists.',
};

export default function SimulatorPage() {
  return <SimulatorClient />;
}
