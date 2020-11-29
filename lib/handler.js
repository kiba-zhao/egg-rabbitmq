/**
 * @fileOverview 消费者处理类
 * @name handler.js
 * @author kiba.x.zhao <kiba.rain@qq.com>
 * @license MIT
 */
'use strict';

const assert = require('assert');
const process = require('process');
const { isFunction, TYPE_CONSUMER, TYPE_OK, TYPE_ERROR } = require('./utils');

const REGISTRY_KEY = Symbol('REGISTRY');
const ARGS_KEY = Symbol('ARGS');

class Handler {
  constructor(registry) {
    assert(registry, 'egg-rabbitmq#Handler: wrong registry');

    this[REGISTRY_KEY] = registry;
  }

  async exec(runner) {
    assert(isFunction(runner), 'egg-rabbitmq#Handler: wrong runner');

    const registry = this[REGISTRY_KEY];
    await registry.ready();

    const consume = reg => {
      runner(reg.name, reg.message);
    };
    const args = this[ARGS_KEY] = [{ type: TYPE_CONSUMER, pid: process.pid }, consume];
    registry.subscribe(...args);
  }

  throw(name, message) {
    const registry = this[REGISTRY_KEY];
    registry.publish({ type: TYPE_ERROR, message, name });
  }

  ok(name, message) {
    const registry = this[REGISTRY_KEY];
    registry.publish({ type: TYPE_OK, message, name });
  }

  destroy() {
    const registry = this[REGISTRY_KEY];
    const args = this[ARGS_KEY];
    registry.unSubscribe(...args);
  }
}

module.exports = Handler;
