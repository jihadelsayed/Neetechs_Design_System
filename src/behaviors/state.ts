import type { NtDisposable } from '../types/index.js';

export const NT_AVAILABILITY_STATES = ['enabled', 'disabled', 'read-only'] as const;
export const NT_INTERACTION_STATES = [
  'rest',
  'hover',
  'focus-visible',
  'pressed',
  'selected',
  'expanded',
  'dragging',
] as const;
export const NT_OPERATION_STATES = ['idle', 'pending', 'success', 'error', 'canceled'] as const;
export const NT_VALIDATION_STATES = ['neutral', 'valid', 'invalid', 'warning'] as const;
export const NT_CONTENT_STATES = [
  'initial',
  'loading',
  'ready',
  'refreshing',
  'empty',
  'partial',
  'stale',
  'error',
  'offline',
  'unauthenticated',
  'forbidden',
  'not-found',
  'maintenance',
  'success',
] as const;

export type NtAvailabilityState = (typeof NT_AVAILABILITY_STATES)[number];
export type NtInteractionState = (typeof NT_INTERACTION_STATES)[number];
export type NtOperationState = (typeof NT_OPERATION_STATES)[number];
export type NtValidationState = (typeof NT_VALIDATION_STATES)[number];
export type NtContentState = (typeof NT_CONTENT_STATES)[number];

export interface NtStateSnapshot {
  availability?: NtAvailabilityState;
  interaction?: NtInteractionState;
  operation?: NtOperationState;
  validation?: NtValidationState;
  content?: NtContentState;
}

export interface NtStateValidationResult {
  valid: boolean;
  errors: string[];
}

export const NT_STATE_PRIORITY = [
  'disabled',
  'pending',
  'error',
  'invalid',
  'selected',
  'expanded',
  'pressed',
  'focus-visible',
  'hover',
  'rest',
] as const;

function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value);
}

export function ntIsAvailabilityState(value: string): value is NtAvailabilityState {
  return includesValue(NT_AVAILABILITY_STATES, value);
}

export function ntIsInteractionState(value: string): value is NtInteractionState {
  return includesValue(NT_INTERACTION_STATES, value);
}

export function ntIsOperationState(value: string): value is NtOperationState {
  return includesValue(NT_OPERATION_STATES, value);
}

export function ntIsValidationState(value: string): value is NtValidationState {
  return includesValue(NT_VALIDATION_STATES, value);
}

export function ntIsContentState(value: string): value is NtContentState {
  return includesValue(NT_CONTENT_STATES, value);
}

export function ntValidateStateSnapshot(state: NtStateSnapshot): NtStateValidationResult {
  const errors: string[] = [];

  if (state.availability === 'disabled' && ['pressed', 'dragging'].includes(state.interaction ?? '')) {
    errors.push('disabled controls cannot be pressed or dragging');
  }

  if (state.availability === 'read-only' && state.operation === 'pending') {
    errors.push('read-only controls cannot submit or execute a pending operation');
  }

  if (state.operation === 'pending' && ['success', 'error'].includes(state.content ?? '')) {
    errors.push('pending operations cannot simultaneously present terminal content state');
  }

  if (state.content === 'loading' && state.operation === 'success') {
    errors.push('loading content cannot be marked as successful operation output');
  }

  return { valid: errors.length === 0, errors };
}

export function ntApplyState(element: HTMLElement, state: NtStateSnapshot): NtStateValidationResult {
  const result = ntValidateStateSnapshot(state);
  if (!result.valid) return result;

  if (state.availability) element.dataset.ntAvailability = state.availability;
  if (state.interaction) element.dataset.ntInteraction = state.interaction;
  if (state.operation) {
    element.dataset.ntState = state.operation;
    element.dataset.state = state.operation;
  }
  if (state.validation) element.dataset.ntValidation = state.validation;
  if (state.content) element.dataset.ntContentState = state.content;

  const busy =
    state.operation === 'pending' ||
    state.content === 'loading' ||
    state.content === 'refreshing';
  if (busy) element.setAttribute('aria-busy', 'true');
  else element.removeAttribute('aria-busy');

  if (state.validation === 'invalid') element.setAttribute('aria-invalid', 'true');
  else if (state.validation === 'valid' || state.validation === 'neutral') element.removeAttribute('aria-invalid');

  return result;
}

