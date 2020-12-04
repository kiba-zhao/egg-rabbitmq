/**
 * @fileOverview 客户端类
 * @name client.js
 * @author kiba.x.zhao <kiba.rain@qq.com>
 * @license MIT
 */
'use strict';

const assert = require('assert');
const amqplib = require('amqplib');

const { ERROR_EVENT, promisify, retry } = require('./utils');

const OPTS_KEY = Symbol('OPTS');
const CONNECTION_KEY = Symbol('CONNECTION');
const READY_KEY = Symbol('READY');

class Client {
  constructor(opts) {
    assert(opts, 'egg-rabbitmq#Client: wrong opts');
    this[OPTS_KEY] = opts;
  }

  init() {
    this[READY_KEY] = prepare(this);
  }

  async ready() {
    await this[READY_KEY];
  }

  async createChannel() {
    await this.ready();
    const conn = this[CONNECTION_KEY];
    const channel = await conn.createChannel();
    return channel;
  }
}

async function createClient(opts) {
  const client = new Client(opts);
  client.init();

  await client.ready();
  return client;
}

module.exports = createClient;

const delayPrepare = promisify(retry(prepare, 4, 5000, 20 * 60000));

async function prepare(client, retryPrepare = delayPrepare) {
  const { url, ...opts } = client[OPTS_KEY];
  let conn = null;
  try {
    conn = client[CONNECTION_KEY] = await amqplib.connect(url, opts);
    conn.on(ERROR_EVENT, () => {
      client[READY_KEY] = retryPrepare(client);
    });
    return conn;
  } catch (_) {
    return await retryPrepare(client);
  }
}

