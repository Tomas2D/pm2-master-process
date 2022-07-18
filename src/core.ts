import pm2, { ProcessDescription } from 'pm2';
import { promisify } from 'util';
import { Config } from './config';
import { Pm2MasterProcessConfig } from './types';
import { fixConfig } from './utils';

function getProcessInstanceId(
  process: ProcessDescription,
  config: Pick<Pm2MasterProcessConfig, 'instanceIdPath'> = Config,
): number | null {
  const pm2_env: ProcessDescription['pm2_env'] = process?.pm2_env;
  if (!pm2_env) {
    return null;
  }
  const instanceId = Number(pm2_env[config.instanceIdPath as keyof typeof pm2_env]);
  return Number.isNaN(instanceId) ? null : instanceId;
}

function getProcessId(process: ProcessDescription): number | null {
  return getProcessInstanceId(process, {
    instanceIdPath: 'pm_id'
  })
}

export function getCurrentInstanceId(config: Pick<Pm2MasterProcessConfig, 'instanceIdPath'> = Config): number | null {
  const instanceId = Number(process.env[config.instanceIdPath] as string);
  return Number.isNaN(instanceId) ? null : instanceId;
}

export function getCurrentProcessId(): number | null {
  return getCurrentInstanceId({
    instanceIdPath: 'pm_id'
  })
}

export async function getInstances(): Promise<ProcessDescription[]> {
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

  // Running in a fork mode
  if (processes.length === 0) {
    return [];
  }

  const curInstanceId = getCurrentProcessId();
  const curProcess: ProcessDescription | undefined = processes.find(
    (process) => getProcessId(process) === curInstanceId,
  );

  if (!curProcess?.name) {
    throw new Error(`Invalid instance name in pm2!`);
  }

  return processes.filter((process) => process.name === curProcess.name)
}

export async function getInstanceIds(customConfig: Partial<Pm2MasterProcessConfig> = Config): Promise<number[]> {
  const config: Pm2MasterProcessConfig = fixConfig(customConfig);

  const curInstanceId = getCurrentInstanceId(config);
  if (curInstanceId === null) {
    config.logger.error('Not running in PM2.');
    return [];
  }

  const instances = await getInstances()

  if (instances.length === 0) {
    return [curInstanceId]
  }

  return instances
    .map((process) => getProcessInstanceId(process, config))
    .filter((id): id is number => id !== null);
}

export async function isMasterInstance(customConfig: Partial<Pm2MasterProcessConfig> = Config): Promise<boolean> {
  const config: Pm2MasterProcessConfig = fixConfig(customConfig);

  const curId: number | null = getCurrentInstanceId(config);
  const instancesIds: number[] = await getInstanceIds(config);

  // Not PM2
  if (curId === null || instancesIds.length === 0) {
    return true;
  }

  // Cluster mode
  return Math.min(...instancesIds) === curId;
}

export async function getSlavesCount(customConfig: Partial<Pm2MasterProcessConfig> = Config): Promise<number> {
  const config: Pm2MasterProcessConfig = fixConfig(customConfig);

  const instances = await getInstanceIds(config);
  return Math.max(0, instances.length - 1)
}
