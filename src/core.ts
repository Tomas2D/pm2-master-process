import pm2, { ProcessDescription } from 'pm2';
import { promisify } from 'util';
import { Config } from './config';
import { Pm2MasterProcessConfig } from './types';
import { fixConfig } from './utils';
import { Task } from 'promise-based-task'

const initConnection = (function() {
  let task: null | Task<void> = null

  return (): Promise<void> => {
    if (task) {
      return task
    }

    task = new Task<void>()

    pm2.connect(true, (err: unknown) => {
      if (err) {
        task?.reject(err);
        task = new Task<void>()
      } else {
        task?.resolve();
      }
    });

    return task
  }
})()

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

export async function getInstances({ instanceStatus = [] }: Pick<Pm2MasterProcessConfig, 'instanceStatus'> = Config): Promise<ProcessDescription[]> {
  // Connection to PM2 daemon is global
  await initConnection()

  const processes: ProcessDescription[] = await promisify(pm2.list).bind(pm2)();

  // Running in a fork mode
  if (processes.length === 0) {
    return [];
  }

  const curProcessId = getCurrentProcessId();
  const curProcess: ProcessDescription | undefined = processes.find(
    (process) => getProcessId(process) === curProcessId,
  );

  if (!curProcess?.name) {
    throw new Error(`Invalid instance name in pm2!`);
  }

  return processes
    .filter((process) => process.name === curProcess.name)
    .filter((process) => instanceStatus.length === 0 || instanceStatus.includes(process.pm2_env?.status!))
}

export async function getInstanceIds(customConfig: Partial<Pm2MasterProcessConfig> = Config): Promise<number[]> {
  const config: Pm2MasterProcessConfig = fixConfig(customConfig);

  const curInstanceId = getCurrentInstanceId(config);
  if (curInstanceId === null) {
    config.logger.warn('Not running in PM2.');
    return [];
  }

  const instances = await getInstances(config)

  if (instances.length === 0) {
    return [curInstanceId]
  }

  return instances
    .map((process) => getProcessInstanceId(process, config))
    .filter((id): id is number => id !== null);
}

export async function getMasterInstanceId(customConfig: Partial<Pm2MasterProcessConfig> = Config): Promise<number | null> {
  const config: Pm2MasterProcessConfig = fixConfig(customConfig);
  const instancesIds: number[] = await getInstanceIds(config);

  // Not PM2
  if (instancesIds.length === 0) {
    return null;
  }

  // Cluster mode
  return Math.min(...instancesIds)
}

export async function isMasterInstance(customConfig: Partial<Pm2MasterProcessConfig> = Config): Promise<boolean> {
  const curId: number | null = getCurrentInstanceId();

  if (curId === null) {
    return true;
  }

  const masterId = await getMasterInstanceId(customConfig)
  return curId === masterId;
}

export async function getSlavesCount(customConfig: Partial<Pm2MasterProcessConfig> = Config): Promise<number> {
  const config: Pm2MasterProcessConfig = fixConfig(customConfig);

  const instances = await getInstanceIds(config);
  return Math.max(0, instances.length - 1)
}