export interface NtAsyncActionOptions {
  control: HTMLElement;
  run: (event: Event, signal: AbortSignal | null) => Promise<unknown> | unknown;
  cancellable?: boolean;
  successResetDelay?: number | null;
  errorResetDelay?: number | null;
  onStateChange?: (state: NtOperationState) => void;
  onSuccess?: (value: unknown) => void;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
}

export interface NtAsyncActionController extends NtDisposable {
  readonly state: NtOperationState;
  readonly canCancel: boolean;
  cancel(): void;
  reset(): void;
}

export function ntCreateAsyncAction(options: NtAsyncActionOptions): NtAsyncActionController {
  const {
    control,
    run,
    cancellable = false,
    successResetDelay = 1200,
    errorResetDelay = 3000,
    onStateChange,
    onSuccess,
    onError,
    onCancel,
  } = options;

  const ownerWindow = control.ownerDocument.defaultView;
  let state: NtOperationState = 'idle';
  let resetTimer = 0;
  let abortController: AbortController | null = null;
  const hadAriaBusy = control.hasAttribute('aria-busy');
  const originalAriaBusy = control.getAttribute('aria-busy');
  const originalNtState = control.dataset.ntState;
  const originalState = control.dataset.state;

  function clearResetTimer(): void {
    if (resetTimer && ownerWindow) ownerWindow.clearTimeout(resetTimer);
    resetTimer = 0;
  }

  function setState(next: NtOperationState): void {
    clearResetTimer();
    state = next;
    control.dataset.ntState = next;
    control.dataset.state = next;

    if (next === 'pending') control.setAttribute('aria-busy', 'true');
    else if (hadAriaBusy && originalAriaBusy !== null) control.setAttribute('aria-busy', originalAriaBusy);
    else control.removeAttribute('aria-busy');

    onStateChange?.(next);
  }

  function scheduleReset(delay: number | null): void {
    if (delay === null) return;
    if (delay <= 0) {
      reset();
      return;
    }
    if (ownerWindow) resetTimer = ownerWindow.setTimeout(reset, delay);
  }

  function reset(): void {
    clearResetTimer();
    state = 'idle';
    if (originalNtState === undefined) delete control.dataset.ntState;
    else control.dataset.ntState = originalNtState;
    if (originalState === undefined) delete control.dataset.state;
    else control.dataset.state = originalState;
    if (hadAriaBusy && originalAriaBusy !== null) control.setAttribute('aria-busy', originalAriaBusy);
    else control.removeAttribute('aria-busy');
    onStateChange?.('idle');
  }

  async function activate(event: Event): Promise<void> {
    if (state === 'pending') {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    if (
      control.hasAttribute('disabled') ||
      control.getAttribute('aria-disabled') === 'true' ||
      control.dataset.disabled === 'true'
    ) {
      event.preventDefault();
      return;
    }

    setState('pending');
    abortController = cancellable && typeof AbortController !== 'undefined' ? new AbortController() : null;

    try {
      const value = await run(event, abortController?.signal ?? null);
      if (state === 'canceled') return;
      setState('success');
      onSuccess?.(value);
      scheduleReset(successResetDelay);
    } catch (error) {
      if (state === 'canceled') return;
      setState('error');
      onError?.(error);
      scheduleReset(errorResetDelay);
    } finally {
      abortController = null;
    }
  }

  function handleClick(event: MouseEvent): void {
    void activate(event);
  }

  control.addEventListener('click', handleClick);

  return {
    get state() {
      return state;
    },

    get canCancel() {
      return state === 'pending' && Boolean(abortController);
    },

    cancel() {
      if (state !== 'pending' || !abortController) return;
      abortController.abort();
      setState('canceled');
      onCancel?.();
      scheduleReset(0);
    },

    reset,

    destroy() {
      control.removeEventListener('click', handleClick);
      if (abortController) abortController.abort();
      reset();
    },
  };
}
