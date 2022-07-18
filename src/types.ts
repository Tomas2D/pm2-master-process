import { ProcessDescription } from 'pm2';

export type ProcessStatus = Exclude<Required<ProcessDescription>['pm2_env']['status'], undefined>

export type ConfigType = {
  instanceIdPath: string,
  instanceStatus: ProcessStatus[],
  logger: {
    log: (msg: any) => void,
    error: (msg: any) => void,
  },
};

export type AnyFn = (...data: unknown[]) => unknown;

export type Pm2MasterProcessConfig = ConfigType & {
  logger: false | Record<keyof ConfigType['logger'], AnyFn>;
};
