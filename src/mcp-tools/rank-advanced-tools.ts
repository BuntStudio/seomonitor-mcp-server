import { SEOMonitorClient } from '../clients/seomonitor-client.js';

/**
 * Advanced Rank Tracking Tools - Phase 3 Implementation
 * SERP features, competition analysis, and advanced ranking data
 */
export class RankAdvancedTools {
  /**
   * Get keywords competition tool definition
   */
  static getKeywordsCompetitionDefinition() {
    return {
      name: 'seomonitor_get_keywords_competition',
      title: 'Get Keywords Competition',
      annotations: { title: 'Get Keywords Competition', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Competitor analysis for keywords',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
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
          keyword_ids: {
            type: 'string',
            description: 'Optional: Specific keyword IDs',
          },
          competitor_domains: {
            type: 'string',
            description: 'Optional: Competitor domains (comma-separated)',
          },
          device: {
            type: 'string',
            description: 'Required: Device type (desktop or mobile)',
          },
          group_id: {
            type: 'string',
            description: 'Optional: Specific group ID',
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
        required: ['campaign_id', 'device', 'start_date', 'end_date'],
      },
    };
  }

  /**
   * Get SERP feature presence tool definition
   */
  static getSerpFeaturePresenceDefinition() {
    return {
      name: 'seomonitor_get_serp_feature_presence',
      title: 'Get SERP Feature Presence',
      annotations: { title: 'Get SERP Feature Presence', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'SERP feature tracking over time',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
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
          keyword_ids: {
            type: 'string',
            description: 'Optional: Specific keyword IDs',
          },
          group_id: {
            type: 'string',
            description: 'Optional: Specific group ID',
          },
          limit: {
            type: 'integer',
            description: 'Optional: Results limit (max 1000)',
          },
          offset: {
            type: 'integer',
            description: 'Optional: Pagination offset',
          },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  /**
   * Get top results tool definition
   */
  static getTopResultsDefinition() {
    return {
      name: 'seomonitor_get_top_results',
      title: 'Get Top Results',
      annotations: { title: 'Get Top Results', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Top 100 SERP results for keywords',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
          device: {
            type: 'string',
            description: 'Required: Device type (desktop or mobile)',
          },
          date: {
            type: 'string',
            description: 'Specific date (YYYY-MM-DD)',
          },
          keyword_ids: {
            type: 'string',
            description: 'Optional: Specific keyword IDs',
          },
          limit: {
            type: 'integer',
            description: 'Optional: Results limit',
          },
          offset: {
            type: 'integer',
            description: 'Optional: Pagination offset',
          },
          group_id: {
            type: 'string',
            description: 'Optional: Specific group ID',
          },
        },
        required: ['campaign_id', 'device', 'date'],
      },
    };
  }

  /**
   * Get keyword AI overview tool definition
   */
  static getKeywordAiOverviewDefinition() {
    return {
      name: 'seomonitor_get_keyword_ai_overview',
      title: 'Get Keyword AI Overview',
      annotations: { title: 'Get Keyword AI Overview', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'AI Overview presence data for keywords',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
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
          keyword_ids: {
            type: 'string',
            description: 'Optional: Specific keyword IDs',
          },
          group_id: {
            type: 'string',
            description: 'Optional: Specific group ID',
          },
          limit: {
            type: 'integer',
            description: 'Optional: Results limit (max 1000)',
          },
          offset: {
            type: 'integer',
            description: 'Optional: Pagination offset',
          },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  /**
   * Get ranking pages tool definition
   */
  static getRankingPagesDefinition() {
    return {
      name: 'seomonitor_get_ranking_pages',
      title: 'Get Ranking Pages',
      annotations: { title: 'Get Ranking Pages', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Pages ranking for specific keywords',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
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
          keyword_ids: {
            type: 'string',
            description: 'Optional: Specific keyword IDs',
          },
          group_id: {
            type: 'string',
            description: 'Optional: Specific group ID',
          },
          limit: {
            type: 'integer',
            description: 'Optional: Results limit (max 1000)',
          },
          offset: {
            type: 'integer',
            description: 'Optional: Pagination offset',
          },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  /**
   * Get daily group visibility tool definition
   */
  static getDailyGroupVisibilityDefinition() {
    return {
      name: 'seomonitor_get_daily_group_visibility',
      title: 'Get Daily Group Visibility',
      annotations: { title: 'Get Daily Group Visibility', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Daily visibility metrics for keyword groups',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
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
          group_id: {
            type: 'integer',
            description: 'Optional: Specific group ID',
          },
          keyword_ids: {
            type: 'string',
            description: 'Optional: Specific keyword IDs (comma-separated)',
          },
          domain: {
            type: 'string',
            description: 'Optional: Domain name for visibility calculation',
          },
          feature_visibility: {
            type: 'string',
            description: 'Optional: SERP feature for visibility calculation',
          },
        },
        required: ['campaign_id', 'start_date', 'end_date'],
      },
    };
  }

  /**
   * Add keywords tool definition
   */
  static getAddKeywordsDefinition() {
    return {
      name: 'seomonitor_add_keywords',
      title: 'Add Keywords',
      annotations: { title: 'Add Keywords', readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      description: 'Add new keywords to campaign',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
          keywords: {
            type: 'string',
            description: 'Keywords to add (comma-separated or newline-separated)',
          },
          group_ids: {
            type: 'string',
            description: 'Optional: Group IDs to assign keywords to (comma-separated)',
          },
        },
        required: ['campaign_id', 'keywords'],
      },
    };
  }

  /**
   * Get keyword import status tool definition
   */
  static getKeywordImportStatusDefinition() {
    return {
      name: 'seomonitor_get_keyword_import_status',
      title: 'Get Keyword Import Status',
      annotations: { title: 'Get Keyword Import Status', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Check status of keyword import task',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
          import_id: {
            type: 'integer',
            description: 'Required import task ID',
          },
        },
        required: ['campaign_id', 'import_id'],
      },
    };
  }

  /**
   * Execute get_keywords_competition tool
   */
  static async executeGetKeywordsCompetition(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, device, start_date, end_date, competitor_domains, keyword_ids, group_id, limit, offset } = args;

    const competitorDomainsArray = competitor_domains ? competitor_domains.split(',').map((domain: string) => domain.trim()) : undefined;

    const result = await seoClient.getCompetitionData(campaign_id, {
      device,
      startDate: start_date,
      endDate: end_date,
      competitorDomains: competitorDomainsArray,
      keywordIds: keyword_ids,
      groupId: group_id,
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
   * Execute get_top_results tool
   */
  static async executeGetTopResults(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, device, date, keyword_ids, group_id, limit, offset } = args;

    const result = await seoClient.getTopResults(campaign_id, {
      device,
      date,
      keywordIds: keyword_ids,
      groupId: group_id,
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
   * Execute get_keyword_ai_overview tool
   */
  static async executeGetKeywordAiOverview(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, keyword_ids, group_id, limit, offset } = args;

    const result = await seoClient.getKeywordAiOverview(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      keywordIds: keyword_ids,
      groupId: group_id,
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
   * Execute get_daily_group_visibility tool
   */
  static async executeGetDailyGroupVisibility(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, group_id, keyword_ids, domain, feature_visibility } = args;

    const result = await seoClient.getDailyGroupVisibility(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      groupId: group_id ? parseInt(group_id) : undefined,
      keywordIds: keyword_ids,
      domain,
      featureVisibility: feature_visibility,
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
   * Execute add_keywords tool
   */
  static async executeAddKeywords(args: any, seoClient: SEOMonitorClient) {
    if (process.env.MCP_ENABLE_WRITE_TOOLS !== 'true') {
      throw new Error('seomonitor_add_keywords is disabled on this server (read-only beta surface)');
    }
    const { campaign_id, keywords, group_ids } = args;

    const result = await seoClient.addKeywords(campaign_id, keywords, {
      groupIds: group_ids,
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
   * Execute get_keyword_import_status tool
   */
  static async executeGetKeywordImportStatus(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, import_id } = args;

    const result = await seoClient.getKeywordImportStatus(campaign_id, import_id);

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
   * Execute get_serp_feature_presence tool
   */
  static async executeGetSerpFeaturePresence(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, keyword_ids, group_id, limit, offset } = args;

    const result = await seoClient.getSerpFeaturePresence(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      keywordIds: keyword_ids,
      groupId: group_id,
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
   * Execute get_ranking_pages tool
   */
  static async executeGetRankingPages(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, start_date, end_date, keyword_ids, group_id, limit, offset } = args;

    const result = await seoClient.getRankingPages(campaign_id, {
      startDate: start_date,
      endDate: end_date,
      keywordIds: keyword_ids,
      groupId: group_id,
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
    // Write tools are off by default: the public beta surface is read-only
    // (Ship Happens consolidation decision, 2026-07). Re-enable with
    // MCP_ENABLE_WRITE_TOOLS=true.
    const writeEnabled = process.env.MCP_ENABLE_WRITE_TOOLS === 'true';
    return [
      this.getKeywordsCompetitionDefinition(),
      this.getSerpFeaturePresenceDefinition(),
      this.getTopResultsDefinition(),
      this.getKeywordAiOverviewDefinition(),
      this.getRankingPagesDefinition(),
      this.getDailyGroupVisibilityDefinition(),
      ...(writeEnabled ? [this.getAddKeywordsDefinition()] : []),
      this.getKeywordImportStatusDefinition(),
    ];
  }

  /**
   * Execute tool based on name
   */
  static async execute(toolName: string, args: any, seoClient: SEOMonitorClient) {
    switch (toolName) {
      case 'seomonitor_get_keywords_competition':
        return this.executeGetKeywordsCompetition(args, seoClient);
      case 'seomonitor_get_top_results':
        return this.executeGetTopResults(args, seoClient);
      case 'seomonitor_get_keyword_ai_overview':
        return this.executeGetKeywordAiOverview(args, seoClient);
      case 'seomonitor_get_daily_group_visibility':
        return this.executeGetDailyGroupVisibility(args, seoClient);
      case 'seomonitor_add_keywords':
        return this.executeAddKeywords(args, seoClient);
      case 'seomonitor_get_keyword_import_status':
        return this.executeGetKeywordImportStatus(args, seoClient);
      case 'seomonitor_get_serp_feature_presence':
        return this.executeGetSerpFeaturePresence(args, seoClient);
      case 'seomonitor_get_ranking_pages':
        return this.executeGetRankingPages(args, seoClient);
      default:
        throw new Error(`Unknown advanced rank tracking tool: ${toolName}`);
    }
  }
}