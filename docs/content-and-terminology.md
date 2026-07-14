# Content and terminology

The Neetechs voice and the canonical vocabulary for actions, states, and
messages. The design system documents rules and validates its own fixtures
(`npm run check:content`); applications own the final translated strings.
No production translations are hardcoded in components.

## Product voice

Direct, clear, calm, professional, specific, helpful, honest about system
state, focused on recovery. Avoid: marketing language in operational
workflows, jokes in errors, blaming users, vague technical language,
exclamation marks by default, fake certainty, human-like AI claims, "Oops",
"Uh-oh", and "Something went wrong" without useful context.

Context tuning: operational software is concise and factual; onboarding is
supportive but not childish; financial workflows are precise and
consequence-focused; security and permissions are clear and serious; Neenee
is conversational but transparent about actions, permissions, and
uncertainty.

## Terminology table

| Preferred | Meaning | Use | Do not use for | Notes |
| --- | --- | --- | --- | --- |
| Create | A new persistent object will exist | Create invoice, Create company | attaching existing items | Not "Add" or "New" as a verb |
| Add | Attach/insert an existing item into a collection or context | Add member, Add line item, Add attachment | making brand-new records | |
| Save changes | Persist edits to an existing object | Edit forms | creating (use Create X) | |
| Apply | A configuration/filter becomes active without a new record | Apply filters | persisting records | |
| Delete | The object itself is permanently removed | Delete invoice draft, Delete company | detaching relationships | Pairs with "cannot be undone" |
| Remove | Detach from a relationship; the object may live on | Remove member from company | permanent destruction | |
| Cancel | Abandon the current task without side effects | dialogs, forms | stopping a running job (use Stop/Cancel upload with the object) | Never styled as danger |
| Close | Dismiss a surface whose content has no pending decision | panels, viewers | abandoning unsaved work (use Cancel/Discard) | |
| Discard | Throw away entered but unsaved data | Discard draft | | Requires confirmation when data is nontrivial |
| Company | The tenant/organization unit across Neetechs | | "Organization", "Workspace" as synonyms | One product concept, one word |
| Member | A person belonging to a company | Add member | "User" in product UI | "User" stays in technical/dev contexts |
| AI connection | A configured AI provider credential | MyAccount → AI Connections | "Integration", developer API keys | Developer keys are "API keys" under Developer & Integrations |
| Sign in / Sign out | Session start/end | | "Login/Logout" as verbs | |
| Error vs. failure | Validation error = user-correctable; failure = system could not complete | "2 fields need attention" vs "Upload failed" | | Never blur the two |

Check actual product meaning before enforcing a term in an application; the
distinctions above are semantic, not stylistic.

## Action-label rules

Labels start with a verb, name the result, and match the confirmation
consequence.

Prefer: `Create invoice · Save changes · Send invitation · Retry upload ·
Disconnect provider · Delete company`

Avoid: `Submit · OK · Yes · No · Proceed · Execute · Confirm · Click here`

Generic labels are acceptable only when context makes the outcome
unmistakable; owned examples always use specific labels. Never build labels
by concatenating translated fragments — every label is one complete
translatable string.

## Validation messages

Explain what is wrong, where, and how to correct it. One message, one
problem.

Prefer:

```text
Enter an invoice number.
The due date must be on or after the invoice date.
Choose at least one company.
The file exceeds the 10 MB limit.
```

Avoid: `Invalid input · Error · Wrong value · Validation failed`

