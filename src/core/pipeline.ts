/**
 * Pipeline Pattern - Traitement fonctionnel en chaine
 * Style personnel: utilisation de transformations composables
 */

import type { Result } from '../types/index.js'

type Transform<T, U> = (input: T) => Result<U, string>
type AsyncTransform<T, U> = (input: T) => Promise<Result<U, string>>

export class Pipeline<T> {
  constructor(private readonly value: Result<T, string>) {}

  static from<T>(value: T): Pipeline<T> {
    return new Pipeline({ success: true, data: value })
  }

  static fromResult<T>(result: Result<T, string>): Pipeline<T> {
    return new Pipeline(result)
  }

  pipe<U>(transform: Transform<T, U>): Pipeline<U> {
    if (!this.value.success) {
      return new Pipeline(this.value as Result<U, string>)
    }
    return new Pipeline(transform(this.value.data))
  }

  async pipeAsync<U>(transform: AsyncTransform<T, U>): Promise<Pipeline<U>> {
    if (!this.value.success) {
      return new Pipeline(this.value as Result<U, string>)
    }
    const result = await transform(this.value.data)
    return new Pipeline(result)
  }

  onSuccess<U>(fn: (value: T) => U): Pipeline<T> {
    if (this.value.success) {
      fn(this.value.data)
    }
    return this
  }

  onError(fn: (error: string) => void): Pipeline<T> {
    if (!this.value.success) {
      fn(this.value.error)
    }
    return this
  }

  unwrap(): Result<T, string> {
    return this.value
  }

  unwrapOrThrow(): T {
    if (!this.value.success) {
      throw new Error(this.value.error)
    }
    return this.value.data
  }

  unwrapOr(defaultValue: T): T {
    return this.value.success ? this.value.data : defaultValue
  }
}

// Helpers pour creer des transformations reutilisables
export const createTransform = <T, U>(
  fn: (input: T) => U,
  errorMessage = 'Transform failed'
): Transform<T, U> => {
  return (input: T): Result<U, string> => {
    try {
      const result = fn(input)
      return { success: true, data: result }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : errorMessage 
      }
    }
  }
}

export const createAsyncTransform = <T, U>(
  fn: (input: T) => Promise<U>,
  errorMessage = 'Async transform failed'
): AsyncTransform<T, U> => {
  return async (input: T): Promise<Result<U, string>> => {
    try {
      const result = await fn(input)
      return { success: true, data: result }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : errorMessage 
      }
    }
  }
}