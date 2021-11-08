import pm2, { ProcessDescription } from 'pm2';
import { promisify } from 'util';
import { Config } from './config';
import { Pm2MasterProcessConfig } from './types';
import { fixConfig } from './utils';

function getProcessInstanceId(
  process: ProcessDescription,
  config: Pick<Pm2MasterProcessConfig, 'instanceIdPath'> = Config,
): number | null {
  const pm2_env = process?.pm2_env;
  if (!pm2_env) {
    return null;
  }
  const instanceId = Number(
    (pm2_env as ProcessDescription['pm2_env'] & Record<typeof config.instanceIdPath, string>)
      [config.instanceIdPath]
  );
  return isNaN(instanceId) ? null : instanceId;
}

export function getCurrentInstanceId(config: Pick<Pm2MasterProcessConfig, 'instanceIdPath'> = Config): number | null {
  const instanceId = Number(process.env[config.instanceIdPath] as string);
  return isNaN(instanceId) ? null : instanceId;
}

export async function getInstanceIds(customConfig: Partial<Pm2MasterProcessConfig> = Config): Promise<number[]> {
  const config: Pm2MasterProcessConfig = fixConfig(customConfig);

  const curInstanceId = getCurrentInstanceId(config);
  if (curInstanceId === null) {
    config.logger.error('Not running in PM2.');
    return [];
  }

  // Connection to PM2 daemon is global
  await new Promise((resolve, reject) => {
    pm2.connect(true, (err: unknown) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });

  const processes: ProcessDescription[] = await promisify(pm2.list).bind(pm2)();
  const curProcess: ProcessDescription | undefined = processes.find(
    (process) => getProcessInstanceId(process, config) === curInstanceId,
  );

  if (!curProcess?.name) {
    throw new Error(`Invalid instance name in pm2!`);
  }

  const processIds = processes
    .filter((process) => process.name === curProcess.name)
    .map((process) => getProcessInstanceId(process, config))
    .filter((id): id is number => id !== null);

  await pm2.disconnect();
  return processIds;
}

export async function isMasterInstance(customConfig: Partial<Pm2MasterProcessConfig> = Config): Promise<boolean> {
  const config: Pm2MasterProcessConfig = fixConfig(customConfig);

  const curId: number | null = getCurrentInstanceId(config);
  const instancesIds: number[] = await getInstanceIds(config);

  if (curId === null && instancesIds.length === 0) {
    config.logger.error('Not running in PM2.');
    return true;
  }

  return Math.min(...instancesIds) === curId;
}
