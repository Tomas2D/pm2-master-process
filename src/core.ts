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

function getProcessId(process: ProcessDescription): number | null {
  const processId = Number(process.pm_id ?? (process.pm2_env as any)?.pm_id);
  return Number.isNaN(processId) ? null : processId;
}

export function getCurrentProcessId(): number | null {
  const processId = Number(process.env.pm_id);
  return Number.isNaN(processId) ? null : processId;
}

export async function getProcesses({ instanceStatus = [] }: Pick<Pm2MasterProcessConfig, 'instanceStatus'> = Config): Promise<ProcessDescription[]> {
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

export async function getProcessesIds(customConfig: Partial<Pm2MasterProcessConfig> = Config): Promise<number[]> {
  const config: Pm2MasterProcessConfig = fixConfig(customConfig);

  const curProcessId = getCurrentProcessId();
  if (curProcessId === null) {
    config.logger.warn('Not running in PM2.');
    return [];
  }

  const processes = await getProcesses(config)

  if (processes.length === 0) {
    return [curProcessId]
  }

  return processes
    .map(getProcessId)
    .filter((id): id is number => id !== null);
}

export async function getMasterProcessId(customConfig: Partial<Pm2MasterProcessConfig> = Config): Promise<number | null> {
  const config: Pm2MasterProcessConfig = fixConfig(customConfig);
  const processesIds: number[] = await getProcessesIds(config);

  // Not PM2
  if (processesIds.length === 0) {
    return null;
  }

  // Cluster mode
  return Math.min(...processesIds)
}

export async function isMasterProcess(customConfig: Partial<Pm2MasterProcessConfig> = Config): Promise<boolean> {
  const curId: number | null = getCurrentProcessId();

  if (curId === null) {
    return true;
  }

  const masterId = await getMasterProcessId(customConfig)
  return curId === masterId;
}

export async function getSlavesCount(customConfig: Partial<Pm2MasterProcessConfig> = Config): Promise<number> {
  const config: Pm2MasterProcessConfig = fixConfig(customConfig);

  const processes = await getProcessesIds(config);
  return Math.max(0, processes.length - 1)
}
