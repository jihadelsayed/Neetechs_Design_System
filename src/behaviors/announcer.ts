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

export type NtToastTone = 'info' | 'success' | 'warning' | 'error' | 'progress';

export interface NtShowToastOptions {
  toast: HTMLElement;
  id?: string;
  tone?: NtToastTone;
  timeout?: number | null;
  critical?: boolean;
}

export interface NtToastControllerOptions {
  viewport: HTMLElement;
  maxVisible?: number;
  defaultTimeout?: number;
}

export interface NtToastController extends NtDisposable {
  show(options: NtShowToastOptions): NtDisposable;
  dismiss(id: string): void;
  dismissAll(): void;
}

interface NtToastRecord {
  id: string;
  toast: HTMLElement;
  critical: boolean;
  timeout: number | null;
  remaining: number;
  startedAt: number;
  timer: number;
  cleanup: NtDisposable[];
}

let toastIdCounter = 0;

export function ntCreateToastController(options: NtToastControllerOptions): NtToastController {
  const { viewport, maxVisible = 3, defaultTimeout = 5000 } = options;
  const ownerWindow = viewport.ownerDocument.defaultView;
  const records = new Map<string, NtToastRecord>();

  function clearTimer(record: NtToastRecord): void {
    if (record.timer && ownerWindow) ownerWindow.clearTimeout(record.timer);
    record.timer = 0;
  }

  function closeRecord(record: NtToastRecord): void {
    clearTimer(record);
    for (const disposable of record.cleanup.splice(0)) disposable.destroy();
    record.toast.dataset.ntState = 'closed';
    record.toast.dataset.state = 'closed';
    record.toast.remove();
    records.delete(record.id);
  }

  function startTimer(record: NtToastRecord): void {
    if (record.timeout === null || record.remaining <= 0 || !ownerWindow) return;
    record.startedAt = Date.now();
    record.timer = ownerWindow.setTimeout(() => closeRecord(record), record.remaining);
  }

  function pauseTimer(record: NtToastRecord): void {
    if (!record.timer) return;
    clearTimer(record);
    record.remaining = Math.max(0, record.remaining - (Date.now() - record.startedAt));
  }

  function enforceStackLimit(): void {
    const removable = Array.from(records.values()).filter((record) => !record.critical);
    while (records.size > maxVisible && removable.length > 0) {
      closeRecord(removable.shift() as NtToastRecord);
    }
  }

  function dismiss(id: string): void {
    const record = records.get(id);
    if (record) closeRecord(record);
  }

  return {
    show(toastOptions) {
      const {
        toast,
        id = `nt-toast-${++toastIdCounter}`,
        tone = 'info',
        critical = false,
      } = toastOptions;
      const timeout = toastOptions.timeout ?? (critical || tone === 'error' ? null : defaultTimeout);

      dismiss(id);
      toast.dataset.ntToastId = id;
      toast.dataset.ntState = 'open';
      toast.dataset.state = 'open';
      toast.dataset.ntTone = tone;
      toast.dataset.ntCritical = String(critical);
      ntConfigureToastSemantics(toast, tone === 'error' ? 'error' : 'routine');

      const closeButton = toast.querySelector<HTMLElement>('.nt-toast__close,[data-nt-toast-close]');
      const record: NtToastRecord = {
        id,
        toast,
        critical,
        timeout,
        remaining: timeout ?? 0,
        startedAt: 0,
        timer: 0,
        cleanup: [],
      };

      const closeListener = (event: Event) => {
        event.preventDefault();
        closeRecord(record);
      };
      const pauseListener = () => pauseTimer(record);
      const resumeListener = () => startTimer(record);

      closeButton?.addEventListener('click', closeListener);
      toast.addEventListener('pointerenter', pauseListener);
      toast.addEventListener('pointerleave', resumeListener);
      toast.addEventListener('focusin', pauseListener);
      toast.addEventListener('focusout', resumeListener);

      record.cleanup.push(
        {
          destroy() {
            closeButton?.removeEventListener('click', closeListener);
          },
        },
        {
          destroy() {
            toast.removeEventListener('pointerenter', pauseListener);
            toast.removeEventListener('pointerleave', resumeListener);
            toast.removeEventListener('focusin', pauseListener);
            toast.removeEventListener('focusout', resumeListener);
          },
        },
      );

      viewport.append(toast);
      records.set(id, record);
      startTimer(record);
      enforceStackLimit();

      return {
        destroy() {
          closeRecord(record);
        },
      };
    },

    dismiss,

    dismissAll() {
      for (const record of Array.from(records.values())) closeRecord(record);
    },

    destroy() {
      for (const record of Array.from(records.values())) closeRecord(record);
    },
  };
}
