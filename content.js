/**
 * MonarchMoney Plus — content.js
 *
 * Features:
 * 1. Links — Extracts URLs from transaction Notes and injects clickable links.
 * 2. Net Worth Timeframe — Auto-selects a preferred date-range on the dashboard.
 *
 * Both features are gated by settings stored in chrome.storage.sync.
 */

// ---------------------------------------------------------------------------
// Settings (loaded from chrome.storage.sync, with defaults)
// ---------------------------------------------------------------------------

const SETTING_DEFAULTS = {
  linksEnabled: true,
  allTransactionsEnabled: true,
  timeframeEnabled: true,
  timeframeValue: 'Year to date',
  debugEnabled: false,
};

let settings = { ...SETTING_DEFAULTS };

/**
 * Logs to the console only when debugging is enabled via URL.
 */
function debugLog(...args) {
  if (settings.debugEnabled) console.log('[MM-🔓]', ...args);
}

/**
 * Load settings from chrome.storage.sync, then run the provided callback.
 */
function loadSettings(callback) {
  chrome.storage.sync.get(SETTING_DEFAULTS, (result) => {
    settings = result;
    debugLog('Settings loaded:', settings);
    if (callback) callback();
  });
}

// React to live setting changes (from the popup) without requiring a reload
chrome.storage.onChanged.addListener((changes) => {
  for (const key of Object.keys(changes)) {
    if (Object.prototype.hasOwnProperty.call(SETTING_DEFAULTS, key)) {
      settings[key] = changes[key].newValue;
    }
  }
  debugLog('Settings updated live:', settings);

  // If the timeframe feature was just enabled, kick it off immediately
  if (changes.timeframeEnabled?.newValue || changes.timeframeValue) {
    dropdownSelected = false;
    if (isDashboard() && settings.timeframeEnabled) {
      tryAutoSelectDropdown();
    }
  }
});

// ---------------------------------------------------------------------------
// Feature: Auto-select Net Worth Timeframe on the dashboard
// ---------------------------------------------------------------------------

let dropdownSelected = false;

/**
 * Returns true when the current page is the Monarch Money dashboard.
 */
function isDashboard() {
  return window.location.pathname === '/dashboard';
}

/**
 * Finds the react-select single-value element that shows the current
 * date-range selection (e.g. "3 months").
 * @returns {HTMLElement|null}
 */
function findSelectSingleValue() {
  return document.querySelector('.react-select__single-value');
}

/**
 * Helper to query for react-select menu options.
 * @param {HTMLElement} container - the react-select container element
 * @returns {NodeList} - a list of menu item elements
 */
function getMenuOptions(container) {
  const scopeRoot = container || document;
  const menu = scopeRoot.querySelector('.react-select__menu') ||
    document.querySelector('.react-select__menu');

  const searchRoot = menu || document;
  return searchRoot.querySelectorAll('[role="menuitem"]');
}

/**
 * Helper to close the react-select menu by dispatching an Escape keydown event.
 */
