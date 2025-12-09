/**
 * BLAKE3 - Fast, optimized pure JavaScript implementation
 * 
 * BLAKE3 is a cryptographic hash function that provides:
 * - High performance through tree-structured hashing
 * - Keyed hashing (MAC)
 * - Key derivation (KDF)
 * - Variable output length
 * - Parallel processing support
 */

// BLAKE3 constants
const IV = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

const MSG_PERMUTATION = [
  2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8,
];

// Chunk size: 1024 bytes
const CHUNK_LEN = 1024;
// Block size: 64 bytes
const BLOCK_LEN = 64;
// Key length: 32 bytes
const KEY_LEN = 32;
// Output length: 32 bytes (default)
const OUT_LEN = 32;

// Flags
const CHUNK_START = 1 << 0;
const CHUNK_END = 1 << 1;
const PARENT = 1 << 2;
const ROOT = 1 << 3;
const KEYED_HASH = 1 << 4;
const DERIVE_KEY_CONTEXT = 1 << 5;
const DERIVE_KEY_MATERIAL = 1 << 6;

/**
 * Rotate right operation
 */
function rotr32(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

/**
 * G mixing function
 */
function g(
  state: Uint32Array,
  a: number,
  b: number,
  c: number,
  d: number,
  mx: number,
  my: number
): void {
  state[a] = (state[a] + state[b] + mx) >>> 0;
  state[d] = rotr32(state[d] ^ state[a], 16);
  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = rotr32(state[b] ^ state[c], 12);
  state[a] = (state[a] + state[b] + my) >>> 0;
  state[d] = rotr32(state[d] ^ state[a], 8);
  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = rotr32(state[b] ^ state[c], 7);
}

/**
 * Compress function - core of BLAKE3
 */
function compress(
  chainingValue: Uint32Array,
  blockWords: Uint32Array,
  counter: bigint,
  blockLen: number,
  flags: number
): Uint32Array {
  const state = new Uint32Array(16);
  
  // Initialize state
  state.set(chainingValue, 0);
  state.set(IV, 4);
  
  // Counter
  const counterLow = Number(counter & 0xffffffffn);
  const counterHigh = Number((counter >> 32n) & 0xffffffffn);
  state[12] = counterLow;
  state[13] = counterHigh;
  state[14] = blockLen;
  state[15] = flags;
  
  // Apply message permutation and mix
  for (let round = 0; round < 7; round++) {
    // Column round
    g(state, 0, 4, 8, 12, blockWords[MSG_PERMUTATION[0]], blockWords[MSG_PERMUTATION[1]]);
    g(state, 1, 5, 9, 13, blockWords[MSG_PERMUTATION[2]], blockWords[MSG_PERMUTATION[3]]);
    g(state, 2, 6, 10, 14, blockWords[MSG_PERMUTATION[4]], blockWords[MSG_PERMUTATION[5]]);
    g(state, 3, 7, 11, 15, blockWords[MSG_PERMUTATION[6]], blockWords[MSG_PERMUTATION[7]]);
    
    // Diagonal round
    g(state, 0, 5, 10, 15, blockWords[MSG_PERMUTATION[8]], blockWords[MSG_PERMUTATION[9]]);
    g(state, 1, 6, 11, 12, blockWords[MSG_PERMUTATION[10]], blockWords[MSG_PERMUTATION[11]]);
    g(state, 2, 7, 8, 13, blockWords[MSG_PERMUTATION[12]], blockWords[MSG_PERMUTATION[13]]);
    g(state, 3, 4, 9, 14, blockWords[MSG_PERMUTATION[14]], blockWords[MSG_PERMUTATION[15]]);
  }
  
  // Finalize
  for (let i = 0; i < 8; i++) {
    state[i] = (state[i] ^ state[i + 8]) >>> 0;
    state[i + 8] = (state[i + 8] ^ chainingValue[i]) >>> 0;
  }
  
  return state.slice(0, 8);
}

/**
 * Words from bytes (little-endian)
 */
function wordsFromBytes(bytes: Uint8Array): Uint32Array {
  const words = new Uint32Array(16);
  for (let i = 0; i < 16; i++) {
    const offset = i * 4;
    words[i] =
      bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24);
  }
  return words;
}

/**
 * Words to bytes (little-endian)
 */
function wordsToBytes(words: Uint32Array): Uint8Array {
  const bytes = new Uint8Array(words.length * 4);
  for (let i = 0; i < words.length; i++) {
    const offset = i * 4;
    bytes[offset] = words[i] & 0xff;
    bytes[offset + 1] = (words[i] >>> 8) & 0xff;
    bytes[offset + 2] = (words[i] >>> 16) & 0xff;
    bytes[offset + 3] = (words[i] >>> 24) & 0xff;
  }
  return bytes;
}

/**
 * First 8 words of IV
 */
function first8Words(): Uint32Array {
  return IV.slice(0, 8);
}

/**
 * Derive key from context (internal helper)
 */
