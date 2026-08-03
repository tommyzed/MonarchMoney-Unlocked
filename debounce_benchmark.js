function extractUrls(text) {
  const URL_REGEX = /https?:\/\/[^\s<>"']+/g;
  return text.match(URL_REGEX) || [];
}

const mockTextareaValue = "This is a note with a link https://example.com and another http://test.com ".repeat(10);

function simulateTypingWithoutDebounce() {
  let calls = 0;
  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    const urls = extractUrls(mockTextareaValue);
    calls++;
  }
  const end = performance.now();
  console.log(`Without debounce: ${end - start} ms, ${calls} regex executions`);
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

async function simulateTypingWithDebounce() {
  let calls = 0;
  const debouncedExtract = debounce((text) => {
    const urls = extractUrls(text);
    calls++;
  }, 250);

  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    debouncedExtract(mockTextareaValue);
  }

  // Wait for the final debounced call
  return new Promise(resolve => {
    setTimeout(() => {
      const end = performance.now();
      // subtract the 250ms wait time for fairer comparison of work time, or just report total work time
      // The loop time itself is what we care about
      console.log(`With debounce loop complete, waiting for execution...`);
      console.log(`With debounce total work + execution time: ${end - start - 250} ms (approx), ${calls} regex executions`);
      resolve();
    }, 300);
  });
}

async function run() {
  simulateTypingWithoutDebounce();
  await simulateTypingWithDebounce();
}

run();
