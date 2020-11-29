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
      dir: path.join(appInfo.baseDir, 'rabbitmq/producer'),
      caseStyle: 'upper'
    },
    consumer: {
      dir: path.join(appInfo.baseDir, 'rabbitmq/consumer'),
      caseStyle: 'upper'
    }
  };

  return exports;
};

