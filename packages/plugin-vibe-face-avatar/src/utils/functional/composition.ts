/**
 * Functional composition utilities
 */

export const pipe =
  <T>(...fns: Function[]) =>
  (x: T) =>
    fns.reduce((v, f) => f(v), x);

export const flow =
  (...fns: Function[]) =>
  (x: any) =>
    fns.reduce((v, f) => f(v), x);

export const chain =
  <T, U>(f: (x: T) => U) =>
  (x: any) => {
    return x && typeof x.chain === "function" ? x.chain(f) : f(x);
  };

export const map =
  <T, U>(f: (x: T) => U) =>
  (x: any) => {
    return x && typeof x.map === "function" ? x.map(f) : f(x);
  };

export const tap =
  <T>(f: (x: T) => void) =>
  (x: T) => {
    f(x);
    return x;
  };
