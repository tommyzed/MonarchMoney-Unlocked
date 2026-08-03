const array1 = ["https://example.com/1", "https://example.com/2", "https://example.com/3"];
const array2 = ["https://example.com/1", "https://example.com/2", "https://example.com/3"];
const array3 = ["https://example.com/1", "https://example.com/2", "https://example.com/4"];

function arraysEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const ITERATIONS = 10_000_000;

console.time('baseline_join_equal');
for (let i = 0; i < ITERATIONS; i++) {
  const isEqual = (array1 || []).join(',') === (array2 || []).join(',');
}
console.timeEnd('baseline_join_equal');

console.time('optimized_loop_equal');
for (let i = 0; i < ITERATIONS; i++) {
  const isEqual = arraysEqual(array1, array2);
}
console.timeEnd('optimized_loop_equal');

console.time('baseline_join_unequal');
for (let i = 0; i < ITERATIONS; i++) {
  const isEqual = (array1 || []).join(',') === (array3 || []).join(',');
}
console.timeEnd('baseline_join_unequal');

console.time('optimized_loop_unequal');
for (let i = 0; i < ITERATIONS; i++) {
  const isEqual = arraysEqual(array1, array3);
}
console.timeEnd('optimized_loop_unequal');
