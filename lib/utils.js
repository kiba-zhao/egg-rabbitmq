/**
 * @fileOverview 工具类
 * @name untils.js
 * @author kiba.x.zhao <kiba.rain@qq.com>
 * @license MIT
 */
'use strict';
const assert = require('assert');
const mime = require('mime');

const { isString, isBuffer, isFunction, stubString } = require('lodash');
exports.isFunction = isFunction;
exports.isString = isString;

const { types, promisify } = require('util');
exports.isAsyncFunction = types.isAsyncFunction;
exports.promisify = promisify;

const EMPTY_STRING = stubString();
exports.EMPTY_STRING = EMPTY_STRING;

const NAME = 'rabbitmq';
exports.NAME = NAME;

const TYPE_CONSUMER = 'consumer';
exports.TYPE_CONSUMER = TYPE_CONSUMER;

const TYPE_CANCEL = 'cancel';
exports.TYPE_CANCEL = TYPE_CANCEL;

const TYPE_OK = 'ok';
exports.TYPE_OK = TYPE_OK;

const TYPE_ERROR = 'error';
exports.TYPE_ERROR = TYPE_ERROR;

const ERROR_EVENT = 'error';
exports.ERROR_EVENT = ERROR_EVENT;

const EXT_TYPE = {
  TEXT: 'txt',
  BUFFER: 'bin',
  JSON: 'json',
};
const CONTENT_TYPE = {};
for (const key in EXT_TYPE) {
  CONTENT_TYPE[key] = mime.getType(EXT_TYPE[key]);
}

// const UTF8_ENCODING = 'utf8';
function preparePublishOpts(data, opts) {

  const exchange = opts.exchange;
  const queue = opts.queue;
  const routingKey = opts.routingKey || EMPTY_STRING;
  const options = opts.options || {};
  let content = null;
  let { contentType } = options;

  if (contentType) {
    assert(!isBuffer(data), 'egg-rabbitmq#Rabbitmq: wrong data');
    content = data;
  } else if (isString(data)) {
    content = Buffer.from(data);
    contentType = CONTENT_TYPE.TEXT;
  } else if (isBuffer(data)) {
    content = data;
    contentType = CONTENT_TYPE.BUFFER;
  } else {
    content = Buffer.from(JSON.stringify(data));
    contentType = CONTENT_TYPE.JSON;
  }

  return { exchange, routingKey, queue, content, options: { ...options, contentType } };
}

exports.preparePublishOpts = preparePublishOpts;

function toAsyncFunction(fn) {
  if (types.isAsyncFunction(fn)) { return fn; }
  return async function(...args) {
    return fn(...args);
  };
}
exports.toAsyncFunction = toAsyncFunction;

const delayPrepareChannel = promisify((target, count, callback) => {
  const interval = 5000 * count;
  setTimeout(async () => {
    let channel = null;
    let error = null;
    try {
      channel = await prepareChannel(target, count + 1);
    } catch (err) {
      error = err;
    } finally {
      callback(error, channel);
    }
  }, interval);
});

const CHANNEL_KEY = Symbol('CHANNEL');
async function prepareChannel(target, count = 1) {
  let channel = target[CHANNEL_KEY];
  if (channel) { return channel; }
  const { client } = target;
  try {
    channel = target[CHANNEL_KEY] = await client.createChannel();
    channel.on(ERROR_EVENT, () => {
      delete target[CHANNEL_KEY];
      target.onChannelChanged();
    });
    return channel;
  } catch (err) {
    return await delayPrepareChannel(target, count);
  }
}

exports.prepareChannel = prepareChannel;

async function prepareContent(raw, opts) {
  const { contentType } = opts.properties;
  const ext = mime.getExtension(contentType);
  if (ext === EXT_TYPE.TEXT) {
    return raw.toString();
  }
  if (ext === EXT_TYPE.JSON) {
    return JSON.parse(raw.toString());
  }
  return raw;

}
exports.prepareContent = prepareContent;
