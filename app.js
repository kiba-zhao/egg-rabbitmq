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
  }

  async didLoad() {
    const { app } = this;
    const config = app.config[NAME];

    const opts = config.clients && config.clients.producer ? config.clients.producer : config.client;
    if (!opts) { return; }

    app[NAME] = await createClient(opts);
    if (config.producer) {
      await loadToApp(config.producer, app);
    }

    const registry = config.consumer && app.cluster(RegistryClient, config.registry).create({});
    if (registry) { this.handler = await initHandler(registry, app, config.consumer); }
  }

  async beforeClose() {
    const { handler } = this;
    if (handler) { handler.destroy(); }
  }
}


module.exports = AppBootHook;

async function initHandler(registry, app, options) {

  const ctx = app.createAnonymousContext();
  let count = 0;
  const initializer = (...args) => {
    count++;
    const Model = options.initializer ? options.initializer(...args) : args[0];
    return new Model(ctx);
  };
  const { directory, target, ...opts } = options;
  app.loader.loadToApp(directory, target, { ...opts, initializer });
  const models = app[target];
  if (count <= 0) { return null; }

  const handler = new Handler(registry);
  await handler.exec(async (name, ...args) => {
    await models[name].consume(...args);
  }, e => {
    app.logger.error(`[egg-rabbit] OnConsumerEmit: ${e.message}`);
  });

  return handler;
}

async function loadToApp(config, app) {

  const { directory, target, ...opts } = config;
  let count = 0;
  if (!opts.initializer) {
    const client = app[NAME];
    opts.initializer = factory => {
      count++;
      return new Producer(factory, { client, app });
    };
  }
  app.loader.loadToApp(directory, target, opts);
  if (count <= 0) { return; }

  const models = app[target];
  const promises = [];
  for (const key in models) {
    promises.push(models[key].init());
  }

  await Promise.all(promises);

}
