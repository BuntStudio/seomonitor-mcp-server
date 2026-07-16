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
      name: 'seomonitor_get_keyword_vault_data',
      title: 'Get Keyword Vault Data',
      annotations: { title: 'Get Keyword Vault Data', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
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
      name: 'seomonitor_get_keyword_vault_overview',
      title: 'Get Keyword Vault Overview',
      annotations: { title: 'Get Keyword Vault Overview', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
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
   * Get vault lists tool definition
   */
  static getVaultListsDefinition() {
    return {
      name: 'seomonitor_get_vault_lists',
      title: 'Get Vault Lists',
      annotations: { title: 'Get Vault Lists', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'List the Keyword Vault lists available for a campaign',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
          limit: {
            type: 'integer',
            description: 'Optional: Results limit',
          },
          offset: {
            type: 'string',
            description: 'Optional: Pagination offset',
          },
        },
        required: ['campaign_id'],
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
      this.getVaultListsDefinition(),
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
   * Execute get_vault_lists tool
   */
  static async executeGetVaultLists(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, limit, offset } = args;

    const result = await seoClient.getVaultLists(campaign_id, {
      limit,
      offset,
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
   * Execute tool based on name
   */
  static async execute(toolName: string, args: any, seoClient: SEOMonitorClient) {
    switch (toolName) {
      case 'seomonitor_get_keyword_vault_data':
        return this.executeGetKeywordVaultData(args, seoClient);
      case 'seomonitor_get_keyword_vault_overview':
        return this.executeGetKeywordVaultOverview(args, seoClient);
      case 'seomonitor_get_vault_lists':
        return this.executeGetVaultLists(args, seoClient);
      default:
        throw new Error(`Unknown vault tool: ${toolName}`);
    }
  }
}