function closeMenu() {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

/**
 * Polls for the react-select menu options to render, then clicks the target option.
 * @param {HTMLElement} container - the react-select container element
 * @param {string} targetLabel - the label of the option to click
 */
function pollForOptionsAndSelect(container, targetLabel) {
  let pollCount = 0;
  const maxPolls = 20;
  const pollInterval = setInterval(() => {
    pollCount++;

    const options = getMenuOptions(container);

    if (options.length > 0) {
      clearInterval(pollInterval);
      for (const option of options) {
        if (option.textContent.trim() === targetLabel) {
          debugLog('Found target option, clicking:', option.textContent.trim());
          option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          option.click();
          dropdownSelected = true;
          return;
        }
      }
      if (settings.debugEnabled) {
        debugLog('Target option not found. Labels:', [...options].map(o => o.textContent.trim()));
      }
      closeMenu();
    } else if (pollCount >= maxPolls) {
      clearInterval(pollInterval);
      debugLog('Gave up waiting for menu options, closing');
      closeMenu();
    }
  }, 100);
}

/**
 * Clicks the react-select control to open the dropdown menu, then waits for
 * the menu to appear and clicks the target option.
 * @param {HTMLElement} singleValue - the .react-select__single-value element
 */
function selectTimeframe(singleValue) {
  const targetLabel = settings.timeframeValue;
  debugLog('selectTimeframe called, target:', targetLabel);

  // Walk up from the single-value to get the correct control for THIS dropdown
  const control = singleValue.closest('.react-select__control');
  if (!control) return false;

  // The react-select container (one level above the control) is used to scope
  // option lookups so we don't accidentally hit another dropdown's menu.
  const container = control.parentElement;

  // Open the menu
  control.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

  // Poll every 100ms (up to 2s) for the menu and options to render.
  pollForOptionsAndSelect(container, targetLabel);

  return true;
}

/**
 * Attempts to auto-select the target dropdown value.
 * Retries up to maxAttempts times with retryDelayMs between attempts.
 */
function tryAutoSelectDropdown(attempt = 0, maxAttempts = 20, retryDelayMs = 500) {
  if (dropdownSelected) return;
  if (!isDashboard()) return;
  if (!settings.timeframeEnabled) return;

  const singleValue = findSelectSingleValue();

  if (singleValue) {
    const currentLabel = singleValue.textContent.trim();
    if (currentLabel === settings.timeframeValue) {
      // Already correct — nothing to do
      dropdownSelected = true;
      return;
    }

    // Check if the control is still disabled (happens on initial page load)
    const control = singleValue.closest('.react-select__control');
    const isDisabled = control && control.classList.contains('react-select__control--is-disabled');
    if (isDisabled) {
      if (attempt < maxAttempts) {
        setTimeout(() => tryAutoSelectDropdown(attempt + 1, maxAttempts, retryDelayMs), retryDelayMs);
      }
      return;
    }

    // Attempt the selection
    selectTimeframe(singleValue);
    return;
  }

  // Dropdown not rendered yet — retry
  if (attempt < maxAttempts) {
    setTimeout(() => tryAutoSelectDropdown(attempt + 1, maxAttempts, retryDelayMs), retryDelayMs);
  }
}

// ---------------------------------------------------------------------------
// Feature: All Transactions Visibility
// ---------------------------------------------------------------------------

/**
 * Checks if the current URL is /transactions and automatically appends
 * the transactionVisibility=all_transactions parameter if missing.
 */
function checkAllTransactionsRedirect() {
  if (!settings.allTransactionsEnabled) return;

  if (window.location.pathname === '/transactions') {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('transactionVisibility')) {
      url.searchParams.set('transactionVisibility', 'all_transactions');
      debugLog('Redirecting to include transactionVisibility parameter:', url.toString());
      window.location.replace(url.toString());
    }
  }
}

/**
 * Modifies a single link element's href if it points to the transactions page
 * without the transactionVisibility query param.
 */
function modifyLink(link) {
  if (!settings.allTransactionsEnabled) return;
  if (!link || !link.href) return;
  if (!link.href.includes('/transactions')) return;

  try {
    const url = new URL(link.href, window.location.origin);
    if (url.protocol === 'javascript:') return;
    if (url.pathname === '/transactions' && !url.searchParams.has('transactionVisibility')) {
      url.searchParams.set('transactionVisibility', 'all_transactions');
      link.href = url.toString();
      debugLog('Updated link href to:', link.href);
    }
  } catch (e) {
    // Skip invalid URLs
  }
}

/**
 * Event listener for mouseover (delegated) to modify links on hover.
 */
function handleLinkHover(e) {
  const link = e.target.closest('a');
  if (link) {
    modifyLink(link);
  }
}

/**
 * Event listener for click (delegated) in capturing phase to intercept clicks.
 */
function handleLinkClick(e) {
  const link = e.target.closest('a');
  if (link) {
    modifyLink(link);
  }
}

