import { SEOMonitorClient } from '../clients/seomonitor-client.js';

/**
 * Organic Traffic Analysis Tools - Phase 2 Implementation
 * Traffic metrics and keyword attribution tools
 */
export class TrafficTools {
  /**
   * Get daily traffic data tool definition
   */
  static getDailyTrafficDefinition() {
    return {
      name: 'get_daily_traffic_data',
      description: 'Traffic metrics segmented by various dimensions',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'string',
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
          search: {
            type: 'string',
            description: 'Optional: Search filter',
          },
          segment: {
            type: 'string',
            description: 'Optional: Traffic segment (all, non-brand, brand, or custom segment name)',
          },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  /**
   * Get traffic by keywords tool definition
   */
  static getTrafficByKeywordsDefinition() {
    return {
      name: 'get_traffic_by_keywords',
      description: 'Keyword-level traffic attribution',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'string',
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
          segment: {
            type: 'string',
            description: 'Optional: Traffic segment (all, non-brand, brand, or custom segment name)',
          },
          limit: {
            type: 'number',
            description: 'Optional: Maximum number of records (max 1000)',
          },
          offset: {
            type: 'number',
            description: 'Optional: Pagination offset',
          },
          order_by: {
            type: 'string',
            description: 'Optional: Sort field (avg_position, sessions, transactions, goals, transactions_revenue, goals_revenue)',
          },
          order_direction: {
            type: 'string',
            description: 'Optional: Sort direction (asc or desc)',
          },
          tracking_status: {
            type: 'string',
            description: 'Optional: Filter by tracking status (tracked, untracked, all)',
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
   * Execute get_daily_traffic_data tool
   */
  static async executeGetDailyTraffic(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date } = args;

    const result = await seoClient.getTrafficData(parseInt(campaign_id), {
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
   * Execute get_traffic_by_keywords tool
   */
  static async executeGetTrafficByKeywords(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, keyword_ids } = args;

    // Convert keyword_ids string to array if provided
    const keywordIdsArray = keyword_ids ? keyword_ids.split(',').map((id: string) => parseInt(id.trim())) : undefined;

    const result = await seoClient.getTrafficByKeywords(parseInt(campaign_id), {
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
   * Get all tool definitions for this category
   */
  static getAllDefinitions() {
    return [
      this.getDailyTrafficDefinition(),
      this.getTrafficByKeywordsDefinition(),
    ];
  }

  /**
   * Execute tool based on name
   */
  static async execute(toolName: string, args: any, seoClient: SEOMonitorClient) {
    switch (toolName) {
      case 'get_daily_traffic_data':
        return this.executeGetDailyTraffic(args, seoClient);
      case 'get_traffic_by_keywords':
        return this.executeGetTrafficByKeywords(args, seoClient);
      default:
        throw new Error(`Unknown traffic tool: ${toolName}`);
    }
  }
}