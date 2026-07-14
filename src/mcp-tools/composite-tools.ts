import { SEOMonitorClient } from '../clients/seomonitor-client.js';

/**
 * Composite Tools
 * Answer-shaped tools that aggregate or post-process multiple rank-tracker
 * endpoints so one business question maps to one tool call: exact filtered
 * keyword counts, deterministic top-N, one-call campaign overview widgets,
 * per-engine AI Search comparison, and cited landing-page rollups.
 *
 * Ported from the AI Copilot MCP (ai-copilot backend/src/mcp/tools.ts).
 */

const MAX_RESULT_LENGTH = 8000;

const INTENT_VALUES = ['informational', 'commercial', 'transactional', 'navigational'] as const;
const DEVICE_VALUES = ['desktop', 'mobile'] as const;
const TOP_KEYWORD_METRICS = ['volume', 'rank', 'opportunity', 'yoy', 'rank_trend'] as const;
const DIRECTIONS = ['top', 'bottom'] as const;
const AI_SEARCH_ENGINES = ['openai', 'gemini', 'perplexity'] as const;

function defaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function dateArgs(args: any): { startDate: string; endDate: string } {
  const defaults = defaultDateRange();
  return {
    startDate: args.start_date || defaults.startDate,
    endDate: args.end_date || defaults.endDate,
  };
}

function clampedNumber(value: unknown, fallback: number, min: number, max: number): number {
  const n = value === undefined || value === null || value === '' ? fallback : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function asBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function compactJson(data: unknown): string {
  let json = JSON.stringify(data, null, 2);
  if (json.length > MAX_RESULT_LENGTH) json = JSON.stringify(data);
  if (json.length > MAX_RESULT_LENGTH) {
    json = `${json.substring(0, MAX_RESULT_LENGTH)}\n... [TRUNCATED]`;
  }
  return json;
}

function textResult(data: unknown) {
  return { content: [{ type: 'text', text: compactJson(data) }] };
}

function normalizeHost(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return value.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '').toLowerCase() || null;
  }
}

function hostMatches(url: string, host: string | null): boolean {
  if (!host) return true;
  const candidate = normalizeHost(url);
  return !!candidate && (candidate === host || candidate.endsWith(`.${host}`));
}

function hasSerpFeature(keyword: any, device: string, feature: string): boolean {
  const feats = keyword?.serp_data?.[device];
  return Array.isArray(feats) && feats.some((f: any) => String(f?.feature).toUpperCase() === feature.toUpperCase());
}

function hasAioPresence(keyword: any, device: string): boolean {
  return hasSerpFeature(keyword, device, 'AIO')
    || keyword?.ai_overview?.[device]?.any_brand_present === true
    || keyword?.ai_overview?.[device]?.my_brand_present === true;
}

function keywordBrandFlag(keyword: any): boolean | undefined {
  if (typeof keyword?.brand === 'boolean') return keyword.brand;
  if (typeof keyword?.is_brand === 'boolean') return keyword.is_brand;
  if (typeof keyword?.is_brand_keyword === 'boolean') return keyword.is_brand_keyword;
  const labels = String(keyword?.labels ?? '').toLowerCase().split(',').map((x) => x.trim());
  if (labels.some((label) => label === 'brand' || label === 'brands' || label === 'branded')) return true;
  return undefined;
}

function rankBandMatches(rank: unknown, capRank: number, band: string | undefined): boolean {
  if (!band) return true;
  const normalized = band.toLowerCase().replace(/[\s-]+/g, '_');
  const r = typeof rank === 'number' ? rank : Number(rank);
  const finiteRank = Number.isFinite(r) ? r : null;
  const ranking = finiteRank != null && finiteRank < capRank;
  if (normalized === 'top_3') return ranking && finiteRank! <= 3;
  if (normalized === 'top_10') return ranking && finiteRank! <= 10;
  if (normalized === 'top_20') return ranking && finiteRank! <= 20;
  if (['outside_top_20', 'beyond_top_20', 'ranked_outside_top_20', 'not_top_20'].includes(normalized)) {
    return finiteRank != null && finiteRank > 20;
  }
  if (['not_ranking', 'non_ranking', 'unranked'].includes(normalized)) return !ranking;
  if (['ranking', 'ranked'].includes(normalized)) return ranking;
  return true;
}