/**
 * Set up listeners for hover/click link modification.
 */
function setupLinkVisibilityInterceptors() {
  document.addEventListener('mouseover', handleLinkHover);
  document.addEventListener('click', handleLinkClick, true);
}

// ---------------------------------------------------------------------------
// SPA navigation detection
// ---------------------------------------------------------------------------

/**
 * Called whenever the SPA navigates to a new URL.
 */
function onSpaNavigate() {
  if (isDashboard() && settings.timeframeEnabled) {
    dropdownSelected = false;
    tryAutoSelectDropdown();
  }
  checkAllTransactionsRedirect();
}

window.addEventListener('popstate', onSpaNavigate);

// URL polling — reliable fallback for SPA navigation detection
let _lastPathname = window.location.pathname;
setInterval(() => {
  const current = window.location.pathname;
  if (current !== _lastPathname) {
    _lastPathname = current;
    onSpaNavigate();
  }
}, 500);

// ---------------------------------------------------------------------------
// Feature: Links in Notes
// ---------------------------------------------------------------------------

const LINKS_SECTION_ID = 'mm-links-section';
const URL_REGEX = /https?:\/\/[^\s<>"']+/g;

const DRAWER_PREFIX = 'TransactionDrawer';

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function extractUrls(text) {
  return text ? (text.match(URL_REGEX) || []) : [];
}

function findNotesOuterWrapper(textarea) {
  if (!textarea) return null;
  const fieldContainer = textarea.closest('[class*="field" i], [class*="Field" i], [class*="formGroup" i], [class*="FormGroup" i]');
  if (fieldContainer && fieldContainer !== textarea) {
    return fieldContainer;
  }
  let el = textarea;
  for (let i = 0; i < 3; i++) {
    if (!el.parentElement) return null;
    el = el.parentElement;
  }
  return el;
}

function injectLinksSection(notesWrapper, urls) {
  const parent = notesWrapper.parentElement;
  if (!parent) {
    debugLog('Cannot inject links section: notesWrapper has no parent element');
    return;
  }

  const existing = document.getElementById(LINKS_SECTION_ID);
  if (existing) {
    existing.remove();
    debugLog('Removed existing links section');
  }

  if (urls.length === 0) {
    debugLog('No URLs extracted; no links section injected');
    return;
  }

  const section = document.createElement('div');
  section.id = LINKS_SECTION_ID;
  if (notesWrapper && notesWrapper.className) {
    section.className = notesWrapper.className;
  }

  const label = document.createElement('div');
  label.id = 'mm-links-label';
  label.textContent = 'Links';
  section.appendChild(label);

  const linksContainer = document.createElement('div');
  linksContainer.id = 'mm-links-container';

  urls.forEach((url) => {
    const a = document.createElement('a');
    a.href = url;
    a.textContent = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    linksContainer.appendChild(a);
  });

  section.appendChild(linksContainer);
  parent.insertBefore(section, notesWrapper);
  debugLog(`Successfully injected ${urls.length} link(s) into notes section:`, urls);
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Wires up the Links feature for a found textarea inside the drawer.
 */
function attachNotesLinks(textarea) {
  debugLog('Attaching notes links to textarea:', textarea);
  const notesWrapper = findNotesOuterWrapper(textarea);
  if (!notesWrapper) {
    debugLog('No notes wrapper found for textarea');
    return;
  }
  debugLog('Found notes wrapper:', notesWrapper);

  // Track the current URLs to prevent unnecessary DOM rebuilds
  let currentUrls = extractUrls(textarea.value);
  debugLog('Extracted initial URLs from notes:', currentUrls);

  // Inject links for whatever is already in the textarea
  injectLinksSection(notesWrapper, currentUrls);

  // Keep links in sync as the user types
  if (!textarea.dataset.mmLinksAttached) {
    textarea.dataset.mmLinksAttached = 'true';

    const debouncedInputHandler = debounce(() => {
      if (!settings.linksEnabled) return;

      const newUrls = extractUrls(textarea.value);
      debugLog('Debounced input triggered. Extracted URLs:', newUrls);
      // Only rebuild the DOM if the extracted URLs have changed
      if (!arraysEqual(currentUrls || [], newUrls || [])) {
        currentUrls = newUrls;
        const wrapper = findNotesOuterWrapper(textarea);
        if (wrapper) {
          debugLog('Updating links section with new URLs:', currentUrls);
          injectLinksSection(wrapper, currentUrls);
        }
      }
    }, 250);

    textarea.addEventListener('input', debouncedInputHandler);
  }
}

/**
 * Called when a TransactionDrawer node is added to the DOM.
 * React renders the drawer shell first, then its children asynchronously,
 * so we check if the textarea is already present, or observe until it appears.
 */
function onDrawerOpened(drawerEl) {
  if (!settings.linksEnabled) {
    debugLog('Links feature disabled in settings; skipping drawer setup.');
    return;
  }

  debugLog('TransactionDrawer opened:', drawerEl);

  const existingTextarea = drawerEl.querySelector('textarea[name="notes"], textarea[id^="notes-"], textarea[placeholder*="note" i]');
  if (existingTextarea) {
    debugLog('Textarea already rendered in drawer on open.');
    attachNotesLinks(existingTextarea);
    return;
  }

  // Wait for React to render the textarea inside the drawer if not already present.
  debugLog('Textarea not yet rendered in drawer. Observing drawer for children changes.');
  const inner = new MutationObserver(() => {
    const textarea = drawerEl.querySelector('textarea[name="notes"], textarea[id^="notes-"], textarea[placeholder*="note" i]');
    if (!textarea) return;
    inner.disconnect();
    debugLog('Textarea appeared in drawer via MutationObserver.');
    attachNotesLinks(textarea);
  });
  inner.observe(drawerEl, { childList: true, subtree: true });
}

/**
 * Called when a TransactionDrawer node is removed from the DOM.
 * Cleans up any injected Links section.
 */
function onDrawerClosed() {
  const existing = document.getElementById(LINKS_SECTION_ID);
  if (existing) existing.remove();
  debugLog('TransactionDrawer removed — links section cleaned up');
}

/**
 * Returns the TransactionDrawer element if node is or contains a drawer.
 */
function getDrawerElement(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return null;
  if (node.classList) {
    for (let i = 0; i < node.classList.length; i++) {
      if (node.classList[i].startsWith(DRAWER_PREFIX)) return node;
    }
  }
  if (node.querySelector) {
    return node.querySelector('[class*="' + DRAWER_PREFIX + '"]');
  }
  return null;
}

// ---------------------------------------------------------------------------
// Initialization — load settings first, then start everything
// ---------------------------------------------------------------------------

loadSettings(() => {
  // Check redirect on startup
  checkAllTransactionsRedirect();

  // Set up hover/click URL rewrite interceptors
  setupLinkVisibilityInterceptors();

  // Start the timeframe auto-select if on dashboard
  if (isDashboard() && settings.timeframeEnabled) {
    tryAutoSelectDropdown();
  }

  // Observer for TransactionDrawer nodes added or removed from DOM
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const node of m.removedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const drawer = getDrawerElement(node);
        if (drawer) {
          debugLog('TransactionDrawer removed from DOM');
          onDrawerClosed();
        }
      }
      for (const node of m.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const drawer = getDrawerElement(node);
        if (drawer) {
          debugLog('TransactionDrawer added to DOM:', drawer);
          onDrawerOpened(drawer);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial scan in case drawer is already in DOM on script load
  const existingDrawer = document.querySelector('[class*="' + DRAWER_PREFIX + '"]');
  if (existingDrawer) {
    debugLog('Existing TransactionDrawer found on initialization:', existingDrawer);
    onDrawerOpened(existingDrawer);
  }
});
