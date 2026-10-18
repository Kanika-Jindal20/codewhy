import React from 'react';
import { RepositoriesClient } from './RepositoriesClient';

export const metadata = {
  title: 'Repositories — CodeWhy',
  description: 'Manage and connect codebases to CodeWhy.',
};

export default function RepositoriesPage() {
  return <RepositoriesClient />;
}
