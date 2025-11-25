/**
 * Result and TaskEither monad implementations
 */

export type Either<L, R> = Left<L> | Right<R>;

export class Left<L> {
  readonly _tag = 'Left';
  constructor(readonly value: L) {}
  
  isLeft(): this is Left<L> { return true; }
  isRight(): this is Right<never> { return false; }
  
  map<U>(_f: (r: never) => U): Either<L, U> { return this as any; }
  chain<U>(_f: (r: never) => Either<L, U>): Either<L, U> { return this as any; }
  match<U>(onLeft: (l: L) => U, _onRight: (r: never) => U): U { return onLeft(this.value); }
}

export class Right<R> {
  readonly _tag = 'Right';
  constructor(readonly value: R) {}
  
  isLeft(): this is Left<never> { return false; }
  isRight(): this is Right<R> { return true; }
  
  map<U>(f: (r: R) => U): Either<never, U> { return new Right(f(this.value)); }
  chain<L, U>(f: (r: R) => Either<L, U>): Either<L, U> { return f(this.value); }
  match<U>(_onLeft: (l: never) => U, onRight: (r: R) => U): U { return onRight(this.value); }
}

export const left = <L>(l: L): Either<L, never> => new Left(l);
export const right = <R>(r: R): Either<never, R> => new Right(r);

export type TaskEither<L, R> = () => Promise<Either<L, R>>;

export const taskRight = <R>(v: R): TaskEither<never, R> => async () => right(v);
export const taskLeft = <L>(v: L): TaskEither<L, never> => async () => left(v);

export const tryCatchAsync = <L, R>(
  f: () => Promise<R>,
  onRejected: (reason: unknown) => L
): TaskEither<L, R> => async () => {
  try {
    const v = await f();
    return right(v);
  } catch (e) {
    return left(onRejected(e));
  }
};

export const runTaskEither = async <L, R>(te: TaskEither<L, R>): Promise<Either<L, R>> => {
  return te();
};

// Combinators for TaskEither

export const map = <L, R, U>(f: (r: R) => U) => (te: TaskEither<L, R>): TaskEither<L, U> => async () => {
  const e = await te();
  return e.isLeft() ? e : right(f(e.value));
};

export const chain = <L, R, U>(f: (r: R) => TaskEither<L, U>) => (te: TaskEither<L, R>): TaskEither<L, U> => async () => {
  const e = await te();
  return e.isLeft() ? e : f(e.value)();
};

export const tap = <L, R>(f: (r: Either<L, R>) => void) => (te: TaskEither<L, R>): TaskEither<L, R> => async () => {
  const e = await te();
  f(e);
  return e;
};
