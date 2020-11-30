/**
 * @fileOverview 队列消费者示例
 * @name simpleQueue.js
 * @author kiba.x.zhao <kiba.rain@qq.com>
 * @license MIT
 */
'use strict';

const { Controller: Consumer } = require('egg');

class SimpleQueueConsumer extends Consumer {

  static get options() {
    return {
      queue: 'simpleQueue',
    };
  }

  async consume(message) {
    const { ctx } = this;
    await ctx.app.fakedQueue(message);
  }
}

module.exports = SimpleQueueConsumer;
