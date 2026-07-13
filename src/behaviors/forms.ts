import { ntEnsureId } from './ids.js';

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
