import type { ConfigType } from './types'

export const Config: ConfigType = {
  instanceStatus: ['online'],
  logger: {
    log: console.log,
    error: console.error,
    warn: console.warn,
  },
};
