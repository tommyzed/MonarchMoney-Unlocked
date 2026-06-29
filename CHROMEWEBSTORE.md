# Chrome Web Store Listing — Monarch Money: Unlocked

> Last Updated: 2026-06-29

## Store Listing

**Extension Name**
Monarch Money: Unlocked

**Short Description**
Makes transaction note URLs clickable, remembers dashboard timeframe preferences, and defaults transactions to view all.

**Detailed Description**
Enables clickable URLs from transaction notes, sticky date-range selection for Monarch Money dashboards, and automatically redirects Monarch transaction lists to show all transactions.

Key Features:
- Links in Notes: Scans transaction notes for URLs and displays them as clickable links that open in a new tab. Updates live as you type.
- Auto-Select Timeframe: Automatically switches the dashboard date-range to your preferred view (e.g. Year to Date) on page load.
- Default to All Transactions: Intercepts views of the transactions page and automatically appends the visibility parameter to show all transactions by default.
- Settings Popup: Easily toggle any of the features ON or OFF using the extension settings menu in your toolbar.

This extension runs completely locally in your browser. It does not collect any account data, makes no network requests, and contains no analytics.

**Category**
Productivity

**Single Purpose**
Enables helpful usability features on the Monarch Money platform.

**Primary Language**
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | icons/icon128.png |
| Screenshot 1 | 1280×800 | ⬜ Not created | |

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Required to save user choices for links, timeframe, and visibility redirect settings locally. |
| `webNavigation` | permissions | Required to intercept direct navigation requests to the Monarch Money transactions page in order to append the visibility query parameter before the page loads. |
| `tabs` | permissions | Required to update the URL of the tab when performing the transaction visibility query parameter redirection. |
| `https://app.monarch.com/*` | host_permissions | Required to run content scripts on Monarch Money pages to rewrite URLs, read note text for link injection, and automatically select the dashboard timeframe. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 2.4.0 | 2026-06-29 | Added All Transactions Visibility toggle, merging MonarchMoney-Visibility functionality. Added background script with `webNavigation` and `tabs` permissions for robust direct-url redirection. | Draft |
| 2.2.0 | 2026-06-28 | Previous release with note links extraction and timeframe auto-select. | Published |
