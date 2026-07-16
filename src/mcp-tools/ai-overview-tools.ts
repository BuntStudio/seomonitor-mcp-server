import { SEOMonitorClient } from '../clients/seomonitor-client.js';

/**
 * AI Overview (AIO) Tools
 * Extended rank-tracker endpoints for Google AI Overview presence, ranks,
 * competition and group visibility (mentions / citations).
 */
export class AiOverviewTools {
  static getDailyKeywordRanksAioDefinition() {
    return {
      name: 'seomonitor_get_daily_keyword_ranks_ai_overview',
      title: 'Get Daily Keyword Ranks AI Overview',
      annotations: { title: 'Get Daily Keyword Ranks AI Overview', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Daily desktop/mobile ranks in AI Overview (AIO) results, with my_brand_present / any_brand_present flags',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          group_id: { type: 'integer', description: 'Optional: Specific group ID' },
          keyword_ids: { type: 'string', description: 'Optional: Specific keyword IDs (comma-separated)' },
          limit: { type: 'integer', description: 'Optional: Results limit (max 1000)' },
          offset: { type: 'integer', description: 'Optional: Pagination offset' },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  static getKeywordsCompetitionAioDefinition() {
    return {
      name: 'seomonitor_get_keywords_competition_ai_overview',
      title: 'Get Keywords Competition AI Overview',
      annotations: { title: 'Get Keywords Competition AI Overview', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Competitor presence and ranks within AI Overview (AIO) results for keywords',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          device: { type: 'string', description: 'Required: Device type (desktop or mobile)' },
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          group_id: { type: 'integer', description: 'Optional: Specific group ID' },
          keyword_ids: { type: 'string', description: 'Optional: Specific keyword IDs (comma-separated)' },
          competitor_domains: { type: 'string', description: 'Optional: Competitor domains (comma-separated)' },
          limit: { type: 'integer', description: 'Optional: Results limit' },
          offset: { type: 'integer', description: 'Optional: Pagination offset' },
        },
        required: ['campaign_id', 'device', 'start_date', 'end_date'],
      },
    };
  }

  static getDailyGroupVisibilityAioMentionsDefinition() {
    return {
      name: 'seomonitor_get_daily_group_visibility_ai_overview_mentions',
      title: 'Get Daily Group Visibility AI Overview Mentions',
      annotations: { title: 'Get Daily Group Visibility AI Overview Mentions', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Daily group visibility for brand mentions inside AI Overview (AIO) results',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          group_id: { type: 'integer', description: 'Optional: Specific group ID' },
          keyword_ids: { type: 'string', description: 'Optional: Specific keyword IDs (comma-separated)' },
          domain: { type: 'string', description: 'Optional: Domain for visibility calculation' },
          limit: { type: 'integer', description: 'Optional: Results limit' },
          offset: { type: 'integer', description: 'Optional: Pagination offset' },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  static getDailyGroupVisibilityAioCitationsDefinition() {
    return {
      name: 'seomonitor_get_daily_group_visibility_ai_overview_citations',
      title: 'Get Daily Group Visibility AI Overview Citations',
      annotations: { title: 'Get Daily Group Visibility AI Overview Citations', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Daily group visibility for site citations inside AI Overview (AIO) results',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          group_id: { type: 'integer', description: 'Optional: Specific group ID' },
          keyword_ids: { type: 'string', description: 'Optional: Specific keyword IDs (comma-separated)' },
          domain: { type: 'string', description: 'Optional: Domain for visibility calculation' },
          limit: { type: 'integer', description: 'Optional: Results limit' },
          offset: { type: 'integer', description: 'Optional: Pagination offset' },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  static getAllDefinitions() {
    return [
      this.getDailyKeywordRanksAioDefinition(),
      this.getKeywordsCompetitionAioDefinition(),
      this.getDailyGroupVisibilityAioMentionsDefinition(),
      this.getDailyGroupVisibilityAioCitationsDefinition(),
    ];
  }

  static async executeGetDailyKeywordRanksAio(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, group_id, keyword_ids, limit, offset } = args;
    const result = await seoClient.getKeywordRanksAiOverview(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      groupId: group_id,
      keywordIds: keyword_ids,
      limit,
      offset,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async executeGetKeywordsCompetitionAio(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, device, start_date, end_date, group_id, keyword_ids, competitor_domains, limit, offset } = args;
    const result = await seoClient.getCompetitionAiOverview(campaign_id, {
      device,
      startDate: start_date,
      endDate: end_date,
      groupId: group_id,
      keywordIds: keyword_ids,
      competitors: competitor_domains,
      limit,
      offset,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async executeGetDailyGroupVisibilityAioMentions(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, group_id, keyword_ids, domain, limit, offset } = args;
    const result = await seoClient.getDailyGroupVisibilityAioMentions(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      groupId: group_id,
      keywordIds: keyword_ids,
      domain,
      limit,
      offset,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async executeGetDailyGroupVisibilityAioCitations(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, group_id, keyword_ids, domain, limit, offset } = args;
    const result = await seoClient.getDailyGroupVisibilityAioCitations(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      groupId: group_id,
      keywordIds: keyword_ids,
      domain,
      limit,
      offset,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async execute(toolName: string, args: any, seoClient: SEOMonitorClient) {
    switch (toolName) {
      case 'seomonitor_get_daily_keyword_ranks_ai_overview':
        return this.executeGetDailyKeywordRanksAio(args, seoClient);
      case 'seomonitor_get_keywords_competition_ai_overview':
        return this.executeGetKeywordsCompetitionAio(args, seoClient);
      case 'seomonitor_get_daily_group_visibility_ai_overview_mentions':
        return this.executeGetDailyGroupVisibilityAioMentions(args, seoClient);
      case 'seomonitor_get_daily_group_visibility_ai_overview_citations':
        return this.executeGetDailyGroupVisibilityAioCitations(args, seoClient);
      default:
        throw new Error(`Unknown AI Overview tool: ${toolName}`);
    }
  }
}
