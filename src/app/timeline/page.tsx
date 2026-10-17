import type { Metadata } from 'next';
import { DecisionTimelineClient } from './DecisionTimelineClient';

export const metadata: Metadata = {
  title: 'Decision Timeline — CodeWhy',
  description: 'Review repository events, decision records, and evidence-backed changes in chronological order.',
};

export default function TimelinePage() {
  return <DecisionTimelineClient />;
}