function collectCitationUrls(value: any, keyHint = ''): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    if (['links', 'citations', 'citation_urls', 'urls'].includes(keyHint)) {
      return value.flatMap((item) => {
        if (typeof item === 'string') return [item];
        if (item && typeof item === 'object') {
          return [item.url, item.href, item.link, item.citation_url].filter((url): url is string => typeof url === 'string');
        }
        return [];
      });
    }
    return value.flatMap((item) => collectCitationUrls(item));
  }
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => collectCitationUrls(child, key));
  }
  return [];
}

function keywordFilterOptions(args: any) {
  return {
    intent: args.intent as string | undefined,
    serpFeature: args.serp_feature as string | undefined,
    rankBand: args.rank_band as string | undefined,
    brand: asBoolean(args.brand),
    aioPresence: asBoolean(args.aio_presence),
    aisPresence: asBoolean(args.ais_presence),
  };
}

function segmentOptions(args: any) {
  return {
    intent: args.intent as string | undefined,
    hasAio: asBoolean(args.has_aio),
    brand: asBoolean(args.brand),
    nonBrand: asBoolean(args.non_brand),
    top10: asBoolean(args.top_10),
  };
}

const KEYWORD_FILTER_SCHEMA = {
  intent: { type: 'string', enum: [...INTENT_VALUES], description: 'Optional: Filter by search intent' },
  serp_feature: { type: 'string', description: 'Optional: Filter by SERP feature code present on the keyword SERP, e.g. AIO, PLC/Local Pack, TOP/Top Stories, PAA, IMG, VID' },
  rank_band: { type: 'string', description: 'Optional: Google rank band filter, e.g. top_3, top_10, top_20, outside_top_20, not_ranking' },
  brand: { type: 'boolean', description: 'Optional: Filter brand-only keywords when true, non-brand keywords when false' },
  aio_presence: { type: 'boolean', description: 'Optional: Filter keywords where Google AI Overview is present on the SERP (SERP presence, not necessarily your brand citation)' },
  ais_presence: { type: 'boolean', description: 'Optional: Filter keywords with AI Search presence/citations across ChatGPT, Gemini, or Perplexity' },
};

const SEGMENT_FILTER_SCHEMA = {
  intent: { type: 'string', enum: [...INTENT_VALUES], description: 'Optional: Strategy segment filter by intent, e.g. commercial' },
  has_aio: { type: 'boolean', description: 'Optional: Strategy segment filter: only keywords whose SERP has AI Overview' },
  brand: { type: 'boolean', description: 'Optional: Strategy segment filter: brand-only keywords' },
  non_brand: { type: 'boolean', description: 'Optional: Strategy segment filter: non-brand keywords' },
  top_10: { type: 'boolean', description: 'Optional: Strategy segment filter: keywords ranking in Google top 10' },
};

const DATE_RANGE_SCHEMA = {
  start_date: { type: 'string', description: 'Optional: Start date (YYYY-MM-DD). Defaults to 30 days ago' },
  end_date: { type: 'string', description: 'Optional: End date (YYYY-MM-DD). Defaults to today' },
};

// Paginate /keywords until the full tracked set (capped at 5000 rows) is in
// memory, so downstream filters/counts are exact instead of page-local.
async function fetchAllKeywords(
  seoClient: SEOMonitorClient,
  campaignId: number,
  args: any,
): Promise<{ rows: any[]; complete: boolean }> {
  const { startDate, endDate } = dateArgs(args);
  const pageSize = 1000;
  const maxRows = 5000;
  const rows: any[] = [];
  let offset = 0;
  let complete = true;

  for (;;) {
    const page = await seoClient.getKeywordData(campaignId, {
      startDate,
      endDate,
      groupId: args.group_id,
      ...keywordFilterOptions(args),
      limit: pageSize,
      offset,
    });
    const pageRows = Array.isArray(page) ? page : [];
    rows.push(...pageRows);
    if (pageRows.length < pageSize) break;

    offset += pageSize;
    if (rows.length >= maxRows) {
      complete = false;
      break;
    }
  }

  return { rows, complete };
}

// Wrap a widget sub-request so one failing endpoint degrades that widget
// instead of failing the whole overview call.
function safe(label: string, p: Promise<any>): Promise<{ label: string; value?: any; error?: string }> {
  return p
    .then((value) => ({ label, value }))
    .catch((e: any) => ({ label, error: String(e?.response?.status || e?.message || 'failed') }));
}

