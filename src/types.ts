import { Config } from './config';

export type AnyFn = (...data: unknown[]) => unknown;

export type Pm2MasterProcessConfig = typeof Config & {
  logger: false | Record<keyof typeof Config['logger'], AnyFn>;
};