function deriveKeyFromContext(key: Uint8Array, context: string): Uint32Array {
  const contextBytes = new TextEncoder().encode(context);
  const contextHasher = new Blake3Hasher(key, DERIVE_KEY_CONTEXT);
  contextHasher.update(contextBytes);
  const contextKey = contextHasher.finalize(KEY_LEN);
  
  return wordsFromBytes(contextKey.slice(0, KEY_LEN));
}

/**
 * Blake3Hasher - Main hasher class
 */
export class Blake3Hasher {
  private chainingValue: Uint32Array;
  private chunkCounter: bigint;
  private block: Uint8Array;
  private blockLen: number;
  private flags: number;
  private stack: Uint32Array[];
  private stackLen: number;

  constructor(key?: Uint8Array, flags: number = 0) {
    if (key) {
      if (key.length !== KEY_LEN) {
        throw new Error(`Key must be ${KEY_LEN} bytes`);
      }
      this.chainingValue = wordsFromBytes(key.slice(0, KEY_LEN));
      this.flags = flags | KEYED_HASH;
    } else {
      this.chainingValue = first8Words();
      this.flags = flags;
    }
    
    this.chunkCounter = 0n;
    this.block = new Uint8Array(BLOCK_LEN);
    this.blockLen = 0;
    this.stack = [];
    this.stackLen = 0;
  }

  /**
   * Update hasher with new data
   */
  update(input: Uint8Array | string): this {
    const data = typeof input === 'string' 
      ? new TextEncoder().encode(input) 
      : input;
    
    let offset = 0;
    
    while (offset < data.length) {
      // If we have a partial block, fill it
      if (this.blockLen > 0) {
        const want = BLOCK_LEN - this.blockLen;
        const take = Math.min(want, data.length - offset);
        this.block.set(data.slice(offset, offset + take), this.blockLen);
        this.blockLen += take;
        offset += take;
        
        if (this.blockLen === BLOCK_LEN) {
          this.compressBlock();
          this.blockLen = 0;
        }
      }
      
      // Process full chunks
      while (offset + CHUNK_LEN <= data.length) {
        const chunk = data.slice(offset, offset + CHUNK_LEN);
        this.compressChunk(chunk, this.chunkCounter);
        this.chunkCounter++;
        offset += CHUNK_LEN;
      }
      
      // Handle remaining data
      if (offset < data.length) {
        const remaining = data.length - offset;
        const want = Math.min(remaining, BLOCK_LEN - this.blockLen);
        this.block.set(data.slice(offset, offset + want), this.blockLen);
        this.blockLen += want;
        offset += want;
      }
    }
    
    return this;
  }

  /**
   * Compress a single block
   */
  private compressBlock(): void {
    const blockWords = wordsFromBytes(this.block);
    const flags = this.blockLen === BLOCK_LEN 
      ? this.flags 
      : this.flags | CHUNK_END;
    
    const counter = this.chunkCounter;
    const newCV = compress(
      this.chainingValue,
      blockWords,
      counter,
      this.blockLen,
      flags | (this.blockLen === BLOCK_LEN ? 0 : CHUNK_END)
    );
    
    this.chainingValue = newCV;
  }

  /**
   * Compress a full chunk
   */
  private compressChunk(chunk: Uint8Array, counter: bigint): void {
    let cv = this.chainingValue;
    let chunkFlags = this.flags | CHUNK_START;
    
    // Process blocks in chunk
    for (let i = 0; i < CHUNK_LEN; i += BLOCK_LEN) {
      const block = chunk.slice(i, i + BLOCK_LEN);
      const blockWords = wordsFromBytes(block);
      
      if (i + BLOCK_LEN === CHUNK_LEN) {
        chunkFlags |= CHUNK_END;
      }
      
      cv = compress(cv, blockWords, counter, BLOCK_LEN, chunkFlags);
      chunkFlags &= ~CHUNK_START; // Clear CHUNK_START after first block
    }
    
    // Add chunk output to stack
    this.addChunkChainingValue(cv);
  }

  /**
   * Add chunk chaining value to stack and merge if needed
   */
  private addChunkChainingValue(cv: Uint32Array): void {
    this.stack.push(cv);
    this.stackLen++;
    
    // Merge pairs while we have them
    while (this.stackLen > 1) {
      const right = this.stack[this.stackLen - 1]!;
      const left = this.stack[this.stackLen - 2]!;
      
      // Check if they're at the same level (power of 2 check)
      const leftLevel = this.getLevel(this.stackLen - 2);
      const rightLevel = this.getLevel(this.stackLen - 1);
      
      if (leftLevel !== rightLevel) {
        break;
      }
      
      // Merge them
      const parentCV = this.parentOutput(left, right);
      this.stack.pop();
      this.stack.pop();
      this.stack.push(parentCV);
      this.stackLen--;
    }
  }

  /**
   * Get level of stack entry (0-based)
   */
  private getLevel(index: number): number {
    // Count trailing zeros in binary representation
    let level = 0;
    let pos = index + 1;
    while (pos > 0 && (pos & 1) === 0) {
      level++;
      pos >>= 1;
    }
    return level;
  }