export class CompositeTools {
  static getTopKeywordsDefinition() {
    return {
      name: 'seomonitor_get_top_keywords',
      description: 'Get deterministic top or bottom N keywords ranked server-side across all tracked keywords. Use this for top/bottom/best/worst/highest/lowest keyword questions.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          metric: { type: 'string', enum: [...TOP_KEYWORD_METRICS], description: 'Required: Metric to rank by: volume, rank, opportunity, yoy, or rank_trend' },
          n: { type: 'integer', description: 'Optional: How many keywords to return. Default 10, max 50' },
          direction: { type: 'string', enum: [...DIRECTIONS], description: 'Optional: "top" means best, "bottom" means worst. Default top' },
          group_id: { type: 'string', description: 'Optional: Keyword group ID' },
          search: { type: 'string', description: 'Optional: Filter keywords by search term' },
          ...DATE_RANGE_SCHEMA,
        },
        required: ['campaign_id', 'metric'],
      },
    };
  }

  static getFindKeywordsDefinition() {
    return {
      name: 'seomonitor_find_keywords',
      description: 'Filter keywords across the entire tracked set and return an exact count plus matched rows. Use for "how many keywords..." and whole-campaign filtered questions where paged results from seomonitor_get_keyword_data would give "first page only" answers.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          intent: { type: 'string', enum: [...INTENT_VALUES], description: 'Optional: Search intent filter' },
          rank_max: { type: 'number', description: 'Optional: Keep keywords ranking at or better than this position, e.g. 10 for top 10' },
          rank_min: { type: 'number', description: 'Optional: Keep keywords ranking at or worse than this position' },
          not_ranking: { type: 'boolean', description: 'Optional: true means only keywords not ranking at the tracked depth' },
          volume_min: { type: 'number', description: 'Optional: Minimum search volume' },
          volume_max: { type: 'number', description: 'Optional: Maximum search volume' },
          opportunity_min: { type: 'number', description: 'Optional: Minimum opportunity score' },
          serp_feature: { type: 'string', description: 'Optional: SERP feature code, e.g. AIO, PAA, IMG, VID, ADT' },
          rank_band: { type: 'string', description: 'Optional: Rank band, e.g. top_3, top_10, top_20, outside_top_20, not_ranking' },
          brand: { type: 'boolean', description: 'Optional: Filter brand-only keywords when true, non-brand keywords when false' },
          aio_presence: { type: 'boolean', description: 'Optional: Filter by Google AI Overview SERP presence. Different from in_aio, which is brand presence in the AI Overview' },
          ais_presence: { type: 'boolean', description: 'Optional: Filter by AI Search presence/citations across ChatGPT/Gemini/Perplexity' },
          in_aio: { type: 'boolean', description: 'Optional: Filter by Google AI Overview brand presence' },
          in_ai_search: { type: 'boolean', description: 'Optional: Filter by AI Search brand presence across ChatGPT/Perplexity/Gemini' },
          group_id: { type: 'string', description: 'Optional: Keyword group ID' },
          device: { type: 'string', enum: [...DEVICE_VALUES], description: 'Optional: Device for rank/SERP/AIO filters. Default desktop' },
          limit: { type: 'integer', description: 'Optional: Max matched rows to return. Default 50, max 100' },
          ...DATE_RANGE_SCHEMA,
        },
        required: ['campaign_id'],
      },
    };
  }

  static getTopAiSearchKeywordsDefinition() {
    return {
      name: 'seomonitor_get_top_ai_search_keywords',
      description: 'Top keywords where a brand is present in AI Search across ChatGPT/Perplexity/Gemini. Scans the full tracked set and sorts by search volume. Use only_my_brand:false for any-brand presence, competitor/source gaps, or "other brands present but not us" discovery. Each row includes keyword_id; carry those IDs into seomonitor_get_keyword_ai_search_data or seomonitor_get_top_cited_landing_pages for follow-up evidence.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          only_my_brand: { type: 'boolean', description: 'Optional: true means only your brand presence. false means any brand presence. Default true' },
          n: { type: 'integer', description: 'Optional: Max rows. Default 10, max 50' },
          group_id: { type: 'string', description: 'Optional: Keyword group ID' },
          ...DATE_RANGE_SCHEMA,
        },
        required: ['campaign_id'],
      },
    };
  }

  static getCampaignWidgetsDefinition() {
    return {
      name: 'seomonitor_get_campaign_widgets',
      description: 'Get campaign overview widgets in one call: organic/blended visibility, average Google rank, SERP-feature visibility breakdowns, AI Overview mention percent, AI Search mention percent, and organic/AIO/AIS share of voice with competitor domains. Use for high-level summaries only; for keyword rows use seomonitor_get_keyword_data/seomonitor_find_keywords/seomonitor_get_top_keywords, for per-engine AIS use seomonitor_get_ai_search_engine_performance, and for citation source/landing-page evidence use seomonitor_get_top_cited_landing_pages.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          group_id: { type: 'string', description: 'Optional: Keyword group ID' },
          ...SEGMENT_FILTER_SCHEMA,
          ai_search_engine: { type: 'string', enum: [...AI_SEARCH_ENGINES], description: 'Optional: AI Search engine/provider for AIS widgets: openai=ChatGPT, gemini, or perplexity' },
          date: { type: 'string', description: 'Optional: Snapshot date (YYYY-MM-DD) for share of voice. Defaults to end_date' },
          ...DATE_RANGE_SCHEMA,
        },
        required: ['campaign_id'],
      },
    };
  }

  static getAiSearchEnginePerformanceDefinition() {
    return {
      name: 'seomonitor_get_ai_search_engine_performance',
      description: 'Compare brand performance across AI Search engines: ChatGPT (openai), Gemini, and Perplexity. Use first for any "ChatGPT vs Gemini vs Perplexity" question. Returns per-engine presence/citation trend summaries when the API supports provider filtering, plus enabled_providers/active_provider hints from groups/data. Read enabled_providers before answering; if only openai is enabled or non-openai rows are identical because provider filtering is unavailable, say this is ChatGPT-only/limited rather than inventing a real engine split.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          engines: { type: 'string', description: 'Optional: Comma-separated engines/providers to compare. Default: openai,gemini,perplexity. Use openai for ChatGPT' },
          group_id: { type: 'string', description: 'Optional: Keyword group ID. Use 0 for all keywords. Defaults to 0' },
          ...DATE_RANGE_SCHEMA,
        },
        required: ['campaign_id'],
      },
    };
  }

  static getTopCitedLandingPagesDefinition() {
    return {
      name: 'seomonitor_get_top_cited_landing_pages',
      description: 'MANDATORY for any Google AI Overview or AI Search cited URL/source/domain/landing-page question: "which pages are cited", "where are we cited", "which sources are cited", "are our pages cited", or "citations for those keywords". The tool aggregates citation URLs from AIO/AIS keyword endpoints so large links arrays do not get scrubbed from model context. If the user says "those keywords", pass keyword_ids from the prior result. Use only_campaign_domain:false for all cited sources; use only_campaign_domain:true to check the tracked campaign domain. Do not claim citation URLs are unavailable until this tool has been tried.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'integer', description: 'Required campaign ID' },
          source: { type: 'string', enum: ['aio', 'ais', 'both'], description: 'Optional: Citation source to aggregate. Default both' },
          group_id: { type: 'string', description: 'Optional: Keyword group ID' },
          keyword_ids: { type: 'string', description: 'Optional: Comma-separated keyword IDs' },
          only_campaign_domain: { type: 'boolean', description: 'Optional: true/default: only URLs matching the tracked campaign domain. false: include all cited URLs' },
          domain_filter: { type: 'string', description: 'Optional: Domain/host filter, e.g. example.com. Overrides campaign-domain matching when provided' },
          n: { type: 'integer', description: 'Optional: How many URLs to return. Default 20, max 100' },
          ...DATE_RANGE_SCHEMA,
        },
        required: ['campaign_id'],
      },
    };
  }

  static getAllDefinitions() {
    return [
      this.getTopKeywordsDefinition(),
      this.getFindKeywordsDefinition(),
      this.getTopAiSearchKeywordsDefinition(),
      this.getCampaignWidgetsDefinition(),
      this.getAiSearchEnginePerformanceDefinition(),
      this.getTopCitedLandingPagesDefinition(),
    ];
  }

  static async executeGetTopKeywords(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, metric } = args;
    const { startDate, endDate } = dateArgs(args);
    const limit = clampedNumber(args.n, 10, 1, 50);
    const direction = args.direction === 'bottom' ? 'bottom' : 'top';
    const orderByMap: Record<string, string> = {
      volume: 'search_volume',
      rank: 'rank',
      opportunity: 'opportunity',
      yoy: 'year-over-year',
      rank_trend: 'rank_trend',
    };
    const orderBy = orderByMap[metric];
    if (!orderBy) throw new Error(`metric must be one of: ${TOP_KEYWORD_METRICS.join(', ')}`);
    const wantTop = direction === 'top';
    const bestIsAsc = metric === 'rank';
    const orderDirection: 'asc' | 'desc' = bestIsAsc === wantTop ? 'asc' : 'desc';

    const rows = await seoClient.getKeywordData(campaign_id, {
      startDate,
      endDate,
      search: args.search,
      groupId: args.group_id,
      orderBy,
      orderDirection,
      limit,
    });

    const list = Array.isArray(rows) ? rows : [];
    const keywords = list.slice(0, limit).map((k: any) => ({
      keyword: k.keyword,
      keyword_id: k.keyword_id,
      search_volume: k.search_data?.search_volume ?? null,
      desktop_rank: k.ranking_data?.desktop?.rank ?? null,
      mobile_rank: k.ranking_data?.mobile?.rank ?? null,
      opportunity: k.opportunity ?? null,
    }));

    return textResult({
      metric,
      order_by: orderBy,
      order_direction: orderDirection,
      direction,
      count: keywords.length,
      complete: true,
      note: `True ${direction} ${keywords.length} by ${orderBy}, ranked server-side across all tracked keywords.`,
      keywords,
    });
  }

  static async executeFindKeywords(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id } = args;
    const intent = args.intent as string | undefined;
    const device: string = args.device === 'mobile' ? 'mobile' : 'desktop';
    const limit = clampedNumber(args.limit, 50, 1, 100);
    const { rows, complete } = await fetchAllKeywords(seoClient, campaign_id, args);

    const rankMax = args.rank_max != null ? Number(args.rank_max) : null;
    const rankMin = args.rank_min != null ? Number(args.rank_min) : null;
    const notRanking = asBoolean(args.not_ranking);
    const volumeMin = args.volume_min != null ? Number(args.volume_min) : null;
    const volumeMax = args.volume_max != null ? Number(args.volume_max) : null;
    const opportunityMin = args.opportunity_min != null ? Number(args.opportunity_min) : null;
    const serpFeature = args.serp_feature as string | undefined;
    const rankBand = args.rank_band as string | undefined;
    const brand = asBoolean(args.brand);
    const aioPresence = asBoolean(args.aio_presence);
    const aisPresence = asBoolean(args.ais_presence);
    const inAio = asBoolean(args.in_aio);
    const inAiSearch = asBoolean(args.in_ai_search);
    // The API reports "not ranking" as the tracked depth cap (e.g. 101), so the
    // max observed rank marks the not-ranking sentinel.
    const capRank = rows.reduce((m: number, k: any) => {
      const r = k?.ranking_data?.[device]?.rank;
      return typeof r === 'number' && r > m ? r : m;
    }, -Infinity);

    const rankOf = (k: any) => k?.ranking_data?.[device]?.rank;
    const isRanking = (r: unknown) => typeof r === 'number' && r < capRank;

    const matched = rows.filter((k: any) => {
      if (intent && k.search_intent !== intent) return false;
      const r = rankOf(k);
      if (notRanking === true && isRanking(r)) return false;
      if (notRanking === false && !isRanking(r)) return false;
      if (rankMax != null && !(isRanking(r) && (r as number) <= rankMax)) return false;
      if (rankMin != null && !(typeof r === 'number' && r >= rankMin)) return false;
      if (!rankBandMatches(r, capRank, rankBand)) return false;
      const vol = k.search_data?.search_volume;
      if (volumeMin != null && !(typeof vol === 'number' && vol >= volumeMin)) return false;
      if (volumeMax != null && !(typeof vol === 'number' && vol <= volumeMax)) return false;
      if (opportunityMin != null && !(typeof k.opportunity === 'number' && k.opportunity >= opportunityMin)) return false;
      if (serpFeature && !hasSerpFeature(k, device, serpFeature)) return false;
      const keywordBrand = keywordBrandFlag(k);
      if (brand != null && keywordBrand != null && keywordBrand !== brand) return false;
      if (aioPresence === true && !hasAioPresence(k, device)) return false;
      if (aioPresence === false && hasAioPresence(k, device)) return false;
      if (aisPresence === true && k.ai_search?.any_brand_presence !== true && k.ai_search?.my_brand_presence !== true) return false;
      if (aisPresence === false && (k.ai_search?.any_brand_presence === true || k.ai_search?.my_brand_presence === true)) return false;
      if (inAio === true && k.ai_overview?.[device]?.any_brand_present !== true) return false;
      if (inAio === false && k.ai_overview?.[device]?.any_brand_present === true) return false;
      if (inAiSearch === true && k.ai_search?.any_brand_presence !== true) return false;
      if (inAiSearch === false && k.ai_search?.any_brand_presence === true) return false;
      return true;
    });

    const keywords = matched.slice(0, limit).map((k: any) => ({
      keyword: k.keyword,
      keyword_id: k.keyword_id,
      intent: k.search_intent ?? null,
      desktop_rank: k.ranking_data?.desktop?.rank ?? null,
      mobile_rank: k.ranking_data?.mobile?.rank ?? null,
      search_volume: k.search_data?.search_volume ?? null,
      opportunity: k.opportunity ?? null,
      rank_band: rankBand,
      brand: keywordBrandFlag(k) ?? null,
      aio_presence: hasAioPresence(k, device),
      ais_presence: k.ai_search?.any_brand_presence ?? k.ai_search?.my_brand_presence ?? null,
      in_aio: k.ai_overview?.[device]?.any_brand_present ?? null,
      in_ai_search: k.ai_search?.any_brand_presence ?? null,
    }));

    return textResult({
      filters: {
        intent,
        rank_max: rankMax,
        rank_min: rankMin,
        not_ranking: notRanking,
        volume_min: volumeMin,
        volume_max: volumeMax,
        opportunity_min: opportunityMin,
        serp_feature: serpFeature,
        rank_band: rankBand,
        brand,
        aio_presence: aioPresence,
        ais_presence: aisPresence,
        in_aio: inAio,
        in_ai_search: inAiSearch,
        group_id: args.group_id,
        device,
      },
      total_scanned: rows.length,
      total_matched: matched.length,
      returned: keywords.length,
      complete,
      note: `Scanned ${rows.length} tracked keywords. A rank of ${capRank === -Infinity ? 'n/a' : capRank} is treated as not ranking.`,
      keywords,
    });
  }

  static async executeGetTopAiSearchKeywords(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id } = args;
    const limit = clampedNumber(args.n, 10, 1, 50);
    const myOnly = asBoolean(args.only_my_brand) !== false;
    const { rows, complete } = await fetchAllKeywords(seoClient, campaign_id, args);
    const present = (k: any) => myOnly ? k.ai_search?.my_brand_presence === true : k.ai_search?.any_brand_presence === true;
    const matched = rows
      .filter(present)
      .sort((a: any, b: any) => (b.search_data?.search_volume ?? 0) - (a.search_data?.search_volume ?? 0));
    const keywords = matched.slice(0, limit).map((k: any) => ({
      keyword: k.keyword,
      keyword_id: k.keyword_id,
      search_volume: k.search_data?.search_volume ?? null,
      ai_search_rank: k.ai_search?.rank ?? null,
      my_brand_present: k.ai_search?.my_brand_presence ?? null,
      any_brand_present: k.ai_search?.any_brand_presence ?? null,
      sentiment: k.ai_search?.sentiment_of_my_brand ?? null,
    }));

    return textResult({
      scope: myOnly ? 'my_brand_present' : 'any_brand_present',
      total_scanned: rows.length,
      total_matched: matched.length,
      returned: keywords.length,
      complete,
      note: `Scanned ${rows.length} keywords; ${matched.length} have ${myOnly ? 'your brand' : 'a brand'} present in AI Search.`,
      keywords,
    });
  }

  static async executeGetCampaignWidgets(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id } = args;
    const { startDate, endDate } = dateArgs(args);
    const groupId = args.group_id;
    const segments = segmentOptions(args);
    const provider = AI_SEARCH_ENGINES.includes(args.ai_search_engine) ? args.ai_search_engine : undefined;
    const sovDate = args.date || endDate;

    const [camp, vis, aio, ais, sov] = await Promise.all([
      safe('tracked_campaign', seoClient.getTrackedCampaigns({ campaign_ids: String(campaign_id) })),
      safe('daily_visibility', seoClient.getDailyGroupVisibility(campaign_id, { startDate, endDate, groupId, ...segments })),
      safe('aio_mentions', seoClient.getDailyGroupVisibilityAioMentions(campaign_id, { startDate, endDate, groupId, ...segments })),
      safe('ai_search_mentions', seoClient.getDailyGroupAisMentions(campaign_id, { startDate, endDate, groupId, ...segments, provider })),
      safe('share_of_voice', seoClient.getShareOfVoice(campaign_id, { date: sovDate })),
    ]);
    const errors = [camp, vis, aio, ais, sov]
      .filter((r) => r.error)
      .reduce((acc: Record<string, string>, r) => ({ ...acc, [r.label]: String(r.error) }), {});
    const last = (arr: any) => Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null;
    const campValue: any = camp.value;
    const sovValue: any = sov.value;
    const campObj = Array.isArray(campValue) ? campValue[0] : (campValue?.data?.[0] ?? null);
    const visLast = last(vis.value);
    const aioLast = last(aio.value);
    const aisLast = last(ais.value);
    const sovTop = (s: any) => (
      Array.isArray(s?.domains)
        ? s.domains.slice(0, 5).map((d: any) => ({
          domain: d.domain,
          share_of_voice: d.share_of_voice,
          is_us: d.is_campaign_website,
        }))
        : null
    );

    return textResult({
      visibility: visLast?.visibility ?? null,
      visibility_source: visLast ? 'daily_visibility_requested_range' : null,
      current_campaign_visibility: campObj?.visibility ?? null,
      avg_rank: visLast?.avg_rank ?? null,
      feature_visibility: visLast?.feature_visibility ?? null,
      feature_visibility_breakdown: visLast?.feature_visibility_breakdown ?? null,
      aio_mention_pct: aioLast?.aio_mentions_visibility ?? null,
      ai_search_mention_pct: aisLast?.brand_presence_visibility ?? null,
      ai_search_engine: provider ?? 'aggregate/default',
      total_keywords: sovValue ? sovValue.total_keywords ?? null : null,
      total_search_volume: sovValue ? sovValue.total_search_volume ?? null : null,
      share_of_voice: sovValue ? {
        organic: sovTop(sovValue.organic_share_of_voice),
        ai_overview: sovTop(sovValue.ai_overview_share_of_voice),
        ai_search: sovTop(sovValue.ai_search_share_of_voice),
      } : null,
      filters: { group_id: groupId, ...segments },
      as_of: { range: `${startDate}..${endDate}`, sov_date: sovDate },
      errors: Object.keys(errors).length ? errors : undefined,
    });
  }

  static async executeGetAiSearchEnginePerformance(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id } = args;
    const { startDate, endDate } = dateArgs(args);
    const groupId: string = args.group_id || '0';
    const engines: string[] = (args.engines || 'openai,gemini,perplexity')
      .split(',')
      .map((engine: string) => engine.trim())
      .filter(Boolean);
    const last = (arr: any) => Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null;

    const groupData = await safe('group_data', seoClient.getGroupData(campaign_id, groupId, { startDate, endDate }));
    const engineRows = await Promise.all(engines.map(async (engine) => {
      const [mentions, citations] = await Promise.all([
        safe(`${engine}_mentions`, seoClient.getDailyGroupAisMentions(campaign_id, { startDate, endDate, groupId, provider: engine, engine })),
        safe(`${engine}_citations`, seoClient.getDailyGroupAisCitations(campaign_id, { startDate, endDate, groupId, provider: engine, engine })),
      ]);
      const mentionRows = mentions.value;
      const citationRows = citations.value;
      const mentionLast = last(mentionRows);
      const citationLast = last(citationRows);
      return {
        engine,
        brand_presence_latest: mentionLast?.brand_presence_visibility ?? null,
        source_citation_latest: citationLast?.source_citation_visibility ?? citationLast?.citation_visibility ?? null,
        mentions_points: Array.isArray(mentionRows) ? mentionRows.length : 0,
        citations_points: Array.isArray(citationRows) ? citationRows.length : 0,
        errors: [mentions, citations].filter((r) => r.error).reduce((acc: Record<string, string>, r) => ({ ...acc, [r.label]: String(r.error) }), {}),
      };
    }));

    const groupValue: any = groupData.value;
    const groupFirst = Array.isArray(groupValue) ? groupValue[0] : null;
    return textResult({
      as_of: { start_date: startDate, end_date: endDate },
      group_id: groupId,
      enabled_providers: groupFirst?.ai_search?.enabled_providers ?? null,
      active_provider: groupFirst?.ai_search?.active_provider ?? null,
      note: 'openai maps to ChatGPT. If all engines return identical values while enabled_providers has one item, the upstream account may only have one provider enabled or may ignore provider filters.',
      engines: engineRows,
      errors: groupData.error ? { group_data: String(groupData.error) } : undefined,
    });
  }

  static async executeGetTopCitedLandingPages(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id } = args;
    const { startDate, endDate } = dateArgs(args);
    const source: string = ['aio', 'ais', 'both'].includes(args.source) ? args.source : 'both';
    const n = clampedNumber(args.n, 20, 1, 100);
    const groupId = args.group_id;
    const keywordIds = args.keyword_ids;
    const onlyCampaignDomain = asBoolean(args.only_campaign_domain) !== false;
    let host = normalizeHost(args.domain_filter);

    if (!host && onlyCampaignDomain) {
      const campaigns: any = await seoClient.getTrackedCampaigns({ campaign_ids: String(campaign_id), limit: 1 });
      const campaign = Array.isArray(campaigns) ? campaigns[0] : campaigns?.data?.[0];
      host = normalizeHost(campaign?.campaign_info?.domain ?? campaign?.domain);
    }

    const pageSize = 1000;
    const maxRows = 5000;
    const rows: Array<{ source: string; row: any }> = [];
    // One source erroring upstream (e.g. AIO not provisioned for the campaign
    // returns HTTP 500) must not sink citations from the other source.
    const sourceErrors: Record<string, string> = {};
    async function collectPages(kind: 'aio' | 'ais') {
      let offset = 0;
      try {
        for (;;) {
          const page = kind === 'aio'
            ? await seoClient.getKeywordAiOverview(campaign_id, { startDate, endDate, groupId, keywordIds, limit: pageSize, offset })
            : await seoClient.getKeywordAiSearch(campaign_id, { startDate, endDate, groupId, keywordIds, limit: pageSize, offset, skipHtml: true });
          const pageRows = Array.isArray(page) ? page : [];
          rows.push(...pageRows.map((row: any) => ({ source: kind, row })));
          if (pageRows.length < pageSize || rows.length >= maxRows) break;
          offset += pageSize;
        }
      } catch (e: any) {
        sourceErrors[kind] = String(e?.response?.status || e?.message || 'failed');
      }
    }

    if (source === 'aio' || source === 'both') await collectPages('aio');
    if (source === 'ais' || source === 'both') await collectPages('ais');
    if (Object.keys(sourceErrors).length && rows.length === 0 && source !== 'both') {
      throw new Error(`Citation source ${source} failed upstream: HTTP ${sourceErrors[source]}`);
    }

    const byUrl = new Map<string, {
      url: string;
      citation_count: number;
      aio_citations: number;
      ais_citations: number;
      keyword_ids: Set<string>;
      sample_keywords: Set<string>;
    }>();

    for (const item of rows) {
      const urls = collectCitationUrls(item.row).filter((url) => typeof url === 'string' && /^https?:\/\//i.test(url));
      for (const url of urls) {
        if (!hostMatches(url, host)) continue;
        const current = byUrl.get(url) ?? {
          url,
          citation_count: 0,
          aio_citations: 0,
          ais_citations: 0,
          keyword_ids: new Set<string>(),
          sample_keywords: new Set<string>(),
        };
        current.citation_count += 1;
        if (item.source === 'aio') current.aio_citations += 1;
        if (item.source === 'ais') current.ais_citations += 1;
        if (item.row?.keyword_id != null) current.keyword_ids.add(String(item.row.keyword_id));
        if (item.row?.keyword) current.sample_keywords.add(String(item.row.keyword));
        byUrl.set(url, current);
      }
    }

    const pages = [...byUrl.values()]
      .sort((a, b) => b.citation_count - a.citation_count)
      .slice(0, n)
      .map((page) => ({
        url: page.url,
        citation_count: page.citation_count,
        aio_citations: page.aio_citations,
        ais_citations: page.ais_citations,
        keyword_count: page.keyword_ids.size,
        sample_keywords: [...page.sample_keywords].slice(0, 5),
      }));

    return textResult({
      source,
      host_filter: host,
      total_keyword_rows_scanned: rows.length,
      returned: pages.length,
      source_errors: Object.keys(sourceErrors).length ? sourceErrors : undefined,
      pages,
    });
  }

  static async execute(toolName: string, args: any, seoClient: SEOMonitorClient) {
    switch (toolName) {
      case 'seomonitor_get_top_keywords':
        return this.executeGetTopKeywords(args, seoClient);
      case 'seomonitor_find_keywords':
        return this.executeFindKeywords(args, seoClient);
      case 'seomonitor_get_top_ai_search_keywords':
        return this.executeGetTopAiSearchKeywords(args, seoClient);
      case 'seomonitor_get_campaign_widgets':
        return this.executeGetCampaignWidgets(args, seoClient);
      case 'seomonitor_get_ai_search_engine_performance':
        return this.executeGetAiSearchEnginePerformance(args, seoClient);
      case 'seomonitor_get_top_cited_landing_pages':
        return this.executeGetTopCitedLandingPages(args, seoClient);
      default:
        throw new Error(`Unknown composite tool: ${toolName}`);
    }
  }
}
