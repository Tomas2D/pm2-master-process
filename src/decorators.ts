import { isMasterProcess } from './core';
import { Pm2MasterProcessConfig } from './types';
import { Config } from './config';

export const MasterInstance =
  (config: Partial<Pm2MasterProcessConfig> = Config) =>
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;

      descriptor.value = async function (...args: unknown[]) {
        if (!(await isMasterProcess(config))) {
          return;
        }

        method.apply(this, args);
      };
    };

export const NotMasterInstance =
  (config: Partial<Pm2MasterProcessConfig> = Config) =>
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;

      descriptor.value = async function (...args: unknown[]) {
        if ((await isMasterProcess(config))) {
          return;
        }

        method.apply(this, args);
      };
    };
