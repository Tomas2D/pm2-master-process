import { ProcessDescription } from 'pm2';

export type ProcessStatus = Exclude<Required<ProcessDescription>['pm2_env']['status'], undefined>

export type ConfigType = {
  instanceStatus: ProcessStatus[],
  logger: {
    log: (msg: any) => void,
    error: (msg: any) => void,
    warn: (msg: any) => void,
  },
};

export type AnyFn = (...data: unknown[]) => unknown;

export type Pm2MasterProcessConfig = ConfigType & {
  logger: false | Record<keyof ConfigType['logger'], AnyFn>;
};
