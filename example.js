const prefix = 'TransactionDrawer';

function hasPrefixClass(el) {
    return Array.from(el.classList).some(c => c.startsWith(prefix));
}

const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
        for (const { list, action } of [
            { list: m.removedNodes, action: 'removed' },
            { list: m.addedNodes, action: 'added' }
        ]) {
            for (const node of list) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                if (!hasPrefixClass(node)) continue;
                if (action === 'removed') {
                    closedownDrawer(node);
                    continue;
                }
                if (action === 'added') {
                    const found = node.querySelector('textarea[name="notes"], textarea[id^="notes-"]');
                    if (found) openDrawer(found, node);
                }
            }
        }
    }
});

observer.observe(document.body, { childList: true, subtree: false });

function closedownDrawer(transactionDrawerEl) {
    // drawer closing
}
function openDrawer(dataareaEl, transactionDrawerEl) {
    processNotes();
}