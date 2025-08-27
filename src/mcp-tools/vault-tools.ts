import { SEOMonitorClient } from '../clients/seomonitor-client.js';

/**
 * Keyword Vault Tools - Phase 4 Implementation
 * Saved keyword lists and vault management
 */
export class VaultTools {
  /**
   * Get keyword vault data tool definition
   */
  static getKeywordVaultDataDefinition() {
    return {
      name: 'get_keyword_vault_data',
      description: 'Access saved keyword lists data from Keyword Vault',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
          list: {
            type: 'string',
            description: 'Required: Name of the Keyword Vault list',
          },
          limit: {
            type: 'integer',
            description: 'Optional: Results limit (max 1000)',
          },
          offset: {
            type: 'integer',
            description: 'Optional: Pagination offset',
          },
          order_by: {
            type: 'string',
            description: 'Optional: Sort field (search_volume, year-over-year, rank, rank_trend, percentage_clicks)',
          },
          order_direction: {
            type: 'string',
            description: 'Optional: Sort direction (asc or desc)',
          },
          search: {
            type: 'string',
            description: 'Optional: Keyword search filter',
          },
          include_unqualified: {
            type: 'boolean',
            description: 'Optional: Include unqualified keywords (default: false)',
          },
          domain: {
            type: 'string',
            description: 'Optional: Domain for competitor data',
          },
        },
        required: ['campaign_id', 'list'],
      },
    };
  }

  /**
   * Get keyword vault overview tool definition
   */
  static getKeywordVaultOverviewDefinition() {
    return {
      name: 'get_keyword_vault_overview',
      description: 'Overview aggregated metrics for Keyword Vault list',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
          list: {
            type: 'string',
            description: 'Required: Name of the Keyword Vault list',
          },
        },
        required: ['campaign_id', 'list'],
      },
    };
  }

  /**
   * Get all tool definitions for this category
   */
  static getAllDefinitions() {
    return [
      this.getKeywordVaultDataDefinition(),
      this.getKeywordVaultOverviewDefinition(),
    ];
  }

  /**
   * Execute get_keyword_vault_data tool
   */
  static async executeGetKeywordVaultData(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, list, limit, offset, order_by, order_direction, search, include_unqualified, domain } = args;

    const result = await seoClient.getKeywordVaultData(campaign_id, list, {
      limit,
      offset,
      orderBy: order_by,
      orderDirection: order_direction,
      search,
      includeUnqualified: include_unqualified,
      domain,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * Execute get_keyword_vault_overview tool
   */
  static async executeGetKeywordVaultOverview(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, list } = args;

    const result = await seoClient.getKeywordVaultOverview(campaign_id, list);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * Execute tool based on name
   */
  static async execute(toolName: string, args: any, seoClient: SEOMonitorClient) {
    switch (toolName) {
      case 'get_keyword_vault_data':
        return this.executeGetKeywordVaultData(args, seoClient);
      case 'get_keyword_vault_overview':
        return this.executeGetKeywordVaultOverview(args, seoClient);
      default:
        throw new Error(`Unknown vault tool: ${toolName}`);
    }
  }
}