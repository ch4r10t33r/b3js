import { test, expect } from "bun:test";
import { hash, keyedHash, deriveKey, createHasher } from "./blake3";

test("hash empty input", () => {
  const result = hash("");
  expect(result.length).toBe(32);
  expect(result).toBeInstanceOf(Uint8Array);
});

test("hash short input", () => {
  const result = hash("hello");
  expect(result.length).toBe(32);
});

test("hash longer input", () => {
  const input = "a".repeat(1000);
  const result = hash(input);
  expect(result.length).toBe(32);
});

test("hash with custom output length", () => {
  const result = hash("test", 64);
  expect(result.length).toBe(64);
});

test("keyed hash", () => {
  const key = new Uint8Array(32).fill(0x42);
  const result = keyedHash(key, "test");
  expect(result.length).toBe(32);
});

test("derive key", () => {
  const result = deriveKey("test context", "key material");
  expect(result.length).toBe(32);
});

test("hasher update and finalize", () => {
  const hasher = createHasher();
  hasher.update("hello");
  hasher.update(" ");
  hasher.update("world");
  const result = hasher.finalize();
  expect(result.length).toBe(32);
  
  const expected = hash("hello world");
  expect(result).toEqual(expected);
});

test("hasher with Uint8Array input", () => {
  const input = new Uint8Array([1, 2, 3, 4, 5]);
  const result = hash(input);
  expect(result.length).toBe(32);
});

test("hash large input", () => {
  const input = new Uint8Array(10000).fill(0x42);
  const result = hash(input);
  expect(result.length).toBe(32);
});

