/**
 * @fileOverview 消费者类
 * @name consumer.js
 * @author kiba.x.zhao <kiba.rain@qq.com>
 * @license MIT
 */
'use strict';

const assert = require('assert');
const { prepareChannel, TYPE_CONSUMER, TYPE_OK, TYPE_ERROR, TYPE_CANCEL, isString } = require('./utils');

const NAME_KEY = Symbol('NAME');
const MODEL_KEY = Symbol('MODEL');
const CLIENT_KEY = Symbol('CLIENT');
const REGISTRY_KEY = Symbol('REGISTRY');
const LISTENERS_KEY = Symbol('LISTENERS');

class Consumer {
  constructor(name, model, opts) {
    assert(isString(name), 'egg-rabbitmq#Consumer: wrong name');
    assert(model && model.options, 'egg-rabbitmq#Consumer: wrong model');
    assert(opts, 'egg-rabbitmq#Consumer: wrong opts');
    assert(opts.client, 'egg-rabbitmq#Consumer: wrong opts.client');
    assert(opts.registry, 'egg-rabbitmq#Consumer: wrong opts.registry');

    this[NAME_KEY] = name;
    this[MODEL_KEY] = model;
    this[CLIENT_KEY] = opts.client;
    this[REGISTRY_KEY] = opts.registry;
  }

  get client() {
    return this[CLIENT_KEY];
  }

  onChannelChanged() {
    const registry = this[REGISTRY_KEY];
    const listeners = this[LISTENERS_KEY];
    if (listeners) {
      for (const key in listeners) { registry.unSubscribe(...listeners[key]); }
    }

    prepare(this);
  }

  init() {
    prepare(this);
  }
}

module.exports = Consumer;

async function prepare(consumer) {

  const channel = await prepareChannel(consumer);
  const { options } = consumer[MODEL_KEY];
  const registry = consumer[REGISTRY_KEY];
  const name = consumer[NAME_KEY];

  const onOk = reg => {
    channel.ack(reg.message, options.allUpTo);
  };
  const onError = reg => {
    channel.nack(reg.message, options.allUpTo, options.requeue);
  };
  const onConsumer = reg => {
    channel.consume(options.queue, message => {
      registry.publish({ ...reg, message, name });
    }, options.consumeOpts).then(fields => {
      reg.consumerTag = fields.consumerTag;
    });
  };
  const onCancel = reg => {
    if (reg.consumerTag) {
      delete reg.consumerTag;
      channel.cancel(reg.consumerTag);
    }
  };

  const listeners = {
    ok: [{ type: TYPE_OK, name }, onOk ],
    error: [{ type: TYPE_ERROR, name }, onError ],
    consume: [{ type: TYPE_CONSUMER }, onConsumer ],
    cancel: [{ type: TYPE_CANCEL }, onCancel ],
  };
  consumer[LISTENERS_KEY] = listeners;
  for (const key in listeners) {
    registry.subscribe(...listeners[key]);
  }
}
