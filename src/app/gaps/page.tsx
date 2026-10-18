import React from 'react';
import { KnowledgeGapsClient } from './KnowledgeGapsClient';

export const metadata = {
  title: 'Knowledge Gaps — CodeWhy',
  description: 'Identify undocumented architectural decisions and untested dependencies.',
};

export default function KnowledgeGapsPage() {
  return <KnowledgeGapsClient />;
}
