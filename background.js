/**
 * MonarchMoney Plus — background.js
 * Intercepts direct navigations to Monarch transactions page and appends transactionVisibility=all_transactions.
 */

let cachedAllTransactionsEnabled = null;

// Initialize cache
chrome.storage.sync.get({ allTransactionsEnabled: true }, (settings) => {
  cachedAllTransactionsEnabled = settings.allTransactionsEnabled;
});

// Keep cache updated
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.allTransactionsEnabled) {
    cachedAllTransactionsEnabled = changes.allTransactionsEnabled.newValue ?? true;
  }
});

chrome.webNavigation.onBeforeNavigate.addListener(
  async function(details) {
    // Only process main frame navigations (not iframes)
    if (details.frameId !== 0) return;
    
    // Check settings from cache or storage
    let allTransactionsEnabled = cachedAllTransactionsEnabled;
    if (allTransactionsEnabled === null) {
      const settings = await new Promise((resolve) => {
        chrome.storage.sync.get({ allTransactionsEnabled: true }, resolve);
      });
      allTransactionsEnabled = settings.allTransactionsEnabled;
      cachedAllTransactionsEnabled = allTransactionsEnabled;
    }
    
    if (!allTransactionsEnabled) return;

    try {
      const url = new URL(details.url);
      
      // Check if we're on the transactions page
      if (url.pathname === '/transactions') {
        // Check if the parameter is already present
        if (!url.searchParams.has('transactionVisibility')) {
          // Add the parameter
          url.searchParams.set('transactionVisibility', 'all_transactions');
          
          // Redirect to the new URL
          await chrome.tabs.update(details.tabId, { url: url.toString() });
        }
      }
    } catch (e) {
      console.error('[MM-🔓] Error intercepting navigation:', e);
    }
  },
  {
    url: [
      {
        hostEquals: 'app.monarch.com',
        pathEquals: '/transactions'
      }
    ]
  }
);
