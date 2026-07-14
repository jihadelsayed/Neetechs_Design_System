import { ntEnsureId } from './ids.js';
import type { NtDisposable } from '../types/index.js';

export interface NtConnectFieldOptions {
  control: HTMLElement;
  label?: HTMLElement | null;
  description?: HTMLElement | null;
  error?: HTMLElement | null;
  required?: boolean;
  invalid?: boolean;
}

function appendIdReference(element: HTMLElement, attribute: string, id: string): void {
  const ids = new Set((element.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean));
  ids.add(id);
  element.setAttribute(attribute, [...ids].join(' '));
}

/** Connects stable field naming/description/error references without inventing copy. */
export function ntConnectField(options: NtConnectFieldOptions): void {
  const { control, label = null, description = null, error = null } = options;
  const controlId = ntEnsureId(control, 'nt-field');

  if (label) {
    const labelId = ntEnsureId(label, 'nt-field-label');
    const isLabel = label.tagName.toLowerCase() === 'label';
    if (isLabel) label.setAttribute('for', controlId);
    else control.setAttribute('aria-labelledby', labelId);
  }

  if (description) {
    appendIdReference(control, 'aria-describedby', ntEnsureId(description, 'nt-field-help'));
  }

  if (error) {
    appendIdReference(control, 'aria-describedby', ntEnsureId(error, 'nt-field-error'));
  }

  if (options.required !== undefined) {
    control.setAttribute('aria-required', String(options.required));
  }

  if (options.invalid !== undefined) {
    control.setAttribute('aria-invalid', String(options.invalid));
  }
}

export function ntFocusErrorSummary(summary: HTMLElement): void {
  if (!summary.hasAttribute('tabindex')) summary.tabIndex = -1;
  summary.focus({ preventScroll: false });
  summary.scrollIntoView({ block: 'nearest' });
}

export type NtFormSubmissionState = 'editing' | 'submitting' | 'success' | 'failure';

export interface NtCreateFormControllerOptions {
  form: HTMLFormElement;
  errorSummary?: HTMLElement | null;
  validate?: (form: HTMLFormElement) => boolean | Promise<boolean>;
  submit: (form: HTMLFormElement, signal: AbortSignal | null) => Promise<unknown> | unknown;
  submitControls?: HTMLElement[];
  successResetDelay?: number | null;
  failureResetDelay?: number | null;
  onStateChange?: (state: NtFormSubmissionState) => void;
  onSuccess?: (value: unknown) => void;
  onFailure?: (error: unknown) => void;
  onValidationFailure?: () => void;
}

export interface NtFormController extends NtDisposable {
  readonly state: NtFormSubmissionState;
  reset(): void;
}

export function ntCreateFormController(options: NtCreateFormControllerOptions): NtFormController {
  const {
    form,
    errorSummary = null,
    validate,
    submit,
    submitControls = Array.from(form.querySelectorAll<HTMLElement>('[type="submit"], button:not([type])')),
    successResetDelay = 1200,
    failureResetDelay = null,
    onStateChange,
    onSuccess,
    onFailure,
    onValidationFailure,
  } = options;

  const ownerWindow = form.ownerDocument.defaultView;
  let state: NtFormSubmissionState = 'editing';
  let resetTimer = 0;
  let abortController: AbortController | null = null;

  function clearResetTimer(): void {
    if (resetTimer && ownerWindow) ownerWindow.clearTimeout(resetTimer);
    resetTimer = 0;
  }

  function setState(next: NtFormSubmissionState): void {
    clearResetTimer();
    state = next;
    form.dataset.ntState = next === 'failure' ? 'error' : next === 'submitting' ? 'pending' : next;
    form.dataset.ntSubmissionState = next;

    const pending = next === 'submitting';
    form.setAttribute('aria-busy', String(pending));
    for (const control of submitControls) {
      control.dataset.ntState = pending ? 'pending' : next === 'success' ? 'success' : next === 'failure' ? 'error' : 'idle';
      control.setAttribute('aria-busy', String(pending));
    }

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
    state = 'editing';
    form.dataset.ntState = 'idle';
    form.dataset.ntSubmissionState = 'editing';
    form.removeAttribute('aria-busy');
    for (const control of submitControls) {
      control.dataset.ntState = 'idle';
      control.removeAttribute('aria-busy');
    }
    onStateChange?.('editing');
  }

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (state === 'submitting') {
      event.stopImmediatePropagation();
      return;
    }

    const nativeValid = typeof form.checkValidity === 'function' ? form.checkValidity() : true;
    const customValid = validate ? await validate(form) : true;
    if (!nativeValid || !customValid) {
      setState('failure');
      errorSummary?.removeAttribute('hidden');
      if (errorSummary) ntFocusErrorSummary(errorSummary);
      onValidationFailure?.();
      scheduleReset(failureResetDelay);
      return;
    }

    setState('submitting');
    abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;

    try {
      const value = await submit(form, abortController?.signal ?? null);
      setState('success');
      onSuccess?.(value);
      scheduleReset(successResetDelay);
    } catch (error) {
      setState('failure');
      errorSummary?.removeAttribute('hidden');
      onFailure?.(error);
      scheduleReset(failureResetDelay);
    } finally {
      abortController = null;
    }
  }

  const submitListener = (event: SubmitEvent) => {
    void handleSubmit(event);
  };

  const inputListener = (event: Event) => {
    const target = event.target;
    if (target instanceof HTMLElement) target.dataset.ntDirty = 'true';
    if (state === 'failure') {
      form.dataset.ntSubmissionState = 'editing';
      form.dataset.ntState = 'idle';
    }
  };

  form.addEventListener('submit', submitListener);
  form.addEventListener('input', inputListener);

  return {
    get state() {
      return state;
    },

    reset,

    destroy() {
      form.removeEventListener('submit', submitListener);
      form.removeEventListener('input', inputListener);
      if (abortController) abortController.abort();
      reset();
    },
  };
}
