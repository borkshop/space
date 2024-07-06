
export const churn = state => {
  // uint64_t s1 = s[0]
  let s1U = state[0];
  let s1L = state[1];
  // uint64_t s0 = s[1]
  const s0U = state[2];
  const s0L = state[3];

  // result = s0 + s1
  const sumL = (s0L >>> 0) + (s1L >>> 0);
  const high = (s0U + s1U + ((sumL / 2) >>> 31)) >>> 0;
  const low = sumL >>> 0;

  // s[0] = s0
  state[0] = s0U;
  state[1] = s0L;

  // - t1 = [0, 0]
  let t1U = 0;
  let t1L = 0;
  // - t2 = [0, 0]
  let t2U = 0;
  let t2L = 0;

  // s1 ^= s1 << 23;
  // :: t1 = s1 << 23
  const a1 = 23;
  const m1 = 0xffffffff << (32 - a1);
  t1U = (s1U << a1) | ((s1L & m1) >>> (32 - a1));
  t1L = s1L << a1;
  // :: s1 = s1 ^ t1
  s1U ^= t1U;
  s1L ^= t1L;

  // t1 = ( s1 ^ s0 ^ ( s1 >> 17 ) ^ ( s0 >> 26 ) )
  // :: t1 = s1 ^ s0
  t1U = s1U ^ s0U;
  t1L = s1L ^ s0L;
  // :: t2 = s1 >> 18
  const a2 = 18;
  const m2 = 0xffffffff >>> (32 - a2);
  t2U = s1U >>> a2;
  t2L = (s1L >>> a2) | ((s1U & m2) << (32 - a2));
  // :: t1 = t1 ^ t2
  t1U ^= t2U;
  t1L ^= t2L;
  // :: t2 = s0 >> 5
  const a3 = 5;
  const m3 = 0xffffffff >>> (32 - a3);
  t2U = s0U >>> a3;
  t2L = (s0L >>> a3) | ((s0U & m3) << (32 - a3));
  // :: t1 = t1 ^ t2
  t1U ^= t2U;
  t1L ^= t2L;

  // s[1] = t1
  state[2] = t1U;
  state[3] = t1L;

  return { high, low };
};

export const fold = (state, words) => {
  let j = 0;
  for (let i = 0; i < words.length; i += 1) {
    state[j] ^= words[i];
    j = (j + 1) & (4 - 1);
  }
};

export const random = state => {
  const { high, low } = churn(state);
  // Math.pow(2, -32) = 2.3283064365386963e-10
  // Math.pow(2, -52) = 2.220446049250313e-16
  return high * 2.3283064365386963e-10 + (low >>> 12) * 2.220446049250313e-16;
};
