/**
 * Simple seeded PRNG (mulberry32) for deterministic world generation.
 * Returns a function that produces values in [0, 1).
 */
export function createRng(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function pickRandom<T>(rng: () => number, array: readonly T[]): T {
  return array[Math.floor(rng() * array.length)]
}
