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
      description: 'Share of Voice on a given date for the campaign domain and its competitors. SINGLE-DAY SNAPSHOT: the endpoint takes one date, not a range, and these metrics can swing widely within a month — to describe a period, sample several dates and report the spread, never present one day as "the position". The platform UI shows the CLOSING day of its selected timeframe, so to reconcile with the app pass that end date. Reading the payload: (1) each block counts a different competitor set — organic_share_of_voice ranks ALL domains found in the SERPs (see competitors_number), while ai_overview_share_of_voice covers ONLY the competitors configured on the campaign, so their percentages are not comparable; (2) ai_overview metrics per domain are appearance COUNTS, not percentages: brand_mentions (brand named in the AI Overview), brand_citations (page cited on a keyword whose AI Overview names a brand), website_citations (page cited with no brand named) — the buckets overlap (a cited-and-mentioned appearance counts in both mentions and citations), so quote total_appearances for "how often does this domain appear", never the sum of the three; (3) an empty ai_search_share_of_voice.domains with total_impression_score 0 usually means AI Search tracking is NOT enabled on the campaign — report it as "not tracked", not zero visibility; (4) AI Overview source data for a date keeps arriving for ~2 days after that date, so figures for the last 2 days are PROVISIONAL and repeated calls can legitimately differ — for settled numbers query a date at least 2 days back.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          date: { type: 'string', description: 'Required: Date (YYYY-MM-DD)' },
          group_id: { type: 'integer', description: 'Optional: Specific group ID' },
          keyword_ids: { type: 'string', description: 'Optional: Specific keyword IDs (comma-separated)' },
          competitor_domains: { type: 'string', description: 'Optional: Competitor domains (comma-separated). Scopes ONLY the ai_overview and ai_search blocks — organic_share_of_voice always returns the top-traffic domains from the entire SERP and cannot be filtered to this set' },
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
    const result: any = await seoClient.getShareOfVoice(campaign_id, {
      date,
      groupId: group_id,
      keywordIds: keyword_ids,
      competitors: competitor_domains,
      metricsWeightedBySearchVolume: metrics_weighted_by_search_volume,
      device,
    });
    // Self-defending annotations (869ek7dzh D1/D3): each block counts a
    // different competitor universe, and an empty AIS block usually means the
    // channel is not tracked. Descriptions alone get skipped by weaker
    // callers, so stamp the reading rules into the payload itself.
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      if (result.organic_share_of_voice && typeof result.organic_share_of_voice === 'object') {
        result.organic_share_of_voice.basis = 'ALL domains detected in the SERPs for these keywords (see competitors_number) — NOT comparable with ai_overview_share_of_voice percentages';
      }
      if (result.ai_overview_share_of_voice && typeof result.ai_overview_share_of_voice === 'object') {
        result.ai_overview_share_of_voice.basis = 'ONLY the competitors configured on the campaign — a share of the tracked set, not of the whole AI Overview surface';
      }
      const ais = result.ai_search_share_of_voice;
      if (ais && typeof ais === 'object'
        && (!Array.isArray(ais.domains) || ais.domains.length === 0)
        && !(ais.total_impression_score > 0)) {
        ais.status = 'AI Search is likely NOT TRACKED on this campaign (no domains, zero impression score) — report it as untracked, never as zero visibility';
      }
    }
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
