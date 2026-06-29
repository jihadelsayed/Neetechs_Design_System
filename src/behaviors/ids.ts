let ntIdCounter = 0;

export function ntCreateId(prefix = 'nt'): string {
  ntIdCounter += 1;
  return `${prefix}-${ntIdCounter}`;
}

export function ntEnsureId(element: HTMLElement, prefix = 'nt'): string {
  const existingId = element.getAttribute('id');

  if (existingId) {
    return existingId;
  }

  const id = ntCreateId(prefix);
  element.setAttribute('id', id);
  return id;
}

export function ntSetAriaControls(
  trigger: HTMLElement,
  content: HTMLElement,
  prefix = 'nt-content',
): string {
  const contentId = ntEnsureId(content, prefix);
  trigger.setAttribute('aria-controls', contentId);
  return contentId;
}

export function ntSetAriaLabelledBy(
  target: HTMLElement,
  labelElement: HTMLElement,
  prefix = 'nt-label',
): string {
  const labelId = ntEnsureId(labelElement, prefix);
  target.setAttribute('aria-labelledby', labelId);
  return labelId;
}

export function ntSetAriaDescribedBy(
  target: HTMLElement,
  descriptionElement: HTMLElement,
  prefix = 'nt-description',
): string {
  const descriptionId = ntEnsureId(descriptionElement, prefix);
  target.setAttribute('aria-describedby', descriptionId);
  return descriptionId;
}