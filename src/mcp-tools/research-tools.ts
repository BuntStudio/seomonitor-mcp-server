import { SEOMonitorClient } from '../clients/seomonitor-client.js';

/**
 * Keyword Research Tools - Phase 4 Implementation
 * Research capabilities and domain analysis
 */
export class ResearchTools {
  /**
   * Get related keywords tool definition
   */
  static getRelatedKeywordsDefinition() {
    return {
      name: 'seomonitor_get_related_keywords',
      title: 'Get Related Keywords',
      annotations: { title: 'Get Related Keywords', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Find related keyword suggestions for a topic',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
          keyword: {
            type: 'string',
            description: 'Required: Topic keyword for which to find related keywords',
          },
          limit: {
            type: 'integer',
            description: 'Optional: Results limit (max 1000)',
          },
          offset: {
            type: 'integer',
            description: 'Optional: Pagination offset',
          },
          order_by: {
            type: 'string',
            description: 'Optional: Sort field',
          },
          order_direction: {
            type: 'string',
            description: 'Optional: Sort direction (asc or desc)',
          },
        },
        required: ['campaign_id', 'keyword'],
      },
    };
  }

  /**
   * Get topic overview tool definition
   */
  static getTopicOverviewDefinition() {
    return {
      name: 'seomonitor_get_topic_overview',
      title: 'Get Topic Overview',
      annotations: { title: 'Get Topic Overview', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Get aggregated search, SERP, and visibility data for topic keywords',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
          keyword: {
            type: 'string',
            description: 'Required: Topic keyword for analysis',
          },
        },
        required: ['campaign_id', 'keyword'],
      },
    };
  }

  /**
   * Get domain overview tool definition
   */
  static getDomainOverviewDefinition() {
    return {
      name: 'seomonitor_get_domain_overview',
      title: 'Get Domain Overview',
      annotations: { title: 'Get Domain Overview', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'SEO overview for any domain — ranking keyword count, search volume and year-over-year trend — read against one of your campaigns. The campaign supplies the market, so there is no country or language to pass; use a campaign tracking the market you care about.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID. Supplies the market the domain is read in',
          },
          url: {
            type: 'string',
            description: 'Required domain or URL to look up, without protocol (e.g. nike.com)',
          },
          gap_analysis: {
            type: 'string',
            enum: ['all-keywords', 'overlapping', 'non-overlapping'],
            description: 'Optional: restrict to keywords the campaign also ranks for (overlapping) or does not (non-overlapping). Default all-keywords',
          },
        },
        required: ['campaign_id', 'url'],
      },
    };
  }

  /**
   * Get domain ranking keywords tool definition
   */
  static getDomainRankingKeywordsDefinition() {
    return {
      name: 'seomonitor_get_domain_ranking_keywords',
      title: 'Get Domain Ranking Keywords',
      annotations: { title: 'Get Domain Ranking Keywords', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'The keywords any domain ranks for, read against one of your campaigns. The campaign supplies the market, so there is no country or language to pass. Use gap_analysis to answer competitor-gap questions: overlapping for keywords you both rank for, non-overlapping for the ones only they have.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID. Supplies the market the domain is read in',
          },
          url: {
            type: 'string',
            description: 'Required domain or URL to look up, without protocol (e.g. nike.com)',
          },
          gap_analysis: {
            type: 'string',
            enum: ['all-keywords', 'overlapping', 'non-overlapping'],
            description: 'Optional: overlapping = keywords the campaign ranks for too, non-overlapping = only this domain. Default all-keywords',
          },
          limit: {
            type: 'number',
            description: 'Optional: Results limit, max 1000. Default is the API default',
          },
          offset: {
            type: 'number',
            description: 'Optional: Pagination offset',
          },
          order_by: {
            type: 'string',
            enum: ['search_volume', 'year-over-year', 'rank', 'rank_trend', 'my_rank', 'my_rank_trend', 'percentage_clicks'],
            description: 'Optional: sort field. my_rank/my_rank_trend refer to the campaign, rank/rank_trend to the looked-up domain',
          },
          order_direction: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: 'Optional: sort direction',
          },
          search: {
            type: 'string',
            description: 'Optional: substring filter on the keyword',
          },
        },
        required: ['campaign_id', 'url'],
      },
    };
  }

  /**
   * Get research keyword data tool definition
   */
  static getResearchKeywordDataDefinition() {
    return {
      name: 'seomonitor_get_research_keyword_data',
      title: 'Get Research Keyword Data',
      annotations: { title: 'Get Research Keyword Data', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Research-specific keyword metrics and SERP data',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
          keywords: {
            type: 'string',
            description: 'Required: Comma-separated list of keywords',
          },
          limit: {
            type: 'integer',
            description: 'Optional: Results limit',
          },
          offset: {
            type: 'integer',
            description: 'Optional: Pagination offset',
          },
        },
        required: ['campaign_id', 'keywords'],
      },
    };
  }

  /**
   * Get research ranking data tool definition
   */
  static getResearchRankingDataDefinition() {
    return {
      name: 'seomonitor_get_research_ranking_data',
      title: 'Get Research Ranking Data',
      annotations: { title: 'Get Research Ranking Data', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'SERP, search, and ranking data for keywords with competitor analysis',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
          keywords: {
            type: 'string',
            description: 'Required: Comma-separated list of keywords',
          },
          domains: {
            type: 'string',
            description: 'Optional: Domains for comparison',
          },
          limit: {
            type: 'integer',
            description: 'Optional: Results limit',
          },
          offset: {
            type: 'integer',
            description: 'Optional: Pagination offset',
          },
        },
        required: ['campaign_id', 'keywords', 'domains'],
      },
    };
  }

  /**
   * Execute get_related_keywords tool
   */
  static async executeGetRelatedKeywords(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, keyword, limit, offset, order_by, order_direction } = args;

    const result = await seoClient.getRelatedKeywords(campaign_id, keyword, {
      limit,
      offset,
      orderBy: order_by,
      orderDirection: order_direction,
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
   * Execute get_topic_overview tool
   */
  static async executeGetTopicOverview(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, keyword } = args;

    const result = await seoClient.getTopicOverview(campaign_id, keyword);

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
   * Execute get_domain_overview tool
   */
  static async executeGetDomainOverview(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, url, gap_analysis } = args;

    const result = await seoClient.getDomainOverview(campaign_id, url, {
      gapAnalysis: gap_analysis,
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
   * Execute get_domain_ranking_keywords tool
   */
  static async executeGetDomainRankingKeywords(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, url, gap_analysis, limit, offset, order_by, order_direction, search } = args;

    const result = await seoClient.getRankingKeywords(campaign_id, url, {
      gapAnalysis: gap_analysis,
      limit,
      offset,
      orderBy: order_by,
      orderDirection: order_direction,
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
   * Execute get_research_keyword_data tool
   */
  static async executeGetResearchKeywordData(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, keywords, limit, offset } = args;

    const result = await seoClient.getResearchKeywords(campaign_id, keywords, {
      limit,
      offset,
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
   * Execute get_research_ranking_data tool
   */
  static async executeGetResearchRankingData(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, keywords, domains, limit, offset } = args;

    const result = await seoClient.getResearchRankingData(campaign_id, keywords, {
      domains,
      limit,
      offset,
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
      this.getRelatedKeywordsDefinition(),
      this.getTopicOverviewDefinition(),
      this.getDomainOverviewDefinition(),
      this.getDomainRankingKeywordsDefinition(),
      this.getResearchKeywordDataDefinition(),
      this.getResearchRankingDataDefinition(),
    ];
  }

  /**
   * Execute tool based on name
   */
  static async execute(toolName: string, args: any, seoClient: SEOMonitorClient) {
    switch (toolName) {
      case 'seomonitor_get_related_keywords':
        return this.executeGetRelatedKeywords(args, seoClient);
      case 'seomonitor_get_topic_overview':
        return this.executeGetTopicOverview(args, seoClient);
      case 'seomonitor_get_domain_overview':
        return this.executeGetDomainOverview(args, seoClient);
      case 'seomonitor_get_domain_ranking_keywords':
        return this.executeGetDomainRankingKeywords(args, seoClient);
      case 'seomonitor_get_research_keyword_data':
        return this.executeGetResearchKeywordData(args, seoClient);
      case 'seomonitor_get_research_ranking_data':
        return this.executeGetResearchRankingData(args, seoClient);
      default:
        throw new Error(`Unknown research tool: ${toolName}`);
    }
  }
}