Never expose database field names or stack traces; don't blame the user;
"please" at most once. Server/system failures must read differently from
validation ("The invoice could not be saved because the connection was
lost" vs "Enter an invoice number"). Error codes may appear as support
detail, never as the only explanation. Security-sensitive errors reveal
nothing policy forbids.

## System errors

Human-readable summary first; expandable, copyable technical detail for
support; a recovery action wherever one exists (Retry, Reload, contact
path). Distinguish: temporary (retry likely helps), permission (ask an
administrator), and defect (report with reference).

## Empty states

State what is absent, why, and a useful next step. Four distinct categories
— never present one as another:

| Category | Example |
| --- | --- |
| First use | "No invoices yet — Create your first invoice to begin tracking sales." |
| No search results | "No invoices match “June hosting” — Try another search term." |
| No filtered results | "No overdue invoices match these filters — Clear one or more filters." |
| Permission-limited | "You cannot view invoices for this company — Ask a company administrator for billing access." |

No create action when the user lacks permission; never claim content does
not exist when it merely failed to load (that is an error state).

## Confirmations

Identify action, target, scope, consequence, reversibility:

```text
Delete "July hosting invoice"?

This permanently removes the draft invoice and its line items.
This action cannot be undone.

[Cancel] [Delete invoice]
```

The confirming button repeats the verb + object. Never "Are you sure?",
never danger language for harmless operations.

## Warnings

State the risk, the triggering condition, and the safest next action —
"This may cause problems" is not a warning.

## Success messages

Confirm the result without celebration: `Invoice created · Changes saved ·
Provider connected · Invitation sent · Upload completed`, optionally naming
the object ("“July hosting invoice” was created."). Success is announced
only after backend confirmation; routine success uses a toast *or* an inline
status, never both; no modals solely for success; no exclamation marks by
default.

## Permission messages

Say what is restricted, at what scope, and who can help: "Ask a company
administrator for billing access." Never dead-end without a path.

## Offline and maintenance

Offline: say what still works ("Cached records are still visible") and how
to recover ("Retry when the connection returns"). Maintenance: say what is
unavailable and, when known, until when. Both use the Prompt 8 content-state
categories.

## Billing language

Amounts always carry currency; state names are exact (draft, issued,
overdue, paid, voided); irreversible financial actions state the legal/
accounting consequence; reversal ≠ deletion; payment failure never implies
the invoice vanished.

## Security language

Serious and specific without revealing internals. Session expiry explains
what happened to unsaved work. Account-existence, lockout, and MFA copy
follows the application's security policy — the design system never forces
copy that leaks state.

## Neenee and AI language

Separate: answer · action taken · proposed action · result · warning ·
technical detail · suggested next actions. Distinguish "I found…",
"I propose…", "I am executing…", "Completed…". State uncertainty when
relevant. Never imply external access without a confirming tool/capability;
never claim "no access" when a Neetechs tool can do the task; never present
unavailable controls; never claim success before backend confirmation.
Ordinary answers are plain conversation; strong cards are reserved for
approvals, artifacts, and important results.

## Localization-safe contracts

Components accept complete content slots (heading, description, action
labels, status label, accessible label) and never assemble sentences from
`prefix + value + suffix`. Translation systems control variable placement,
plurals, gender, and word order; long translations and Arabic RTL must fit
(see the responsive and RTL docs). The package adds no translation
framework.

## Good and bad examples

| Bad | Good |
| --- | --- |
| Submit | Create invoice |
| Are you sure? | Delete "July hosting invoice"? This action cannot be undone. |
| Something went wrong | The invoice could not be saved because the connection was lost. Retry to send it again. |
| Invalid input | Enter a valid email address. |
| No data | No invoices match "June hosting". Try another search term. |
| Success! | Invoice created |

## Validation and review

`npm run check:content` scans repository-owned fixtures for the discouraged
labels/phrases above (file + line). A line containing `nt-content-allow`
(comment or attribute) is a reviewed exception for fixtures that
intentionally demonstrate bad copy. The check never scans consuming
applications or attempts grammar policing.

Review checklist:

- [ ] Every button names its result.
- [ ] Validation copy says what, where, how to fix.
- [ ] Empty state uses the correct category.
- [ ] Confirmations state target + consequence + reversibility.
- [ ] Success claimed only after confirmation, on one channel.
- [ ] No fragment concatenation; strings are complete and translatable.
- [ ] AI copy distinguishes found / proposed / executing / completed.
