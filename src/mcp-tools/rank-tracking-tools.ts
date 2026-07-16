import { SEOMonitorClient } from '../clients/seomonitor-client.js';

/**
 * Rank Tracking Tools - Phase 2 Implementation
 * Core ranking and keyword data tools
 */
export class RankTrackingTools {
  /**
   * Get keyword data tool definition
   */
  static getKeywordDataDefinition() {
    return {
      name: 'seomonitor_get_keyword_data',
      title: 'Get Keyword Data',
      annotations: { title: 'Get Keyword Data', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Get keyword metrics and rankings from SEOMonitor',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
          start_date: {
            type: 'string',
            description: 'Start date (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'End date (YYYY-MM-DD)',
          },
          device: {
            type: 'string',
            description: 'Optional: Device type filter',
          },
          search: {
            type: 'string',
            description: 'Optional: Keyword search filter',
          },
          limit: {
            type: 'integer',
            description: 'Optional: Results limit',
          },
          offset: {
            type: 'integer',
            description: 'Optional: Pagination offset',
          },
          group_id: {
            type: 'string',
            description: 'Optional: Specific group ID to filter keywords',
          },
          keyword_ids: {
            type: 'string',
            description: 'Optional: Comma-separated list of specific keyword IDs',
          },
          order_by: {
            type: 'string',
            description: 'Optional: Sort field (keyword, search_volume, rank, rank_trend, opportunity)',
          },
          order_direction: {
            type: 'string',
            description: 'Optional: Sort direction (asc or desc)',
          },
          include_all_groups: {
            type: 'string',
            description: 'Optional: Whether to include folder and smart group IDs in output (true/false)',
          },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  /**
   * Get daily keyword ranks tool definition
   */
  static getDailyKeywordRanksDefinition() {
    return {
      name: 'seomonitor_get_daily_keyword_ranks',
      title: 'Get Daily Keyword Ranks',
      annotations: { title: 'Get Daily Keyword Ranks', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Historical ranking data for keywords',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
          start_date: {
            type: 'string',
            description: 'Start date (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'End date (YYYY-MM-DD)',
          },
          keyword_ids: {
            type: 'string',
            description: 'Optional: Specific keyword IDs',
          },
          group_ids: {
            type: 'string',
            description: 'Optional: Keyword group IDs',
          },
          group_id: {
            type: 'string',
            description: 'Optional: Specific group ID to filter keywords',
          },
          domain: {
            type: 'string',
            description: 'Optional: Domain name for which ranks will be returned',
          },
          get_archive: {
            type: 'string',
            description: 'Optional: If true, returns data for archived keywords',
          },
          limit: {
            type: 'integer',
            description: 'Optional: Maximum number of records (max 1000)',
          },
          offset: {
            type: 'integer',
            description: 'Optional: Pagination offset',
          },
          search: {
            type: 'string',
            description: 'Optional: Keyword search filter',
          },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  /**
   * Get keyword groups tool definition
   */
  static getKeywordGroupsDefinition() {
    return {
      name: 'seomonitor_get_keyword_groups',
      title: 'Get Keyword Groups',
      annotations: { title: 'Get Keyword Groups', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Retrieve keyword groups organization',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
        },
        required: ['campaign_id'],
      },
    };
  }

  /**
   * Get group data tool definition
   */
  static getGroupDataDefinition() {
    return {
      name: 'seomonitor_get_group_data',
      title: 'Get Group Data',
      annotations: { title: 'Get Group Data', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Group-level performance metrics',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
          group_ids: {
            type: 'string',
            description: 'Group IDs (comma-separated)',
          },
          start_date: {
            type: 'string',
            description: 'Start date (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'End date (YYYY-MM-DD)',
          },
        },
        required: ['campaign_id', 'group_ids', 'start_date', 'end_date'],
      },
    };
  }

  /**
   * Execute get_keyword_data tool
   */
  static async executeGetKeywordData(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, device, search, limit, offset } = args;

    const result = await seoClient.getKeywordData(parseInt(campaign_id), {
      startDate: start_date,
      endDate: end_date,
      device,
      search,
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
   * Execute get_daily_keyword_ranks tool
   */
  static async executeGetDailyKeywordRanks(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, keyword_ids } = args;

    // Convert keyword_ids string to array if provided
    const keywordIdsArray = keyword_ids ? keyword_ids.split(',').map((id: string) => parseInt(id.trim())) : undefined;

    const result = await seoClient.getKeywordRanks(parseInt(campaign_id), {
      startDate: start_date,
      endDate: end_date,
      keywordIds: keywordIdsArray,
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
   * Execute get_keyword_groups tool
   */
  static async executeGetKeywordGroups(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id } = args;

    const result = await seoClient.getGroups(parseInt(campaign_id));

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
   * Execute get_group_data tool
   */
  static async executeGetGroupData(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, group_ids, start_date, end_date } = args;

    const result = await seoClient.getGroupData(parseInt(campaign_id), group_ids, {
      startDate: start_date,
      endDate: end_date,
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
   * Get all tool definitions for this category
   */
  static getAllDefinitions() {
    return [
      this.getKeywordDataDefinition(),
      this.getDailyKeywordRanksDefinition(),
      this.getKeywordGroupsDefinition(),
      this.getGroupDataDefinition(),
    ];
  }

  /**
   * Execute tool based on name
   */
  static async execute(toolName: string, args: any, seoClient: SEOMonitorClient) {
    switch (toolName) {
      case 'seomonitor_get_keyword_data':
        return this.executeGetKeywordData(args, seoClient);
      case 'seomonitor_get_daily_keyword_ranks':
        return this.executeGetDailyKeywordRanks(args, seoClient);
      case 'seomonitor_get_keyword_groups':
        return this.executeGetKeywordGroups(args, seoClient);
      case 'seomonitor_get_group_data':
        return this.executeGetGroupData(args, seoClient);
      default:
        throw new Error(`Unknown rank tracking tool: ${toolName}`);
    }
  }
}