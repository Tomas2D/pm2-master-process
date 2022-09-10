import type { ConfigType } from './types'

export const Config: ConfigType = {
  instanceIdPath: `NODE_APP_INSTANCE`,
  instanceStatus: ['online'],
  logger: {
    log: console.log,
    error: console.error,
    warn: console.warn,
  },
};
