import { Pm2MasterProcessConfig } from './types';
import { Config as BaseConfig } from './config';

export function fixConfig(config: Partial<Pm2MasterProcessConfig>): Pm2MasterProcessConfig {
  if (config === BaseConfig) {
    return config as Pm2MasterProcessConfig;
  }

  const logger: Pm2MasterProcessConfig['logger'] = config?.logger === false ? {
    log: () => {},
    error: () => {},
  } : {
    ...BaseConfig.logger,
    ...(config?.logger || {}),
  }

  return {
    ...BaseConfig,
    ...config,
    logger,
  }
}
