import type { Mock } from 'bun:test';

/**
 * `jest.Mocked<T>` equivalent (bun:test doesn't ship one): every method of `T`
 * becomes a `Mock`, and the result stays assignable to `T`.
 */
export type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? Mock<T[K]> : T[K];
} & T;
