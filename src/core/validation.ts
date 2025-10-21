/**
 * Validation Engine - Systeme de validation compose et reutilisable
 * Style personnel: combinaison de validateurs avec accumulation d'erreurs
 */

import type { Result } from '../types/index.js'

type ValidationRule<T> = (value: T) => ValidationResult
type ValidationResult = { isValid: true } | { isValid: false; error: string }

export class Validator<T> {
  private rules: ValidationRule<T>[] = []

  static create<T>(): Validator<T> {
    return new Validator<T>()
  }

  addRule(rule: ValidationRule<T>): Validator<T> {
    this.rules.push(rule)
    return this
  }

  // Validateurs predefinis avec style personnel
  required(errorMessage = 'Value is required'): Validator<T> {
    return this.addRule((value: T) => {
      if (value === null || value === undefined || value === '') {
        return { isValid: false, error: errorMessage }
      }
      return { isValid: true }
    })
  }

  minLength(min: number, errorMessage?: string): Validator<T> {
    return this.addRule((value: T) => {
      const str = String(value)
      if (str.length < min) {
        return { 
          isValid: false, 
          error: errorMessage || `Minimum length is ${min}, got ${str.length}` 
        }
      }
      return { isValid: true }
    })
  }

  maxLength(max: number, errorMessage?: string): Validator<T> {
    return this.addRule((value: T) => {
      const str = String(value)
      if (str.length > max) {
        return { 
          isValid: false, 
          error: errorMessage || `Maximum length is ${max}, got ${str.length}` 
        }
      }
      return { isValid: true }
    })
  }

  email(errorMessage = 'Invalid email format'): Validator<T> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return this.addRule((value: T) => {
      const str = String(value)
      if (!emailRegex.test(str)) {
        return { isValid: false, error: errorMessage }
      }
      return { isValid: true }
    })
  }

  custom(predicate: (value: T) => boolean, errorMessage: string): Validator<T> {
    return this.addRule((value: T) => {
      if (!predicate(value)) {
        return { isValid: false, error: errorMessage }
      }
      return { isValid: true }
    })
  }

  validate(value: T): Result<T, string[]> {
    const errors: string[] = []
    
    for (const rule of this.rules) {
      const result = rule(value)
      if (!result.isValid) {
        errors.push(result.error)
      }
    }

    if (errors.length > 0) {
      return { success: false, error: errors }
    }

    return { success: true, data: value }
  }

  // Validation rapide qui retourne seulement la premiere erreur
  validateFast(value: T): Result<T, string> {
    for (const rule of this.rules) {
      const result = rule(value)
      if (!result.isValid) {
        return { success: false, error: result.error }
      }
    }

    return { success: true, data: value }
  }
}

// Schema de validation pour objets complexes
export class Schema<T extends Record<string, any>> {
  private validators: Partial<Record<keyof T, Validator<any>>> = {}

  static create<T extends Record<string, any>>(): Schema<T> {
    return new Schema<T>()
  }

  field<K extends keyof T>(key: K, validator: Validator<T[K]>): Schema<T> {
    this.validators[key] = validator
    return this
  }

  validate(obj: T): Result<T, Record<keyof T, string[]>> {
    const errors: Partial<Record<keyof T, string[]>> = {}
    let hasErrors = false

    for (const [key, validator] of Object.entries(this.validators)) {
      if (validator && obj[key] !== undefined) {
        const result = validator.validate(obj[key])
        if (!result.success) {
          errors[key as keyof T] = result.error
          hasErrors = true
        }
      }
    }

    if (hasErrors) {
      return { success: false, error: errors as Record<keyof T, string[]> }
    }

    return { success: true, data: obj }
  }
}