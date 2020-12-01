# egg-rabbitmq

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-rabbitmq.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-rabbitmq
[travis-image]: https://img.shields.io/travis/eggjs/egg-rabbitmq.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-rabbitmq
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-rabbitmq.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-rabbitmq?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-rabbitmq.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-rabbitmq
[snyk-image]: https://snyk.io/test/npm/egg-rabbitmq/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-rabbitmq
[download-image]: https://img.shields.io/npm/dm/egg-rabbitmq.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-rabbitmq

[eggjs](https://eggjs.org/zh-cn/index.html)的rabbitmq插件。支持生产与消费消息．

## Install

```bash
$ npm i git://github.com/kiba-zhao/egg-rabbitmq.git --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.rabbitmq = {
  enable: true,
  package: 'egg-rabbitmq',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.rabbitmq = {
    producer:{  //生产者加载目录参数
        target: 'mq',
        directory: path.join(appInfo.baseDir, 'app/rabbitmq/producer'),
        caseStyle: 'upper',
        //　请参考eggjs中app.loader.loadToApp对应参数
    },
    consumer:{  //消费者加载目录参数
        target: 'consumer',
        directory: path.join(appInfo.baseDir, 'app/rabbitmq/consumer'),
        caseStyle: 'upper',
    },
    client:{   //默认连接参数
        url: 'amqp://guest:guest@localhost:5672',
        // 其他参数请参考amqplib.connect的socketOptions
    },
    clients:{  //特定连接参数
        producer:{}  //生产者连接参数
        consumer:{}  //消费者连接参数
    }
};
```

> 以上配置中,rabbitmq.producer和rabbitmq.consumer为egg-rabbitmq插件提供的默认配置．
> rabbitmq.client与rabbitmq.clients至少需要配置一项．eggjs才会去启动创建链接．

see [config/config.default.js](config/config.default.js) for more detail.

## 生产者示例 ##
生产者主要用于构建和定义需要发送信息的目标exchange或者queue．
``` javascript
// {app_root}/app/service/Simple.js

const { Service } = require('egg');
class SimpleService extends Service {

    async createOne(entity,opts){
        // 发送单条消息
        await this.app.mq.SimpleMQ.publish(entity);
    }
    
    async create(entities,opts){
        // 发送多条消息
        await this.app.mq.SimpleMQ.publish(...entities);
    }
}

```

``` javascript
// {app_root}/app/rabbitmq/producer/SimpleMQ.js

// 定义信息发送的目标
const OPTIONS = {
  exchange: 'simpleEx',
  queue: 'simple',
  // routingKey:"",  //publish exchange时的路由key
  // options: {}  // publish的options参数
};

// 构建exchange,queue以及绑定关系
module.exports = async (_, channel) => {
  const { exchange, queue } = OPTIONS;
  await channel.assertExchange(exchange);
  await channel.assertQueue(queue);
  await channel.bindQueue(queue, exchange);
  return OPTIONS;
};

```

> 如果生产者定义了exchange则会将消息发送到exchange．否则会发送消息到queue．

### 消费者示例 ###
// {app_root}/app/rabbitmq/consumer/SimpleEx.js

``` javascript
const { Controller: Consumer } = require('egg');

class SimpleConsumer extends Consumer {

  // 消费者参数
  static get options() {
    return {
      queue: 'simple', // 消费的队列
      // allUpTo: true,
      // requeue: true,
      // consumeOpts:{}  //消费可选项
    };
  }

  async consume(message) {
    const { ctx,app } = this;
    // 消费执行功能的代码内容
  }
}

module.exports = SimpleConsumer;
```

## Questions & Suggestions


Please open an issue [here](https://github.com/kiba-zhao/egg-rabbitmq/issues).

## License

[MIT](LICENSE)
