/**
 * @fileOverview 生产者类定义
 * @name producer.js
 * @author kiba.x.zhao <kiba.rain@qq.com>
 * @license MIT
 */
'use strict';

const assert = require('assert');
const { prepareChannel, preparePublishOpts, isFunction, isAsyncFunction, toAsyncFunction } = require('./utils');

const CLIENT_KEY = Symbol('CLIENT');
const APP_KEY = Symbol('APP');
const FACTORY_KEY = Symbol('FACTORY');
const OPTS_KEY = Symbol('OPTS');

class Producer {
  constructor(factory, opts) {
    assert(opts, 'egg-rabbitmq#Producer: wrong opts');
    assert(opts.client, 'egg-rabbitmq#Producer: wrong opts.client');
    assert(opts.app, 'egg-rabbitmq#Producer: wrong opts.app');
    assert(isAsyncFunction(factory) || isFunction(factory), 'egg-rabbitmq#Producer: wrong factory');

    this[CLIENT_KEY] = opts.client;
    this[APP_KEY] = opts.app;
    this[FACTORY_KEY] = toAsyncFunction(factory);
  }

  get client() {
    return this[CLIENT_KEY];
  }

  async init() {
    await prepareOpts(this);
  }

  onChannelChanged() {
    delete this[OPTS_KEY];
  }

  async publishOne(data, opts) {
    const channel = await prepareChannel(this);
    const _opts = await prepareOpts(this);
    const _options = opts ? opts : _opts.options;

    const { queue, exchange, routingKey, content, options } = preparePublishOpts(data, { ..._opts, options: _options });
    if (exchange) { return await channel.publish(exchange, routingKey, content, options); }
    return await channel.sendToQueue(queue, content, options);
  }

  async publish(...args) {
    if (args.length <= 1) { return this.publishOne(args[0]); }

    const channel = await prepareChannel(this);
    const opts = await prepareOpts(this);
    const promises = [];
    for (const data of args) {
      const { exchange, queue, routingKey, content, options } = preparePublishOpts(data, opts);
      if (exchange) { promises.push(channel.publish(exchange, routingKey, content, options)); } else { promises.push(channel.sendToQueue(queue, content, options)); }
    }

    return await Promise.all(promises);
  }

}

module.exports = Producer;

async function prepareOpts(producer) {
  let opts = producer[OPTS_KEY];
  if (opts) { return opts; }

  const channel = await prepareChannel(producer);
  const app = producer[APP_KEY];
  const factory = producer[FACTORY_KEY];
  opts = await factory(app, channel);

  producer[OPTS_KEY] = opts;
  return opts;
}
