import { SEOMonitorClient } from '../clients/seomonitor-client.js';

/**
 * AI Search (AIS) Tools
 * Rank-tracker endpoints for Google AI Search Mode: keyword data, daily ranks,
 * competition, and group visibility for brand mentions / site citations.
 */
export class AiSearchTools {
  static getKeywordAiSearchDefinition() {
    return {
      name: 'seomonitor_get_keyword_ai_search_data',
      title: 'Get Keyword AI Search Data',
      annotations: { title: 'Get Keyword AI Search Data', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'AI Search (AIS) data for keywords, including AI Search Mode answer content and presence',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          group_id: { type: 'string', description: 'Optional: Specific group ID' },
          limit: { type: 'integer', description: 'Optional: Results limit' },
          offset: { type: 'integer', description: 'Optional: Pagination offset' },
          content_encoding: { type: 'string', description: 'Optional: Encoding for returned AI Search content' },
          skip_html: { type: 'boolean', description: 'Optional: Skip raw HTML in the response' },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  static getKeywordsCompetitionAisDefinition() {
    return {
      name: 'seomonitor_get_keywords_competition_ai_search',
      title: 'Get Keywords Competition AI Search',
      annotations: { title: 'Get Keywords Competition AI Search', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Competitor presence within AI Search (AIS) results for keywords',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          group_id: { type: 'integer', description: 'Optional: Specific group ID' },
          keyword_ids: { type: 'string', description: 'Optional: Specific keyword IDs (comma-separated)' },
          competitor_domains: { type: 'string', description: 'Optional: Competitor domains (comma-separated)' },
          limit: { type: 'integer', description: 'Optional: Results limit' },
          offset: { type: 'integer', description: 'Optional: Pagination offset' },
          order_by: { type: 'string', description: 'Optional: Sort field' },
          order_direction: { type: 'string', description: 'Optional: Sort direction (asc or desc)' },
          search: { type: 'string', description: 'Optional: Keyword search filter' },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  static getDailyAiSearchKeywordRanksDefinition() {
    return {
      name: 'seomonitor_get_daily_ai_search_keyword_ranks',
      title: 'Get Daily AI Search Keyword Ranks',
      annotations: { title: 'Get Daily AI Search Keyword Ranks', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Daily desktop/mobile ranks for your website in AI Search (AIS) results',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          domain: { type: 'string', description: 'Optional: Domain to get ranks for' },
          group_id: { type: 'string', description: 'Optional: Specific group ID' },
          keyword_ids: { type: 'string', description: 'Optional: Specific keyword IDs (comma-separated)' },
          get_archive: { type: 'string', description: 'Optional: Retrieve archived data' },
          limit: { type: 'integer', description: 'Optional: Results limit' },
          offset: { type: 'integer', description: 'Optional: Pagination offset' },
          search: { type: 'string', description: 'Optional: Keyword search filter' },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  static getDailyGroupAisMentionsDefinition() {
    return {
      name: 'seomonitor_get_daily_group_ai_search_brand_mentions',
      title: 'Get Daily Group AI Search Brand Mentions',
      annotations: { title: 'Get Daily Group AI Search Brand Mentions', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Daily group visibility for brand mentions inside AI Search (AIS) results',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          group_id: { type: 'integer', description: 'Optional: Specific group ID' },
          keyword_ids: { type: 'string', description: 'Optional: Specific keyword IDs (comma-separated)' },
          domain: { type: 'string', description: 'Optional: Domain for visibility calculation' },
          metrics_weighted_by_search_volume: { type: 'integer', description: 'Optional: Weight metrics by search volume (0 or 1)' },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  static getDailyGroupAisCitationsDefinition() {
    return {
      name: 'seomonitor_get_daily_group_ai_search_site_citations',
      title: 'Get Daily Group AI Search Site Citations',
      annotations: { title: 'Get Daily Group AI Search Site Citations', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Daily group visibility for site citations inside AI Search (AIS) results',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          group_id: { type: 'integer', description: 'Optional: Specific group ID' },
          keyword_ids: { type: 'string', description: 'Optional: Specific keyword IDs (comma-separated)' },
          domain: { type: 'string', description: 'Optional: Domain for visibility calculation' },
          metrics_weighted_by_search_volume: { type: 'integer', description: 'Optional: Weight metrics by search volume (0 or 1)' },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  static getAllDefinitions() {
    return [
      this.getKeywordAiSearchDefinition(),
      this.getKeywordsCompetitionAisDefinition(),
      this.getDailyAiSearchKeywordRanksDefinition(),
      this.getDailyGroupAisMentionsDefinition(),
      this.getDailyGroupAisCitationsDefinition(),
    ];
  }

  static async executeGetKeywordAiSearch(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, group_id, limit, offset, content_encoding, skip_html } = args;
    const result = await seoClient.getKeywordAiSearch(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      groupId: group_id,
      limit,
      offset,
      contentEncoding: content_encoding,
      skipHtml: skip_html,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async executeGetKeywordsCompetitionAis(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, group_id, keyword_ids, competitor_domains, limit, offset, order_by, order_direction, search } = args;
    const result = await seoClient.getCompetitionAiSearch(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      groupId: group_id,
      keywordIds: keyword_ids,
      competitors: competitor_domains,
      limit,
      offset,
      orderBy: order_by,
      orderDirection: order_direction,
      search,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async executeGetDailyAiSearchKeywordRanks(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, domain, group_id, keyword_ids, get_archive, limit, offset, search } = args;
    const result = await seoClient.getDailyAiSearchKeywordRanks(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      domain,
      groupId: group_id,
      keywordIds: keyword_ids,
      getArchive: get_archive,
      limit,
      offset,
      search,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async executeGetDailyGroupAisMentions(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, group_id, keyword_ids, domain, metrics_weighted_by_search_volume } = args;
    const result = await seoClient.getDailyGroupAisMentions(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      groupId: group_id,
      keywordIds: keyword_ids,
      domain,
      metricsWeightedBySearchVolume: metrics_weighted_by_search_volume,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async executeGetDailyGroupAisCitations(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, group_id, keyword_ids, domain, metrics_weighted_by_search_volume } = args;
    const result = await seoClient.getDailyGroupAisCitations(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      groupId: group_id,
      keywordIds: keyword_ids,
      domain,
      metricsWeightedBySearchVolume: metrics_weighted_by_search_volume,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async execute(toolName: string, args: any, seoClient: SEOMonitorClient) {
    switch (toolName) {
      case 'seomonitor_get_keyword_ai_search_data':
        return this.executeGetKeywordAiSearch(args, seoClient);
      case 'seomonitor_get_keywords_competition_ai_search':
        return this.executeGetKeywordsCompetitionAis(args, seoClient);
      case 'seomonitor_get_daily_ai_search_keyword_ranks':
        return this.executeGetDailyAiSearchKeywordRanks(args, seoClient);
      case 'seomonitor_get_daily_group_ai_search_brand_mentions':
        return this.executeGetDailyGroupAisMentions(args, seoClient);
      case 'seomonitor_get_daily_group_ai_search_site_citations':
        return this.executeGetDailyGroupAisCitations(args, seoClient);
      default:
        throw new Error(`Unknown AI Search tool: ${toolName}`);
    }
  }
}
