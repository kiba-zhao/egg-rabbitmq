/**
 * @fileOverview 消费者示例
 * @name simple.js
 * @author kiba.x.zhao <kiba.rain@qq.com>
 * @license MIT
 */
'use strict';

const { Controller: Consumer } = require('egg');

class SimleConsumer extends Consumer {

  static get options() {
    return {
      queue: 'simple',
    };
  }

  async consume(message) {
    const { ctx } = this;
    await ctx.app.faked(message);
  }
}

module.exports = SimleConsumer;
