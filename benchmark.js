const isDebugEnabled = () => false;
function debugLog(...args) {
  if (isDebugEnabled()) console.log(...args);
}

const options = Array.from({ length: 100 }, (_, i) => ({
  textContent: `Option ${i}`
}));

console.time('baseline');
for (let i = 0; i < 10000; i++) {
  debugLog('Target option not found. Labels:', [...options].map(o => o.textContent.trim()));
}
console.timeEnd('baseline');

console.time('optimized');
for (let i = 0; i < 10000; i++) {
  if (isDebugEnabled()) {
    debugLog('Target option not found. Labels:', [...options].map(o => o.textContent.trim()));
  }
}
console.timeEnd('optimized');
