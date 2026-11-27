# Unified header extensions

Use the closed `NtHeaderIcon` type for navigation entries and actions. The library renders decorative SVG; the visible label or accessible name remains the source of the control's meaning.

Use `NtHeaderConfig.slots.workspace` for a workspace group, and `slots.contextualActions` for additional links or actions. Both slots render in the desktop header and mobile drawer. Host apps provide permission-filtered data and existing action/routing callbacks. IDs must be stable and distinct across entries. No raw HTML, arbitrary SVG or embedded executable code is supported. Interactive framework-owned custom widget mounting is not part of this structured slot API; preserve existing widgets during migration when needed.

The current implementation retains existing shared z-index and motion roles. Test menu positioning, reduced motion, keyboard navigation, RTL and overlay stacking in the actual consuming app before removing its legacy header.
