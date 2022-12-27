# 💻 🌍 pm2-master-process

When using [PM2](https://github.com/Unitech/pm2) (Process Manager) for managing your Node.js applications,
you will probably later need to run specific tasks only on a single instance (process). This small library solves
this problem and gives you simple API and method decorators that you can use.
Does this library help you? Do not forget to give it a ⭐️!

## ⭐️ Features

- Allow running specific tasks only on a single instance
- Supports PM2 restarts and scaling
- Decorators for easy use
- Retrieves number of slaves 

## 🚀 Installation

First you need to install this package and related `pm2` package.

```
yarn add pm2-master-process promise-based-task pm2
```
```
npm install pm2-master-process
```


Without any configuration, the environment variable which tells us the instance of the id is `pm_id`, which is automatically set by PM2.

## 🤘🏻 Usage

**Without custom configuration**

```typescript
import { isMasterInstance } from 'pm2-master-process'

if (await isMasterInstance()) {
  console.info(`I am master!`)
} else {
  console.info(`I am a slave.`)
}
```

**With custom configuration**
```typescript
import { isMasterInstance, Pm2MasterProcessConfig } from 'pm2-master-process'

const config: Partial<Pm2MasterProcessConfig> = {
  instanceIdStatus: ['online', 'launching'], // 'online' | 'stopping' | 'stopped' | 'launching' | 'errored' | 'one-launch-status', default is ['online'] 
  logger: false,
}

if (await isMasterInstance(config)) {
  console.info(`I am master!`)
} else {
  console.info(`I am a slave.`)
}
```

**Using decorators**

```typescript
import { MasterInstance, NotMasterInstance } from 'pm2-master-process';

class MyController {

  @Cron('0 0 0 * * *', {
    name: 'Validate FS',
  })
  @MasterInstance()
  runJob() {
    ...
  }

  @Cron('0 0 0 * * *', {
    name: 'Something else',
  })
  @NotMasterInstance()
  runDifferntJob() {
    ...
  }

}
```

### ✨ Feature functions

**Retrieve number of slaves**

```typescript
import { getSlavesCount } from 'pm2-master-process';

const slavesCount = await getSlavesCount()
```

**Retrieve processes and not just instances**

```typescript
import { getInstances } from 'pm2-master-process';

const instances = await getInstances()
```

### API


```typescript
declare function getCurrentProcessId(): number | null;

declare function getProcesses({ instanceStatus }?: Pick<Pm2MasterProcessConfig, 'instanceStatus'>): Promise<ProcessDescription[]>;
declare function getProcessesIds(customConfig?: Partial<Pm2MasterProcessConfig>): Promise<number[]>;

declare function isMasterProcess(customConfig?: Partial<Pm2MasterProcessConfig>): Promise<boolean>;
declare function getMasterProcessId(customConfig?: Partial<Pm2MasterProcessConfig>): Promise<number | null>;

declare function getSlavesCount(customConfig?: Partial<Pm2MasterProcessConfig>): Promise<number>;
```

## TODO

- [ ] Add tests
