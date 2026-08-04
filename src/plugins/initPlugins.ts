import { pluginRegistry } from './PluginRegistry.js';
import { GenericHtmlPlugin } from './impl/GenericHtmlPlugin.js';
import { GitHubInternshipPlugin } from './impl/GitHubInternshipPlugin.js';
import { RssSitemapPlugin } from './impl/RssSitemapPlugin.js';
import { AICTEPlugin } from './impl/govt/AICTEPlugin.js';
import { GovtResearchLabsPlugin } from './impl/govt/GovtResearchLabsPlugin.js';
import { ATSScraperPlugin } from './impl/ats/ATSScraperPlugin.js';
import { UnstopInternshalaPlugin } from './impl/platforms/UnstopInternshalaPlugin.js';

export function initializePlugins(): void {
  pluginRegistry.register(new AICTEPlugin());
  pluginRegistry.register(new GovtResearchLabsPlugin());
  pluginRegistry.register(new ATSScraperPlugin());
  pluginRegistry.register(new UnstopInternshalaPlugin());
  pluginRegistry.register(new GitHubInternshipPlugin());
  pluginRegistry.register(new RssSitemapPlugin());
  pluginRegistry.register(new GenericHtmlPlugin());
}
