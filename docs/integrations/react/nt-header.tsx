import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ntMountHeader, ntRenderHeader,
  type NtHeaderActivation, type NtHeaderConfig, type NtHeaderController,
  type NtHeaderNavigation,
} from '@neetechs/ui';

export interface NtGlobalHeaderProps {
  readonly config: NtHeaderConfig;
  readonly onAction?: (activation: NtHeaderActivation) => void;
  readonly onNavigate?: (navigation: NtHeaderNavigation) => boolean;
}

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** React 18 reference adapter: the shared controller owns the child DOM. */
export function NtGlobalHeader(props: NtGlobalHeaderProps) {
  // Changing the instance ID intentionally remounts the dedicated host.
  return <HeaderHost key={props.config.id} {...props} />;
}

function HeaderHost(props: NtGlobalHeaderProps) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<NtHeaderController | null>(null);
  const committedProps = useRef(props);
  // Keep the initial HTML value stable for this instance. React must not
  // reconcile changes inside the controller-owned host after mounting.
  const [initialHtml] = useState(() => ({ __html: ntRenderHeader(props.config) }));

  // Update only after a commit, not during a potentially abandoned render.
  useClientLayoutEffect(() => { committedProps.current = props; });

  useClientLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const instance = ntMountHeader(element, committedProps.current.config, {
      onAction: activation => committedProps.current.onAction?.(activation),
      onNavigate: navigation => committedProps.current.onNavigate?.(navigation) ?? false,
    });
    controller.current = instance;
    return () => {
      if (controller.current === instance) controller.current = null;
      // StrictMode may immediately mount again; destroy releases the host.
      instance.destroy();
    };
  }, []);

  useClientLayoutEffect(() => {
    controller.current?.update(props.config);
  }, [props.config]);

  // Only escaped, URL-validated ntRenderHeader output is accepted here.
  // The server and first client render must use matching config snapshots.
  return <div ref={host} style={{ display: 'contents' }} dangerouslySetInnerHTML={initialHtml} />;
}
