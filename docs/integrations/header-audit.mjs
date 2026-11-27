/** Serializable browser check. Pass explicit legacy global-header selectors per app.
 * Page-specific headings are deliberately not counted. No text or URL values are returned. */
export function auditGlobalHeader(options = {}) {
  const { expectedCount = 1, legacySelectors = [], requiredItems = [], forbiddenActions = [], checkOverflow = true } = options;
  const problems = [];
  const selector = ['[data-nt-header]', ...legacySelectors].join(',');
  const roots = Array.from(document.querySelectorAll(selector));
  if (roots.length !== expectedCount) problems.push('global-header-count');
  const ids = new Map();
  for (const el of document.querySelectorAll('[id]')) ids.set(el.id, (ids.get(el.id) || 0) + 1);
  const scopes = new Set(roots);
  for (const root of roots) {
    if (root.matches('[data-nt-header]')) {
      const mobile = document.getElementById(root.id + '-mobile');
      const backdrop = document.getElementById(root.id + '-backdrop');
      if (!mobile?.matches('[data-nt-header-mobile]') || !backdrop) problems.push('missing-drawer-parts');
      if (mobile) scopes.add(mobile);
      if (backdrop) scopes.add(backdrop);
    }
    if (checkOverflow && root.getClientRects().length && root.scrollWidth > root.clientWidth + 1) problems.push('header-overflow');
  }
  for (const scope of scopes) {
    for (const el of [scope, ...scope.querySelectorAll('[id]')]) {
      if (el.id && ids.get(el.id) !== 1) problems.push('duplicate-header-id');
    }
    for (const el of [scope, ...scope.querySelectorAll('[aria-controls], [aria-labelledby], [aria-describedby]')]) {
      for (const attribute of ['aria-controls', 'aria-labelledby', 'aria-describedby']) {
        const refs = (el.getAttribute(attribute) || '').trim().split(/\s+/).filter(Boolean);
        if (refs.some(id => ids.get(id) !== 1)) problems.push('invalid-aria-reference');
      }
    }
  }
  const entries = Array.from(scopes).flatMap(scope => Array.from(scope.querySelectorAll('[data-nt-header-item]')));
  if (requiredItems.some(id => !entries.some(el => el.dataset.ntHeaderItem === id))) problems.push('required-item-missing');
  if (forbiddenActions.some(action => entries.some(el => el.dataset.ntHeaderAction === action))) problems.push('forbidden-action-present');
  return { count: roots.length, unifiedCount: roots.filter(root => root.matches('[data-nt-header]')).length, problems: [...new Set(problems)] };
}
