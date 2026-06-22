import { SEOMonitorClient } from '../clients/seomonitor-client.js';

/**
 * Visibility Tools
 * Rank-tracker visibility metrics: Daily Share of Clicks, Share of Voice,
 * and SERP Visibility data.
 */
export class VisibilityTools {
  static getDailyShareOfClicksDefinition() {
    return {
      name: 'seomonitor_get_daily_share_of_clicks',
      description: 'Daily estimated share of organic clicks for the campaign domain vs competitors',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          start_date: { type: 'string', description: 'Optional: Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'Optional: End date (YYYY-MM-DD)' },
          group_id: { type: 'integer', description: 'Optional: Specific group ID' },
          keyword_ids: { type: 'string', description: 'Optional: Specific keyword IDs (comma-separated)' },
          device: { type: 'string', description: 'Optional: Device type (desktop or mobile)' },
        },
        required: ['campaign_id'],
      },
    };
  }

  static getShareOfVoiceDefinition() {
    return {
      name: 'seomonitor_get_share_of_voice',
      description: 'Share of Voice on a given date for the campaign domain and its competitors',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          date: { type: 'string', description: 'Required: Date (YYYY-MM-DD)' },
          group_id: { type: 'integer', description: 'Optional: Specific group ID' },
          keyword_ids: { type: 'string', description: 'Optional: Specific keyword IDs (comma-separated)' },
          competitor_domains: { type: 'string', description: 'Optional: Competitor domains (comma-separated)' },
          metrics_weighted_by_search_volume: { type: 'integer', description: 'Optional: Weight metrics by search volume (0 or 1)' },
          device: { type: 'string', description: 'Optional: Device type (desktop or mobile)' },
        },
        required: ['campaign_id', 'date'],
      },
    };
  }

  static getSerpVisibilityDefinition() {
    return {
      name: 'seomonitor_get_serp_visibility',
      description: 'SERP Visibility data for the campaign (overall visibility across tracked keywords)',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          group_id: { type: 'string', description: 'Optional: Specific group ID' },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  static getAllDefinitions() {
    return [
      this.getDailyShareOfClicksDefinition(),
      this.getShareOfVoiceDefinition(),
      this.getSerpVisibilityDefinition(),
    ];
  }

  static async executeGetDailyShareOfClicks(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, group_id, keyword_ids, device } = args;
    const result = await seoClient.getDailyShareOfClicks(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      groupId: group_id,
      keywordIds: keyword_ids,
      device,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async executeGetShareOfVoice(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, date, group_id, keyword_ids, competitor_domains, metrics_weighted_by_search_volume, device } = args;
    const result = await seoClient.getShareOfVoice(campaign_id, {
      date,
      groupId: group_id,
      keywordIds: keyword_ids,
      competitors: competitor_domains,
      metricsWeightedBySearchVolume: metrics_weighted_by_search_volume,
      device,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async executeGetSerpVisibility(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, group_id } = args;
    const result = await seoClient.getSerpVisibility(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      groupId: group_id,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async execute(toolName: string, args: any, seoClient: SEOMonitorClient) {
    switch (toolName) {
      case 'seomonitor_get_daily_share_of_clicks':
        return this.executeGetDailyShareOfClicks(args, seoClient);
      case 'seomonitor_get_share_of_voice':
        return this.executeGetShareOfVoice(args, seoClient);
      case 'seomonitor_get_serp_visibility':
        return this.executeGetSerpVisibility(args, seoClient);
      default:
        throw new Error(`Unknown visibility tool: ${toolName}`);
    }
  }
}
