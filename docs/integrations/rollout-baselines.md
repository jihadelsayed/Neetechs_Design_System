# Unified header rollout baselines — 2026-11-27

Repository-source inventory, not a deployment inventory. The GitHub name search returned 46 Neetechs-named repositories. The main snapshots below are exact commit SHAs observed via the connector; fetch again before modifying any consumer. No app was activated in this pass.

| Repository | Observed main commit |
|---|---|
| Neetechs_Design_System | a12d3aa7068b46a9b0615782764812d85913f910 |
| Neetechs_Myaccount | b9c62fd9ba83f4c9d4c9ca28b5a350f51334e7ac |
| Neetechs_Frontend | 4dccf2f40d13c087000e58d60afc83b1582b76ad |
| Neetechs_Apply | 23bca63af875d4c586bf622e33ede7e5c3535b07 |
| Neetechs_Accounts | 98c61553a81a0dfa74b079456e3418113aeee279 |
| Neetechs_Billing | 6122ab4762093d038659b87c1c317badc0c52a77 |
| Neetechs_Tools | b87f446833cbdb1b6284544f946bcc2a6dca4a77 |
| Neetechs_Companies | 8ea340e73ffea834cc8daeb1d29a4a5f622de5d2 |
| Neetechs_Calendar | 1050dfaa8ff830c6fa50de4f858ca1b3a04b2f78 |
| Neetechs_Resume | 39dc438db139e75cf0dda97357c5b23ce73b2ab4 |
| Neetechs_AI | edcf56cc7a3e11f2ab606e29ad45dbc0846abcc7 |
| Neetechs_Phone | 2beb8f768b57f0d249191a4765ca037757c738df |
| Neetechs_Data | a1b1392710273cf20ab5cfae0fbb30bb6f9c21ab |
| Neetechs_Vault | 9525ac686f12203fa1537a648d1cd31c220a20ef |
| Neetechs_BrandKit | eabd35e994c95693c6966494b0a68f4bea42ec54 |
| Neetechs_Agent | c51b9433ac091361f4d1b44052a1a23106c0cd5f |
| Neetechs_ticket | 39c717b4cc16d26e50bb946d8b330125714e6b0d |
| Neetechs_Boost | bc3d87cf6f43126d0e8ce00cd05b451613eeda8c |
| Neetechs_DaySlice | c869a9134aa1e35283c07c336be0486b9756704e |
| Neetechs_Proof | 8a9f2ab2d9f0e4c5cfbefaa538fbaf6d87835067 |
| Neetechs_devices | aa2ca745a1c9296ef32d382a26157dcd48297c39 |
| Neetechs_Policies | c26604e8e9c5c944574da51b368b18033778e9e7 |
| Neetechs_Tracker | 7b02689ea5f2ce993a05f5560e7a52052116f95d |

## Additional scope decisions (provisional)

- Neetechs_fix (70ebfcb): Ionic/Capacitor Angular app, root ion-app with app-sidebar, app-navbar, ion-router-outlet, FAB and app-tabs. Web build output www. Not a standard Angular site shell; defer until browser deployment and native-shell requirements are confirmed. No UI dependency.
- Neetechs_Sanity (123e0c0): nested Sanity 4.20/React 19 studio. Custom Navbar wraps Sanity's renderDefault and optionally adds Shopify Admin link. Treat as studio chrome rather than replace with a site header.
- Neetechs_react (8722f7e): nested client CRA React 18.1/TypeScript 4.6.3; umbrella README calls it alternate/experimental. Confirm whether deployed before migrating.
- Neetechs_MVC (12923fe): umbrella README labels legacy optional MVC. No current browser deployment confirmed; exclude provisionally.
- Neetechs_trading (87ee5b3): Python research/CLI with optional Streamlit dashboard, not a standard Angular/React web shell. Preserve dashboard and trading controls.
- Neetechs_Restaurant (ccf62ec), Neetechs_Mobile (30bd49a), Neetechs_Tracker: README-only evidence and no root package.json. Do not infer a live browser frontend or modify them.
- Neetechs umbrella README describes the modular ecosystem; no independent root package found. Auth_System is a package; fix_Backend is NestJS. Other backend, desktop, extensions, automation and chain projects are not browser site-header targets by default.

Active deployment status, all additional project scopes and legacy header audits remain unresolved. Do not mark deployment inventory complete. No Actions or backend changes.

## Evidence from current local recovery

GitHub clone still fails DNS. Exact recovered MyAccount factory, mapper and locale helper blobs match the known main SHA values 12c276321b878091618a77e4a38b70ac4edfde57, 0a7d096824af40779fc220327340796216c6b193 and cda6bdc6796086cab4b9c65ca0dd0ff8f3bf30b5. Re-ran the seven combined configuration/renderer Node tests (7/7 passed, 54 combinations). Step 62 is complete at the staged configuration-source level; actual Angular integration remains open. Current core controller blob 085d0ede9ecb45ff0461c6818f2d728bf997d26e matched locally; re-ran 27/27 core unit tests and 6/6 isolated focus-update Chromium scenarios. Full package, CSS, Angular and deployment gates remain open.
