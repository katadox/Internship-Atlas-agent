import { CollectedPage, RawInternship } from '../models/DomainModels.js';

export interface SourcePlugin {
  id: string;
  name: string;
  description: string;
  
  /**
   * Evaluates if this plugin supports handling the given URL
   */
  supports(url: string): boolean;
  
  /**
   * Discovers job listing URLs from index/category pages
   */
  discover(sourceUrl: string): Promise<string[]>;
  
  /**
   * Collects raw HTML or JSON content from a specific target URL
   */
  collect(url: string, headers?: Record<string, string>): Promise<CollectedPage>;
  
  /**
   * Normalizes collected raw page content into source-level RawInternship items
   */
  normalize(page: CollectedPage): Promise<RawInternship[]>;
  
  /**
   * Performs source health check to ensure target website/API is reachable
   */
  healthCheck(sourceUrl: string): Promise<boolean>;
}
