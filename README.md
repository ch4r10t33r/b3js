# b3js

Fast and highly optimized pure JavaScript implementation of the BLAKE3 hash function.

## Installation

### Node.js / Bun

```bash
npm install b3js
# or
bun add b3js
```

### React / Browser

```bash
npm install b3js
# or
yarn add b3js
# or
pnpm add b3js
```

**Note for Node.js users:** If you're using Node.js directly (not a bundler), you'll need a TypeScript loader:
```bash
npm install -D tsx
npx tsx your-script.ts
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
console.log(digest); // Uint8Array(32)
```

### Keyed Hashing (MAC)

```typescript
import { keyedHash } from 'b3js';

const key = new Uint8Array(32).fill(0x42);
const mac = keyedHash(key, 'message');
console.log(mac); // Uint8Array(32)

// With custom output length
const longMac = keyedHash(key, 'message', 64);
console.log(longMac); // Uint8Array(64)
```

### Key Derivation (KDF)

```typescript
import { deriveKey } from 'b3js';

// Derive a 32-byte key
const key1 = deriveKey('context string', 'key material');
console.log(key1); // Uint8Array(32)

// Derive a key with custom length
const key2 = deriveKey('context string', 'key material', 64);
console.log(key2); // Uint8Array(64)

// Works with Uint8Array input
const material = new TextEncoder().encode('key material');
const key3 = deriveKey('context', material);
console.log(key3); // Uint8Array(32)
```

## API Reference

### `hash(input: Uint8Array | string, outLen?: number): Uint8Array`

Hash input and return digest. Default output length is 32 bytes.

**Parameters:**
- `input`: Input data as string or Uint8Array
- `outLen`: Optional output length in bytes (default: 32)

**Returns:** `Uint8Array` containing the hash

**Example:**
```typescript
const h1 = hash('hello world');
const h2 = hash('hello world', 64);
const h3 = hash(new Uint8Array([1, 2, 3]));
```

### `keyedHash(key: Uint8Array, input: Uint8Array | string, outLen?: number): Uint8Array`

Compute keyed hash (MAC). Key must be exactly 32 bytes.

**Parameters:**
- `key`: 32-byte key as Uint8Array
- `input`: Input data as string or Uint8Array
- `outLen`: Optional output length in bytes (default: 32)

**Returns:** `Uint8Array` containing the keyed hash

**Example:**
```typescript
const key = new Uint8Array(32).fill(0x42);
const mac = keyedHash(key, 'message');
```

### `deriveKey(context: string, keyMaterial: Uint8Array | string, outLen?: number): Uint8Array`

Derive key from context and key material.

**Parameters:**
- `context`: Context string
- `keyMaterial`: Key material as string or Uint8Array
- `outLen`: Optional output length in bytes (default: 32)

**Returns:** `Uint8Array` containing the derived key

**Example:**
```typescript
const key = deriveKey('my-app', 'user-password');
```

### `createHasher(key?: Uint8Array): Blake3Hasher`

Create a new hasher instance for incremental hashing.

**Parameters:**
- `key`: Optional 32-byte key for keyed hashing

**Returns:** `Blake3Hasher` instance

**Example:**
```typescript
// Regular hashing
const hasher = createHasher();
hasher.update('hello');
hasher.update(' world');
const digest = hasher.finalize();

// Keyed hashing
const key = new Uint8Array(32).fill(0x42);
const keyedHasher = createHasher(key);
keyedHasher.update('message');
const mac = keyedHasher.finalize();
```

#### `Blake3Hasher.update(input: Uint8Array | string): this`

Update hasher with new data. Returns `this` for method chaining.

**Example:**
```typescript
const hasher = createHasher();
hasher.update('hello').update(' ').update('world');
```

#### `Blake3Hasher.finalize(outLen?: number): Uint8Array`

Finalize and return hash.

**Parameters:**
- `outLen`: Optional output length in bytes (default: 32)

**Returns:** `Uint8Array` containing the hash

**Example:**
```typescript
const hasher = createHasher();
hasher.update('hello world');
const digest = hasher.finalize(); // 32 bytes
const longDigest = hasher.finalize(64); // 64 bytes
```

## Testing

```bash
bun test
```

## License

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
