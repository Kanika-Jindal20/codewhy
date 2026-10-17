import type { Metadata } from 'next';
import { AskWhyClient } from './AskWhyClient';

export const metadata: Metadata = {
  title: 'Ask Why — CodeWhy',
  description: 'Ask repository questions and inspect the evidence supporting each answer.',
};

export default function AskWhyPage() {
  return <AskWhyClient />;
}