  /**
   * Parent output from two chaining values
   */
  private parentOutput(left: Uint32Array, right: Uint32Array): Uint32Array {
    const blockWords = new Uint32Array(16);
    blockWords.set(left, 0);
    blockWords.set(right, 8);
    
    const flags = this.flags | PARENT;
    const counter = 0n;
    
    // Parent nodes use the key/IV as chaining value
    const keyCV = this.chainingValue.slice(0, 8);
    
    return compress(keyCV, blockWords, counter, BLOCK_LEN, flags);
  }

  /**
   * Finalize and return hash
   */
  finalize(outLen: number = OUT_LEN): Uint8Array {
    // Compress any remaining block
    if (this.blockLen > 0) {
      const blockWords = wordsFromBytes(this.block.slice(0, this.blockLen));
      const flags = this.flags | (this.chunkCounter === 0n ? CHUNK_START : 0) | CHUNK_END;
      const cv = compress(
        this.chainingValue,
        blockWords,
        this.chunkCounter,
        this.blockLen,
        flags
      );
      
      // Add to stack
      this.addChunkChainingValue(cv);
      this.blockLen = 0;
    }
    
    // Handle empty input case - no chunks and no blocks
    if (this.chunkCounter === 0n && this.stackLen === 0) {
      // Empty input: compress a single empty block with CHUNK_START | CHUNK_END
      const blockWords = new Uint32Array(16);
      const flags = this.flags | CHUNK_START | CHUNK_END;
      const cv = compress(
        this.chainingValue,
        blockWords,
        0n,
        0,
        flags
      );
      
      // Root output - use cv as the root block
      const rootBlockWords = new Uint32Array(16);
      rootBlockWords.set(cv, 0);
      
      const rootOutput = compress(
        first8Words(),
        rootBlockWords,
        0n,
        BLOCK_LEN,
        this.flags | ROOT
      );
      
      return this.expandOutput(rootOutput, outLen);
    }
    
    // Merge all stack entries into a single root
    let rootCV = this.stack[0]!;
    
    for (let i = 1; i < this.stackLen; i++) {
      rootCV = this.parentOutput(rootCV, this.stack[i]!);
    }
    
    // Root output
    const rootBlockWords = new Uint32Array(16);
    rootBlockWords.set(rootCV, 0);
    
    const rootOutput = compress(
      first8Words(),
      rootBlockWords,
      0n,
      BLOCK_LEN,
      this.flags | ROOT
    );
    
    // Expand to desired output length
    return this.expandOutput(rootOutput, outLen);
  }

  /**
   * Expand output to desired length
   */
  private expandOutput(rootOutput: Uint32Array, outLen: number): Uint8Array {
    const output = new Uint8Array(outLen);
    const rootBytes = wordsToBytes(rootOutput);
    
    // First 32 bytes from root output
    const firstBlock = Math.min(OUT_LEN, outLen);
    output.set(rootBytes.slice(0, firstBlock), 0);
    
    if (outLen <= OUT_LEN) {
      return output;
    }
    
    // Generate additional blocks using counter mode
    let counter = 1n;
    let offset = OUT_LEN;
    
    while (offset < outLen) {
      const blockWords = new Uint32Array(16);
      blockWords.set(rootOutput, 0);
      
      const flags = this.flags | ROOT;
      const blockOutput = compress(
        first8Words(),
        blockWords,
        counter,
        BLOCK_LEN,
        flags
      );
      
      const blockBytes = wordsToBytes(blockOutput);
      const take = Math.min(OUT_LEN, outLen - offset);
      output.set(blockBytes.slice(0, take), offset);
      
      offset += take;
      counter++;
    }
    
    return output;
  }
}

/**
 * Hash input and return digest
 */
export function hash(input: Uint8Array | string, outLen: number = OUT_LEN): Uint8Array {
  const hasher = new Blake3Hasher();
  hasher.update(input);
  return hasher.finalize(outLen);
}

/**
 * Keyed hash (MAC)
 */
export function keyedHash(key: Uint8Array, input: Uint8Array | string, outLen: number = OUT_LEN): Uint8Array {
  const hasher = new Blake3Hasher(key, KEYED_HASH);
  hasher.update(input);
  return hasher.finalize(outLen);
}

/**
 * Derive key from context and key material
 */
export function deriveKey(context: string, keyMaterial: Uint8Array | string, outLen: number = OUT_LEN): Uint8Array {
  const material = typeof keyMaterial === 'string'
    ? new TextEncoder().encode(keyMaterial)
    : keyMaterial;
  
  // Derive key from context (using zero key as per BLAKE3 spec)
  const zeroKey = new Uint8Array(KEY_LEN);
  const contextKeyWords = deriveKeyFromContext(zeroKey, context);
  // Convert only the first 8 words (32 bytes) to bytes
  const contextKeyBytes = wordsToBytes(contextKeyWords.slice(0, 8));
  
  // Use derived key to hash key material
  const hasher = new Blake3Hasher(contextKeyBytes, DERIVE_KEY_MATERIAL);
  hasher.update(material);
  return hasher.finalize(outLen);
}

/**
 * Create a new hasher instance
 */
export function createHasher(key?: Uint8Array): Blake3Hasher {
  return new Blake3Hasher(key);
}

