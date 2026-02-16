export const hashStringToSeed = (input: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const createMulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

export const createSeededRandom = (seed: string) => {
  return createMulberry32(hashStringToSeed(seed));
};

export const randomInt = (rand: () => number, maxExclusive: number): number => {
  if (maxExclusive <= 1) return 0;
  return Math.floor(rand() * maxExclusive);
};

