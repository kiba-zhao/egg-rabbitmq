/**
 * @fileOverview 消费者处理类
 * @name handler.js
 * @author kiba.x.zhao <kiba.rain@qq.com>
 * @license MIT
 */
'use strict';

const assert = require('assert');
const process = require('process');
const { isFunction, TYPE_CONSUMER, TYPE_OK, TYPE_ERROR, prepareContent } = require('./utils');

const REGISTRY_KEY = Symbol('REGISTRY');
const ARGS_KEY = Symbol('ARGS');

class Handler {
  constructor(registry) {
    assert(registry, 'egg-rabbitmq#Handler: wrong registry');

    this[REGISTRY_KEY] = registry;
  }

  async exec(runner, throwError) {
    assert(isFunction(runner), 'egg-rabbitmq#Handler: wrong runner');

    const registry = this[REGISTRY_KEY];
    await registry.ready();

    const handler = this;
    const consume = async reg => {
      const { name, message } = reg;
      let error = null;
      try {
        const { content: raw, ...opts } = message;
        const content = await prepareContent(raw, opts);
        await runner(name, content, opts);
      } catch (e) {
        throwError(error = e);
      } finally {
        reply(handler, { type: error ? TYPE_ERROR : TYPE_OK, message, name });
      }
    };
    const args = this[ARGS_KEY] = [{ type: TYPE_CONSUMER, pid: process.pid }, consume ];
    registry.subscribe(...args);
  }

  destroy() {
    const registry = this[REGISTRY_KEY];
    const args = this[ARGS_KEY];
    registry.unSubscribe(...args);
  }
}

module.exports = Handler;

function reply(handler, reg) {
  const registry = handler[REGISTRY_KEY];
  registry.publish(reg);
}

