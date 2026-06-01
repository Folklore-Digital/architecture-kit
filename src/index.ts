export {
  architectureConfigSchema,
  createDefaultConfig,
  SCHEMA_VERSION,
  type ArchitectureConfig,
  type ProjectType,
} from './config/schema.js';
export { loadConfig, CONFIG_FILENAME } from './config/loadConfig.js';
export { runInit } from './commands/init.js';
export { runValidate } from './commands/validate.js';
export { runDoctor } from './commands/doctor.js';
