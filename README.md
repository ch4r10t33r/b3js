# b3js

Fast and highly optimized pure JavaScript implementation of the BLAKE3 hash function.

## Features

- 🚀 **Fast**: Optimized implementation using `Uint32Array` for efficient 32-bit operations
- 🌳 **Tree-structured**: Supports BLAKE3's tree hashing for potential parallelization
- 🔑 **Keyed hashing**: Support for keyed hashing (MAC)
- 🔐 **Key derivation**: Support for key derivation (KDF)
- 📏 **Variable output length**: Generate hashes of any length
- 💯 **Pure JavaScript**: No native dependencies, works everywhere

## Installation

```bash
bun install
```

## Usage

### Basic Hashing

```typescript
import { hash } from 'b3js';

// Hash a string
const digest = hash('hello world');
console.log(digest); // Uint8Array(32)

// Hash with custom output length
const longHash = hash('hello world', 64);
console.log(longHash); // Uint8Array(64)
```

### Streaming/Incremental Hashing

```typescript
import { createHasher } from 'b3js';

const hasher = createHasher();
hasher.update('hello');
hasher.update(' ');
hasher.update('world');
const digest = hasher.finalize();
```

### Keyed Hashing (MAC)

```typescript
import { keyedHash } from 'b3js';

const key = new Uint8Array(32).fill(0x42);
const mac = keyedHash(key, 'message');
```

### Key Derivation (KDF)

```typescript
import { deriveKey } from 'b3js';

const derivedKey = deriveKey('context string', 'key material');
```

## API

### `hash(input: Uint8Array | string, outLen?: number): Uint8Array`

Hash input and return digest. Default output length is 32 bytes.

### `keyedHash(key: Uint8Array, input: Uint8Array | string, outLen?: number): Uint8Array`

Compute keyed hash (MAC). Key must be exactly 32 bytes.

### `deriveKey(context: string, keyMaterial: Uint8Array | string, outLen?: number): Uint8Array`

Derive key from context and key material.

### `createHasher(key?: Uint8Array): Blake3Hasher`

Create a new hasher instance for incremental hashing.

#### `Blake3Hasher.update(input: Uint8Array | string): this`

Update hasher with new data.

#### `Blake3Hasher.finalize(outLen?: number): Uint8Array`

Finalize and return hash.

## Testing

```bash
bun test
```

## Performance

The implementation is optimized for performance using:
- `Uint32Array` for efficient 32-bit integer operations
- Minimal memory allocations
- Tree-structured hashing for potential parallelization

## License

MIT
