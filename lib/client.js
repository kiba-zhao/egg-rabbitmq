/**
 * @fileOverview 客户端类
 * @name client.js
 * @author kiba.x.zhao <kiba.rain@qq.com>
 * @license MIT
 */
'use strict';

const assert = require('assert');
const amqplib = require('amqplib');

const { ERROR_EVENT, promisify } = require('./utils');

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

const delayPrepare = promisify((client, count, callback) => {
  const interval = 5000 * count;
  setTimeout(async () => {
    let conn = null;
    let error = null;
    try {
      conn = await prepare(client, count + 1);
    } catch (err) {
      error = err;
    } finally {
      callback(error, conn);
    }
  }, interval);
});

async function prepare(client, count = 1) {
  const { url, ...opts } = client[OPTS_KEY];
  let conn = null;
  try {
    conn = client[CONNECTION_KEY] = await amqplib.connect(url, opts);
    conn.on(ERROR_EVENT, () => {
      client.init();
    });
    return conn;
  } catch (_) {
    return await delayPrepare(client, count);
  }
}

