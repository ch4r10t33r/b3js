export {
  Blake3Hasher,
  hash,
  keyedHash,
  deriveKey,
  createHasher,
} from './src/blake3';

export {
  initWASM,
  compress4x,
  hasSIMD,
} from './src/blake3-wasm';