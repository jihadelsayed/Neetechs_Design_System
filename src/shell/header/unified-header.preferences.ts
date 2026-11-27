import type { NtHeaderChoice, NtHeaderChoiceMenu } from './unified-header.types.js';

export interface NtHeaderPreferenceOptions {
  readonly label: string;
  readonly selectedId: string;
  /** Only choices supported by the host; labels and actions are application-owned. */
  readonly choices: readonly NtHeaderChoice[];
}

/** Never guesses a selected option or introduces unsupported themes/locales. */
export function ntCreateHeaderPreference(options: NtHeaderPreferenceOptions): NtHeaderChoiceMenu | undefined {
  if (!options.label.trim()) return undefined;
  const seen = new Set<string>();
  const choices = options.choices.filter(choice => {
    if (!choice.id.trim() || !choice.label.trim() || !choice.action.trim() || seen.has(choice.id)) return false;
    seen.add(choice.id);
    return true;
  }).map(choice => ({ ...choice }));
  if (!choices.length) return undefined;
  return { label: options.label, selectedId: choices.some(choice => choice.id === options.selectedId) ? options.selectedId : '', choices };
}
