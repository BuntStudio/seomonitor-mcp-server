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
      name: 'seomonitor_get_daily_traffic_data',
      title: 'Get Daily Traffic Data',
      annotations: { title: 'Get Daily Traffic Data', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Daily organic traffic metrics for a campaign. IMPORTANT: with no segment specified the API returns the NON-BRAND segment, not all traffic — pass segment=all for total organic.',
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
            description: 'Optional: Traffic segment (all, non-brand, brand, or custom segment name). Defaults to non-brand',
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
      name: 'seomonitor_get_traffic_by_keywords',
      title: 'Get Traffic By Keywords',
      annotations: { title: 'Get Traffic By Keywords', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Keyword-level traffic attribution. IMPORTANT: with no segment specified the API returns the NON-BRAND segment, not all traffic — pass segment=all for total organic.',
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
    const { campaign_id, start_date, end_date, segment } = args;

    const result = await seoClient.getTrafficData(parseInt(campaign_id), {
      startDate: start_date,
      endDate: end_date,
      segment,
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
    const { campaign_id, start_date, end_date, segment, limit, offset, order_by, order_direction, tracking_status, search } = args;

    const result = await seoClient.getTrafficByKeywords(parseInt(campaign_id), {
      startDate: start_date,
      endDate: end_date,
      segment,
      limit,
      offset,
      orderBy: order_by,
      orderDirection: order_direction,
      trackingStatus: tracking_status,
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
      case 'seomonitor_get_daily_traffic_data':
        return this.executeGetDailyTraffic(args, seoClient);
      case 'seomonitor_get_traffic_by_keywords':
        return this.executeGetTrafficByKeywords(args, seoClient);
      default:
        throw new Error(`Unknown traffic tool: ${toolName}`);
    }
  }
}