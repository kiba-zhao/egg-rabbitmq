'use strict';

const assert = require('power-assert');
const mock = require('egg-mock');
const sinon = require('sinon');

describe('test/rabbitmq.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/rabbitmq-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  describe('exchange publish', () => {

    it('text success', async () => {
      const text = 'text';
      const promise = new Promise(resolve => {
        app.faked = sinon.fake(resolve);
      });

      await app.mq.Simple.publish(text);
      const message = await promise;
      assert.equal(message, text);
    });


    it('json success', async () => {
      const data = { haha: 1, test: '2' };
      const promise = new Promise(resolve => {
        app.faked = sinon.fake(resolve);
      });

      await app.mq.Simple.publish(data);
      const message = await promise;
      assert.deepStrictEqual(message, data);
    });

  });


  describe('queue publish', () => {

    it('text success', async () => {
      const text = 'text';
      const promise = new Promise(resolve => {
        app.fakedQueue = sinon.fake(resolve);
      });

      await app.mq.SimpleQueue.publish(text);
      const message = await promise;
      assert.equal(message, text);
    });

    it('json success', async () => {
      const data = { haha: 1, test: '2' };
      const promise = new Promise(resolve => {
        app.fakedQueue = sinon.fake(resolve);
      });

      await app.mq.SimpleQueue.publish(data);
      const message = await promise;
      assert.deepStrictEqual(message, data);
    });

  });

});
