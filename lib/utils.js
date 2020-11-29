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

const { types } = require('util');

const EMPTY_STRING = stubString();

const NAME = 'rabbitmq';
exports.NAME = NAME;

const TYPE_CONSUMER = 'consumer';
eports.TYPE_CONSUMER = TYPE_CONSUMER;

const TYPE_CANCEL = 'cancel';
exports.TYPE_CANCEL = TYPE_CANCEL;

const TYPE_OK = 'ok';
eports.TYPE_OK = TYPE_OK;

const TYPE_ERROR = 'error';
eports.TYPE_ERROR = TYPE_ERROR;

const ERROR_EVENT = 'error';
eports.ERROR_EVENT = ERROR_EVENT;

const EXT_TYPE = {
  TEXT: 'txt',
  BUFFER: 'bin',
  JSON: 'json'
};
const CONTENT_TYPE = {};
for (let key in EXT_TYPE) {
  CONTENT_TYPE[key] = mime.getType(EXT_TYPE[key]);
}

// const UTF8_ENCODING = 'utf8';
function preparePublishOpts(data, opts) {

  const exchange = opts.exchange;
  const routingKey = opts.routingKey || EMPTY_STRING;
  const options = opts.options || {};
  let content = null;
  let { contentType } = options;

  if (contentType) {
    assert(!isBuffer(data), 'egg-rabbitmq#Rabbitmq: wrong data');
    content = data;
  } else if (isString(data)) {
    content = Buffer.form(data);
    contentType = CONTENT_TYPE.TEXT;
  } else if (isBuffer(data)) {
    content = data;
    contentType = CONTENT_TYPE.BUFFER;
  } else {
    content = Buffer.form(JSON.stringify(data));
    contentType = CONTENT_TYPE.JSON;
  }

  return { exchange, routingKey, content, options: { ...options, contentType } };
}

exports.preparePublishOpts = preparePublishOpts;

function toAsyncFunction(fn) {
  if (types.isAsyncFunction(fn))
    return fn;
  return async function(...args) {
    return fn(...args);
  };
}
exports.toAsyncFunction = toAsyncFunction;

const CHANNEL_KEY = Symbol('CHANNEL');
async function prepareChannel(target) {
  let channel = target[CHANNEL_KEY];
  if (channel)
    return channel;
  const { client } = target;
  channel = await client.createChannel();
  channel.on(ERROR_EVENT, () => {
    delete target[CHANNEL_KEY];
    target.onChannelChanged();
  });

  target[CHANNEL_KEY] = channel;
  return channel;
}

exports.prepareChannel = prepareChannel;
