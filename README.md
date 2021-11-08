# 💻 🌍 pm2-master-process

When using [PM2](https://github.com/Unitech/pm2) (Process Manager) for managing your Node.js applications,
you will probably later need to run specific tasks only on a single instance (process). This small library solves
this problem and gives you simple API and method decorators that you can use.
Does this library help you? Do not forget to give it a ⭐️!

## ⭐️ Features

- Allow running specific tasks only on a single instance
- Supports PM2 restarts and scaling
- Decorators for easy use!

## 🚀 Installation

First you need to install this package and related `pm2` package.

```
yarn add pm2-master-process pm2
```
```
npm install pm2-master-process pm2
```


Without any configuration, the environment variable which tells us the instance of the id is `NODE_APP_INSTANCE` ([source](https://pm2.keymetrics.io/docs/usage/environment/)).
If you have a problem accessing this environment variable, edit your pm2 ecosystem file and change the value of field `instance_var` to `YOUR_CUSTOM_ENV_NAME`.

**Usage without configuration**

```typescript
import { isMasterInstance } from 'pm2-master-process'

if (await isMasterInstance()) {
  console.info(`I am master!`)
} else {
  console.info(`I am a slave.`)
}
```

**Usage with configuration**
```typescript
import { isMasterInstance, Pm2MasterProcessConfig } from 'pm2-master-process'

const config: Partial<Pm2MasterProcessConfig> = {
  instanceIdPath: `YOUR_CUSTOM_ENV_NAME`, // process.env.YOUR_CUSTOM_ENV_NAME
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

## TODO

- [ ] Add tests
