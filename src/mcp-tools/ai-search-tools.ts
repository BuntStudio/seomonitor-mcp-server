import { SEOMonitorClient } from '../clients/seomonitor-client.js';

// What `content` holds depends on the provider: OpenAI records store the
// extracted answer as semantic HTML (~1.5-3.5 KB, quotable), Gemini records
// store the whole rendered page DOM (~1.8 MB measured). This tool serialises
// the API response as-is, so an unguarded Gemini pull would push megabytes into
// the caller's context. Keep answers, drop page dumps.
const MAX_CONTENT_CHARS = 20_000;
const PAGE_DOM_MARKERS = /<html|<!DOCTYPE|<script/i;

function pruneRawContent(result: any): { data: any; omitted: number } {
  let omitted = 0;
  if (!Array.isArray(result)) return { data: result, omitted };
  const data = result.map((row: any) => ({
    ...row,
    ai_search_data: Array.isArray(row?.ai_search_data)
      ? row.ai_search_data.map((week: any) => {
        const content = typeof week?.content === 'string' ? week.content : '';
        if (!content || (content.length <= MAX_CONTENT_CHARS && !PAGE_DOM_MARKERS.test(content))) return week;
        omitted += 1;
        return {
          ...week,
          content: '',
          content_omitted: `Stored content for this record is the raw rendered page (${content.length} characters), not the extracted answer. Omitted so it cannot flood the context. Do not claim the answer text is unavailable in general — other providers do return the answer.`,
        };
      })
      : row?.ai_search_data,
  }));
  return { data, omitted };
}

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
      description: 'Per-keyword AI Search (AIS) data: whether the brand was NAMED in the answer (my_brand_present), which URLs were CITED as sources (citations), and the tracked domain\'s citation rank. Naming and citing are independent signals — report them separately, never as one "presence" number. The answer text is empty by default; set include_raw_content to get it where it exists.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          group_id: { type: 'string', description: 'Optional: Specific group ID' },
          limit: { type: 'integer', description: 'Optional: Results limit' },
          offset: { type: 'integer', description: 'Optional: Pagination offset' },
          ai_search_llm: { type: 'string', enum: ['openai', 'gemini', 'perplexity'], description: 'Optional: Which AI Search engine to read (openai = ChatGPT). Defaults to the campaign\'s active provider. A provider the campaign has not enabled returns empty or residual rows rather than an error — check enabled_providers via seomonitor_get_ai_search_engine_performance before reading a low number as low visibility' },
          content_encoding: { type: 'string', description: 'Optional: Encoding for returned AI Search content' },
          include_raw_content: { type: 'boolean', description: 'Optional: return the stored answer content (sends skip_html=false; without it every content field is empty). What comes back depends on the engine: OpenAI records hold the extracted answer as semantic HTML around 2 KB, safe to read and quote with its inline source links. Gemini records hold the whole rendered page instead — those are dropped and flagged with content_omitted, so a missing answer for one engine says nothing about the others' },
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
          ai_search_llm: { type: 'string', enum: ['openai', 'gemini', 'perplexity'], description: 'Optional: Which AI Search engine to read (openai = ChatGPT). Defaults to the campaign\'s active provider' },
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
          ai_search_llm: { type: 'string', enum: ['openai', 'gemini', 'perplexity'], description: 'Optional: Which AI Search engine to read (openai = ChatGPT). Defaults to the campaign\'s active provider' },
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
    const { campaign_id, start_date, end_date, group_id, limit, offset, content_encoding, include_raw_content, ai_search_llm } = args;
    // The API only returns stored HTML when skip_html is explicitly false; the
    // default omits the flag and every content field comes back empty.
    const result = await seoClient.getKeywordAiSearch(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      groupId: group_id,
      limit,
      offset,
      contentEncoding: content_encoding,
      skipHtml: include_raw_content === true ? false : true,
      provider: ai_search_llm,
    });
    // The API drops to a bare [] when the campaign has no crawl dates or no
    // rows in range, and an array has nowhere to carry enablement — which is
    // exactly when the caller most needs to know the engine isn't tracked here.
    // Fetch it separately so an empty result is never mistaken for zero
    // visibility.
    const rows = Array.isArray(result) ? result : [];
    let enabledProviders: string[] | null = rows[0]?.ai_search_provider?.enabled_providers ?? null;
    let activeProvider: string | null = rows[0]?.ai_search_provider?.active_provider ?? null;
    if (enabledProviders === null) {
      try {
        const groups: any = await seoClient.getGroupData(campaign_id, group_id || '0', { startDate: start_date, endDate: end_date });
        const first = Array.isArray(groups) ? groups[0] : null;
        enabledProviders = first?.ai_search?.enabled_providers ?? null;
        // An explicit ai_search_llm IS the provider the rows came from — the
        // group lookup is unfiltered and would report the campaign default.
        activeProvider = activeProvider ?? ai_search_llm ?? first?.ai_search?.active_provider ?? null;
      } catch {
        // Enablement is context, not the answer — a failure here must not sink the read.
      }
    }
    const requested = ai_search_llm ?? null;
    const context = {
      requested_provider: requested,
      active_provider: activeProvider,
      enabled_providers: enabledProviders,
      requested_provider_enabled: requested && Array.isArray(enabledProviders) ? enabledProviders.includes(requested) : null,
      keywords_returned: rows.length,
      note: Array.isArray(enabledProviders) && enabledProviders.length === 0
        ? 'This campaign has no AI Search engine enabled, so there is nothing to report — say that rather than reporting zero visibility.'
        : 'If requested_provider_enabled is false, this engine is not tracked on this campaign: an empty or low result means untracked, not absent from AI answers.',
    };

    if (include_raw_content !== true) {
      return { content: [{ type: 'text', text: JSON.stringify({ ai_search_provider: context, keywords: rows }, null, 2) }] };
    }
    const { data, omitted } = pruneRawContent(result);
    return { content: [{ type: 'text', text: JSON.stringify({ ai_search_provider: context, records_with_content_omitted: omitted, keywords: data }, null, 2) }] };
  }

  static async executeGetKeywordsCompetitionAis(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, group_id, keyword_ids, competitor_domains, limit, offset, order_by, order_direction, search, ai_search_llm } = args;
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
      provider: ai_search_llm,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async executeGetDailyAiSearchKeywordRanks(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, domain, group_id, keyword_ids, get_archive, limit, offset, search, ai_search_llm } = args;
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
      provider: ai_search_llm,
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
