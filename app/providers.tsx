'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import FunnelTracker from './components/FunnelTracker';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      {children}
      <FunnelTracker />
    </PHProvider>
  );
}
