/**
 * Core Module - Architecture fonctionnelle moderne
 * Style personnel: patterns innovants pour une base solide
 */

export { Pipeline, createTransform, createAsyncTransform } from './pipeline.js'
export { Validator, Schema } from './validation.js'
export { EventBus, globalEventBus, type CreateEventMap } from './events.js'
export { logger, Logger, type LogLevel, type LogContext } from './logger.js'