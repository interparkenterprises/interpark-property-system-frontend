'use client';

import { useEffect, useRef, useState } from 'react';
import { readFragmentToken } from '@/lib/personnelSecurity';

type CapturedLinkToken = { token: string | null; ready: boolean };

export const usePersonnelLinkToken = () => {
  const [captured, setCaptured] = useState<CapturedLinkToken>({ token: null, ready: false });
  const initialCapture = useRef<CapturedLinkToken | null>(null);

  useEffect(() => {
    // React Strict Mode runs mount effects twice in development. Capture once so the
    // second pass cannot replace the token with null after the fragment is removed.
    initialCapture.current ??= {
      token: readFragmentToken(window.location.hash),
      ready: true
    };

    // This state handoff is required before removing the secret fragment from history.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCaptured(initialCapture.current);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }, []);

  return captured;
};
