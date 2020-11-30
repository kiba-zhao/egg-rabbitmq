/**
 * @fileOverview 注册客户端类
 * @name registry_client.js
 * @author kiba.x.zhao <kiba.rain@qq.com>
 * @license MIT
 */
'use strict';

const assert = require('assert');
const Base = require('sdk-base');
const { TYPE_CONSUMER, TYPE_OK, TYPE_ERROR, TYPE_CANCEL } = require('./utils');

const JOIN_STRING = '#';
const OPTIONS = { initMethod: 'init' };

class RegistryClient extends Base {

  constructor() {
    super(OPTIONS);
    this.regs = [];
    this.enable = true;
  }

  async init() {
    this.ready(true);
  }

  subscribe(reg, listener) {
    const eventName = generateEventName(reg);
    this.on(eventName, listener);

    if (reg.type !== TYPE_CONSUMER) { return; }

    assert(this.enable, 'egg-rabbitmq#Registry: subscribe fail');
    const { regs } = this;
    const consumeEventName = generateEventName({ ...reg, pid: undefined });
    if (reg.pid !== undefined) {
      regs.push(reg);
      this.emit(consumeEventName, reg);
      return;
    }

    for (const item of regs) { this.emit(consumeEventName, item); }

  }

  unSubscribe(reg, listener) {
    const eventName = generateEventName(reg);
    this.off(eventName, listener);

    if (reg.type !== TYPE_CONSUMER || reg.pid === undefined) { return; }

    const { regs } = this;
    const cancelEventName = generateEventName({ type: TYPE_CANCEL });
    this.emit(cancelEventName, reg);

    const index = regs.findIndex(item => item === reg);
    if (index <= 0) { return; }
    regs.splice(index, 1);
  }

  publish(reg) {
    const eventName = generateEventName(reg);
    this.emit(eventName, reg);
  }

  close() {
    this.enable = false;
    const { regs } = this;
    const cancelEventName = generateEventName({ type: TYPE_CANCEL });
    for (const item of regs) {
      this.emit(cancelEventName, item);
    }
  }
}

module.exports = RegistryClient;

function generateEventName(reg) {
  if (reg.type === TYPE_CONSUMER && reg.pid !== undefined) { return `${reg.type}${JOIN_STRING}${reg.pid}`; }
  if (reg.type === TYPE_OK || reg.type === TYPE_ERROR) { return `${reg.type}${JOIN_STRING}${reg.name}`; }
  return `${reg.type}${JOIN_STRING}`;
}
