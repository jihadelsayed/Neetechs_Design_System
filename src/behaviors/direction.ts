export type NtDirection = 'ltr' | 'rtl';

export interface NtInlineArrowKeys {
  previous: 'ArrowLeft' | 'ArrowRight';
  next: 'ArrowLeft' | 'ArrowRight';
}

function explicitDirection(element: Element | null): NtDirection | null {
  for (let current: Element | null = element; current; current = current.parentElement) {
    const value = current.getAttribute('dir')?.toLowerCase();
    if (value === 'ltr' || value === 'rtl') return value;
  }
  return null;
}

/** Resolves the nearest native direction without requiring window or layout reads. */
export function ntResolveDirection(
  element?: Element | null,
  fallback: NtDirection = 'ltr',
): NtDirection {
  const fromElement = explicitDirection(element ?? null);
  if (fromElement) return fromElement;

  const documentElement = element?.ownerDocument?.documentElement;
  const fromDocument = explicitDirection(documentElement ?? null);
  return fromDocument ?? fallback;
}

/** Maps visual inline movement while leaving vertical and text-editing keys untouched. */
export function ntGetInlineArrowKeys(element?: Element | null): NtInlineArrowKeys {
  return ntResolveDirection(element) === 'rtl'
    ? { previous: 'ArrowRight', next: 'ArrowLeft' }
    : { previous: 'ArrowLeft', next: 'ArrowRight' };
}
