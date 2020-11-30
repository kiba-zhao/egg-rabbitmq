'use strict';

/**
 * egg-rabbitmq default config
 * @member Config#rabbitmq
 * @property {String} SOME_KEY - some description
 */

const path = require('path');
module.exports = appInfo => {

  const exports = {};
  exports.rabbitmq = {
    producer: {
      target: 'mq',
      directory: path.join(appInfo.baseDir, 'app/rabbitmq/producer'),
      caseStyle: 'upper',
    },
    consumer: {
      target: 'consumer',
      directory: path.join(appInfo.baseDir, 'app/rabbitmq/consumer'),
      caseStyle: 'upper',
    },
  };

  return exports;
};

