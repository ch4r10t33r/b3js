import { hash, createHasher } from './blake3';

function benchmark(name: string, fn: () => void, iterations: number = 1000) {
  // Warmup
  for (let i = 0; i < Math.min(10, iterations); i++) {
    fn();
  }
  
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const total = end - start;
  const avg = total / iterations;
  const throughput = (iterations / total) * 1000; // ops/sec
  console.log(`${name.padEnd(30)} ${total.toFixed(2)}ms total, ${avg.toFixed(4)}ms/op, ${throughput.toFixed(0)} ops/sec`);
}

console.log('BLAKE3 Performance Benchmark (Optimized)\n');
console.log('Based on optimizations from: https://blog.fleek.network/post/fleek-network-blake3-case-study/\n');
console.log('Optimizations applied:');
console.log('  - Optimized g() function with local variables');
console.log('  - Better state management in compress()');
console.log('  - DataView for aligned byte-to-word conversion');
console.log('  - Reduced allocations in chunk processing');
console.log('  - Periodic stack merging for large inputs\n');
console.log('='.repeat(80));

// Small input
const smallInput = 'hello world';
benchmark('Small input (11 bytes)', () => {
  hash(smallInput);
}, 10000);

// Medium input
const mediumInput = 'a'.repeat(1000);
benchmark('Medium input (1KB)', () => {
  hash(mediumInput);
}, 1000);

// Large input
const largeInput = 'a'.repeat(100000);
benchmark('Large input (100KB)', () => {
  hash(largeInput);
}, 100);

// Very large input
const veryLargeInput = 'a'.repeat(1000000);
benchmark('Very large input (1MB)', () => {
  hash(veryLargeInput);
}, 10);

// Streaming
benchmark('Streaming (incremental)', () => {
  const hasher = createHasher();
  for (let i = 0; i < 100; i++) {
    hasher.update('chunk');
  }
  hasher.finalize();
}, 1000);

// Custom output length
benchmark('Custom output length (64 bytes)', () => {
  hash(smallInput, 64);
}, 10000);

console.log('='.repeat(80));
console.log('\nBenchmark complete!');
console.log('\nNote: Performance may vary based on:');
console.log('  - JavaScript engine (V8, SpiderMonkey, JavaScriptCore)');
console.log('  - CPU architecture (x86-64, ARM, Apple Silicon)');
console.log('  - Input size and alignment');
console.log('  - System load and thermal throttling');

