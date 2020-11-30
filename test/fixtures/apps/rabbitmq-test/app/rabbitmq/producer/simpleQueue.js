/**
 * @fileOverview queue生产者示例
 * @name simpleQueue.js
 * @author kiba.x.zhao <kiba.rain@qq.com>
 * @license MIT
 */
'use strict';

const OPTIONS = {
  queue: 'simpleQueue',
  // options: {}  // sendToQueue的options参数
};

module.exports = async (_, channel) => {
  const { queue } = OPTIONS;
  await channel.assertQueue(queue);
  return OPTIONS;
};
