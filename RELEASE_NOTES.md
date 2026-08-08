# Release Notes — Monarch Money: Unlocked v2.5.0

## 🚀 What's New & Fixed in v2.5.0

### 🐛 Bug Fixes & Reliability
- **Fixed Links in Notes Detection:** Resolved an issue where transaction drawers with pre-rendered notes textareas were missed by the MutationObserver. Textareas are now immediately detected on drawer open.
- **Nested Container & Portal Support:** Expanded drawer discovery logic to locate transaction drawers rendered within nested portal wrappers or modal containers.
- **Initial State Scanning:** Added automatic initialization scanning when the content script loads, ensuring open drawers are populated immediately.
- **Light Theme Readability:** Fixed a styling issue where the "Links" label rendered white in light mode. Header labels now default to crisp `#18181b` in light mode and adapt cleanly to dark theme modes.
- **Layout Alignment & Spacing:** Inherited parent field wrapper classes on injected link sections, ensuring exact horizontal indentation matching native fields (`Type`, `Date`, `Category`) and normalized vertical spacing.
- **Resolved Debug Logging Error:** Replaced an undefined `isDebugEnabled()` reference with active setting checks, restoring proper error handling and console output when Debug Mode is enabled.

---

## ⚡ Performance & Security Enhancements

### 🏎️ Performance Optimizations
- **Textarea Input Debouncing:** Added input debouncing (250ms) to notes textareas to prevent regex URL parsing on every single keystroke.
- **Efficient Array Equality Checks:** Replaced `.join(',')` stringification with a fast shallow array comparison loop during typing to eliminate unnecessary memory allocations and GC pause overhead.
- **URL Parsing Guard Clauses:** Added early return checks to `modifyLink()` for non-transaction links to skip URL parsing on unneeded elements.
- **In-Memory Storage Sync Caching:** Cached `chrome.storage.sync` settings in background scripts with `chrome.storage.onChanged` synchronization to avoid synchronous storage queries on navigation.

### 🔒 Security Improvements
- **DOM XSS Protection:** Added protocol validation to sanitize `javascript:` scheme URLs during link modification.

---

*Thank you for using Monarch Money: Unlocked!*
