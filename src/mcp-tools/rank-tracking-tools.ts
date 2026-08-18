import { SEOMonitorClient } from '../clients/seomonitor-client.js';
import { stripMonthlySeries } from './strip-monthly.js';

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
      description: 'Get keyword metrics and rankings from SEOMonitor, one page at a time. For counts or for listing a filtered subset, prefer seomonitor_find_keywords, which scans the whole set once and pages it safely. Desktop and mobile are often tracked to different depths on the same campaign — read primary_device and max_tracked_position_desktop/mobile from seomonitor_get_tracked_campaigns before comparing the two, or a device that simply stops being tracked at position 20 will look like it is performing badly.',
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
            description: 'Optional: Device type filter (desktop or mobile). Not interchangeable between campaigns — check the campaign\'s primary_device and per-device tracking depth first',
          },
          search: {
            type: 'string',
            description: 'Optional: Keyword search filter',
          },
          limit: {
            type: 'integer',
            description: 'Optional: Results limit (default 100, max 1000)',
          },
          offset: {
            type: 'integer',
            description: 'Optional: Pagination offset',
          },
          group_id: {
            type: 'string',
            description: 'Optional: Specific group ID to filter keywords. Special values: 0 = all keywords, -1 = Brand group, -2 = ungrouped, -3 = Forecast objective',
          },
          keyword_ids: {
            type: 'string',
            description: 'Optional: Comma-separated list of specific keyword IDs',
          },
          order_by: {
            type: 'string',
            description: 'Optional: Sort field (keyword, search_volume, year-over-year, rank, rank_trend, rank_trend_impact, opportunity)',
          },
          order_direction: {
            type: 'string',
            description: 'Optional: Sort direction (asc or desc)',
          },
          include_all_groups: {
            type: 'string',
            description: 'Optional: Whether to include folder and smart group IDs in output (true/false)',
          },
          include_monthly_searches: {
            type: 'boolean',
            description: 'Optional: Include the 13-month monthly_searches / additional_monthly_sessions history arrays on every row. Stripped by default — they dominate the payload and are rarely needed',
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
            description: 'Optional: Specific keyword IDs (comma-separated)',
          },
          group_id: {
            type: 'string',
            description: 'Optional: Specific group ID to filter keywords. Special values: 0 = all keywords, -1 = Brand group, -2 = ungrouped, -3 = Forecast objective',
          },
          domain: {
            type: 'string',
            description: 'Optional: Domain name for which ranks will be returned',
          },
          get_archive: {
            type: 'string',
            description: 'Optional: If true, returns ONLY archived/deleted keywords (filters to archived, does not add them to active results)',
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
            description: 'Optional: Group IDs (comma-separated). Defaults to the All Keywords group (0)',
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
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  /**
   * Execute get_keyword_data tool
   */
  static async executeGetKeywordData(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, device, search, limit, offset, group_id, keyword_ids, order_by, order_direction, include_all_groups, include_monthly_searches } = args;

    const result = await seoClient.getKeywordData(parseInt(campaign_id), {
      startDate: start_date,
      endDate: end_date,
      device,
      search,
      limit,
      offset,
      groupId: group_id,
      keywordIds: keyword_ids,
      orderBy: order_by,
      orderDirection: order_direction,
      includeAllGroups: include_all_groups,
    });
    if (include_monthly_searches !== true) {
      stripMonthlySeries(result);
    }

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
    const { campaign_id, start_date, end_date, keyword_ids, group_id, domain, get_archive, limit, offset, search } = args;

    // Convert keyword_ids string to array if provided
    const keywordIdsArray = keyword_ids ? keyword_ids.split(',').map((id: string) => parseInt(id.trim())) : undefined;

    const result = await seoClient.getKeywordRanks(parseInt(campaign_id), {
      startDate: start_date,
      endDate: end_date,
      keywordIds: keywordIdsArray,
      groupId: group_id,
      domain,
      getArchive: get_archive,
      limit,
      offset,
      search,
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

    const result = await seoClient.getGroupData(parseInt(campaign_id), group_ids ?? '0', {
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