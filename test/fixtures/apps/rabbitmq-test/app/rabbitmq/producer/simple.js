/**
 * @fileOverview 生产者示例
 * @name simple.js
 * @author kiba.x.zhao <kiba.rain@qq.com>
 * @license MIT
 */
'use strict';

const OPTIONS = {
  exchange: 'simpleEx',
  queue: 'simple',
  // options: {}  // publish的options参数
};

module.exports = async (_, channel) => {
  const { exchange, queue } = OPTIONS;
  await channel.assertExchange(exchange);
  await channel.assertQueue(queue);
  await channel.bindQueue(queue, exchange);
  return OPTIONS;
};
