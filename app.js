/**
 * @fileOverview app worker入口文件
 * @name app.js
 * @author kiba.x.zhao <kiba.rain@qq.com>
 * @license MIT
 */
'use strict';

const { NAME } = require('./lib/utils');
const createClient = require('./lib/client');
const Producer = require('./lib/producer');
const RegistryClient = require('./lib/registry_client');
const Handler = require('./lib/handler');

class AppBootHook {
  constructor(app) {
    this.app = app;
    app.addSingleton(NAME, createClient);
  }

  async didLoad() {
    const { app } = this;

    const config = app.config[NAME];
    if (config.producer) {
      await loadToApp(config.producer, app);
    }

    const registry = config.consumer && app.cluster(RegistryClient, config.registry).create({});
    if (registry)
      this.handler = await initHandler(registry, app, config.consumer);
  }

  async beforeClose() {
    const { handler } = this;
    if (handler)
      handler.destroy();
  }
}


module.exports = AppBootHook;

async function initHandler(registry, app, options) {
  const ctx = app.createAnonymousContext();
  let count = 0;
  const initializer = (...args) => {
    count++;
    const model = options.initializer ? options.initializer(...args) : args[0];
    return new model(ctx);
  };
  const target = (new app.loader.FileLoader({ ...options, target: {}, initializer, inject: app })).load();
  if (count <= 0)
    return null;

  const handler = new Handler(registry);
  await handler.exec(async (...args) => {
    let error = null;
    try {
      const [name, message] = args;
      await target[name].consume(message);
    } catch (e) {
      error = e;
      app.logger.error(`[egg-rabbit] OnConsumerEmit: ${e.message}`);
    } finally {
      if (error)
        handler.throw(...args);
      else
        handler.ok(...args);
    }
  });

  return handler;
}

async function loadToApp(config, app) {

  const { dir, target, ...opts } = config;
  if (!opts.initializer) {
    const client = app[NAME];
    opts.initializer = (factory) => {
      return new Producer(factory, { client, app });
    };
  }
  app.loader.loadToApp(dir, target, opts);

}
