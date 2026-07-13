import type { NtDisposable } from '../types/index.js';

export type NtLivePoliteness = 'polite' | 'assertive';

export interface NtAnnouncerOptions {
  documentRef?: Document;
  politeness?: NtLivePoliteness;
  atomic?: boolean;
}

export interface NtAnnouncer extends NtDisposable {
  readonly element: HTMLElement;
  announce(message: string): void;
  clear(): void;
}

export function ntCreateAnnouncer(options: NtAnnouncerOptions = {}): NtAnnouncer {
  const documentRef = options.documentRef ?? document;
  const politeness = options.politeness ?? 'polite';
  const element = documentRef.createElement('div');
  element.className = 'nt-sr-only';
  element.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status');
  element.setAttribute('aria-live', politeness);
  element.setAttribute('aria-atomic', String(options.atomic ?? true));
  documentRef.body.append(element);
  let generation = 0;

  function clear(): void {
    generation += 1;
    element.textContent = '';
  }

  return {
    element,
    announce(message: string) {
      const normalized = message.trim();
      if (!normalized) return;
      generation += 1;
      const current = generation;
      element.textContent = '';
      queueMicrotask(() => {
        if (generation === current && element.isConnected) element.textContent = normalized;
      });
    },
    clear,
    destroy() {
      clear();
      element.remove();
    },
  };
}

export function ntConfigureToastSemantics(
  toast: HTMLElement,
  urgency: 'routine' | 'error' = 'routine',
): void {
  const assertive = urgency === 'error';
  toast.setAttribute('role', assertive ? 'alert' : 'status');
  toast.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  toast.setAttribute('aria-atomic', 'true');
}
