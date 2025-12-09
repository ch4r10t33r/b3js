import { hash, createHasher } from './blake3';

function benchmark(name: string, fn: () => void, iterations: number = 1000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const total = end - start;
  const avg = total / iterations;
  console.log(`${name}: ${total.toFixed(2)}ms total, ${avg.toFixed(4)}ms per operation (${iterations} iterations)`);
}

console.log('BLAKE3 Performance Benchmark\n');

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

console.log('\nBenchmark complete!');

