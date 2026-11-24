'use client';

/**
 * FloralCanvas — fixed, full-viewport WebGL petal field behind the page.
 *
 * This file is only the gate. The three.js scene (FloralScene) is imported
 * lazily and only when the device should run it:
 *   - not prefers-reduced-motion
 *   - navigator.hardwareConcurrency >= 4
 *   - WebGL available
 * It also waits for the browser to go idle so it never competes with LCP.
 * Mobile (≤768px): 100 petals, 0.75 DPR, no depth-of-field.
 */

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import LogoBloom from './LogoBloom';

const FloralScene = dynamic(() => import('./FloralScene'), { ssr: false });

type Mode = 'desktop' | 'mobile' | null;

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

export default function FloralCanvas() {
  const [mode, setMode] = useState<Mode>(null);
  const [ready, setReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  // Stable callback: LogoBloom restarts its timers whenever onDone changes identity.
  const onSplashDone = useCallback(() => setShowSplash(false), []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = window.matchMedia('(max-width: 768px)');
    const cores = navigator.hardwareConcurrency ?? 4;
    if (cores < 4 || !hasWebGL()) return;

    const update = () => {
      if (reduced.matches) { setMode(null); setReady(false); return; }
      setMode(narrow.matches ? 'mobile' : 'desktop');
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const idle = w.requestIdleCallback
      ? w.requestIdleCallback(update, { timeout: 2500 })
      : window.setTimeout(update, 1200);

    reduced.addEventListener('change', update);
    narrow.addEventListener('change', update);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(idle as number);
      else window.clearTimeout(idle as number);
      reduced.removeEventListener('change', update);
      narrow.removeEventListener('change', update);
    };
  }, []);

  // The splash renders on every device, including those where WebGL is skipped (mode stays null).
  return (
    <>
      {showSplash && <LogoBloom onDone={onSplashDone} />}
      {mode && (
        <div className={`floral-canvas${ready ? ' ready' : ''}`} aria-hidden="true">
          <FloralScene key={mode} mobile={mode === 'mobile'} onReady={() => setReady(true)} />
        </div>
      )}
    </>
  );
}
