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
      title: 'Get Daily Share Of Clicks',
      annotations: { title: 'Get Daily Share Of Clicks', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
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
      title: 'Get Share Of Voice',
      annotations: { title: 'Get Share Of Voice', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Share of Voice on a given date for the campaign domain and its competitors. SINGLE-DAY SNAPSHOT: the endpoint takes one date, not a range, and these metrics can swing widely within a month — to describe a period, sample several dates and report the spread, never present one day as "the position". The platform UI shows the CLOSING day of its selected timeframe, so to reconcile with the app pass that end date. Reading the payload: (1) each block counts a different competitor set — organic_share_of_voice ranks ALL domains found in the SERPs (see competitors_number), while ai_overview_share_of_voice covers ONLY the competitors configured on the campaign, so their percentages are not comparable; (2) ai_overview metrics per domain are weighted appearance COUNTS, not percentages: brand_mentions (brand named in the AI Overview, 1 point each), brand_citations (brand page linked as source, 0.5 points each), website_citations (page linked when no brand is mentioned, 1 point each), total_appearances (raw appearances) — do NOT read brand_citations vs website_citations as "brand vs site" strength; (3) an empty ai_search_share_of_voice.domains with total_impression_score 0 usually means AI Search tracking is NOT enabled on the campaign — report it as "not tracked", not zero visibility.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          date: { type: 'string', description: 'Required: Date (YYYY-MM-DD)' },
          group_id: { type: 'integer', description: 'Optional: Specific group ID' },
          keyword_ids: { type: 'string', description: 'Optional: Specific keyword IDs (comma-separated)' },
          competitor_domains: { type: 'string', description: 'Optional: Competitor domains (comma-separated)' },
          metrics_weighted_by_search_volume: { type: 'integer', description: 'Optional: Weight metrics by search volume (0 or 1)' },
          device: { type: 'string', description: 'Optional: Device type (desktop or mobile). DEFAULTS TO DESKTOP when omitted — pass mobile explicitly on mobile-primary campaigns' },
        },
        required: ['campaign_id', 'date'],
      },
    };
  }

  static getSerpVisibilityDefinition() {
    return {
      name: 'seomonitor_get_serp_visibility',
      title: 'Get SERP Visibility',
      annotations: { title: 'Get SERP Visibility', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'SERP Visibility data for the campaign (overall visibility across tracked keywords)',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          group_id: { type: 'string', description: 'Optional: Specific group ID (0 = all keywords, or "brand")' },
          device: { type: 'integer', description: 'Optional: Device as an integer code (unlike other tools): 1 = desktop, 2 = mobile. Defaults to desktop' },
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
    const { campaign_id, start_date, end_date, group_id, device } = args;
    const result = await seoClient.getSerpVisibility(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      groupId: group_id,
      device,
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
