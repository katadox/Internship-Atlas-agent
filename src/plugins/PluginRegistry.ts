import { SourcePlugin } from './SourcePlugin.js';
import { logger } from '../utils/logger.js';

export class PluginRegistry {
  private plugins = new Map<string, SourcePlugin>();

  register(plugin: SourcePlugin): void {
    if (this.plugins.has(plugin.id)) {
      logger.warn(`Overwriting plugin registration for ID: ${plugin.id}`);
    }
    this.plugins.set(plugin.id, plugin);
    logger.info(`Registered source plugin: [${plugin.id}] ${plugin.name}`);
  }

  get(pluginId: string): SourcePlugin | undefined {
    return this.plugins.get(pluginId);
  }

  getForUrl(url: string): SourcePlugin | undefined {
    for (const plugin of this.plugins.values()) {
      if (plugin.supports(url)) {
        return plugin;
      }
    }
    return undefined;
  }

  getAll(): SourcePlugin[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = new PluginRegistry();
