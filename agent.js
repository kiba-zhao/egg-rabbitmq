/**
 * @fileOverview agent入口
 * @name agent.js
 * @author kiba.x.zhao <kiba.rain@qq.com>
 * @license MIT
 */
'use strict';

const { NAME } = require('./lib/utils');
const createClient = require('./lib/client');
const RegistryClient = require('./lib/registry_client');
const Consumer = require('./lib/consumer');

class AgentBootHook {
  constructor(agent) {
    this.agent = agent;
  }

  async didLoad() {
    const { agent } = this;
    const config = agent.config[NAME];

    const opts = config.clients && config.clients.consumer ? config.clients.consumer : config.client;
    if (!opts) { return; }

    agent[NAME] = await createClient(opts);
    const registry = this.registry = config.consumer && agent.cluster(RegistryClient, config.registry).create({});
    if (registry) {
      this.consumers = initConsumers(registry, agent, config.consumer);
      if (!this.consumers) { delete this.registry; }
    }
  }

  async beforeClose() {
    if (this.registry) { this.registry.close(); }
  }
}

module.exports = AgentBootHook;

function initConsumers(registry, agent, options) {
  let count = 0;
  const initializer = (...args) => {
    count++;
    return options.initializer ? options.initializer(...args) : args[0];
  };
  const target = (new agent.loader.FileLoader({ ...options, target: {}, initializer, inject: agent })).load();
  if (count <= 0) { return null; }

  const consumers = {};
  for (const key in target) {
    const model = target[key];
    const disabled = !!(model.options && model.options.disabled);
    if (disabled) { continue; }
    const consumer = consumers[key] = new Consumer(key, model, { client: agent[NAME], registry });
    consumer.init();
  }

  return consumers;
}
