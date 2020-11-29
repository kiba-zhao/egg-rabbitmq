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

  onChannelChanged() {
    delete this[OPTS_KEY];
  }

  async publishOne(data) {
    const channel = await prepareChannel(this);
    const opts = await prepareOpts(this);

    const { exchange, routingKey, content, options } = preparePublishOpts(data, opts);
    return await channel.publish(exchange, routingKey, content, options);
  }

  async publish(...args) {
    if (args.length <= 1)
      return this.publishOne(args[0]);

    const channel = await prepareChannel(this);
    const opts = await prepareOpts(this);
    const promises = [];
    for (let data of args) {
      let { exchange, routingKey, content, options } = preparePublishOpts(data, opts);
      promises.push(channel.publish(exchange, routingKey, content, options));
    }

    return await Promise.all(promises);
  }

}

module.exports = Producer;

async function prepareOpts(producer) {
  let opts = producer[OPTS_KEY];
  if (opts)
    return opts;

  const channel = await prepareChannel(producer);
  const app = producer[APP_KEY];
  const factory = producer[FACTORY_KEY];
  opts = await factory(app, channel);

  producer[OPTS_KEY] = opts;
  return opts;
}
