import { isMasterInstance } from './core';
import { Pm2MasterProcessConfig } from './types';

export const MasterInstance =
  (config?: Pm2MasterProcessConfig) =>
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;

      descriptor.value = async function (...args: unknown[]) {
        if (!(await isMasterInstance(config))) {
          return;
        }

        method.apply(this, args);
      };
    };

export const NotMasterInstance =
  (config?: Pm2MasterProcessConfig) =>
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;

      descriptor.value = async function (...args: unknown[]) {
        if ((await isMasterInstance(config))) {
          return;
        }

        method.apply(this, args);
      };
    };
