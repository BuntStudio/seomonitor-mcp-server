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
      name: 'get_related_keywords',
      description: 'Find related keyword suggestions',
      inputSchema: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: 'Target keyword',
          },
          country_code: {
            type: 'string',
            description: 'Country code (e.g., US, GB, DE)',
          },
          language_code: {
            type: 'string',
            description: 'Optional: Language code (e.g., en, de, fr)',
          },
          search_data: {
            type: 'boolean',
            description: 'Optional: Include search volume data',
          },
          limit: {
            type: 'number',
            description: 'Optional: Results limit',
          },
        },
        required: ['keyword', 'country_code'],
      },
    };
  }

  /**
   * Get topic overview tool definition
   */
  static getTopicOverviewDefinition() {
    return {
      name: 'get_topic_overview',
      description: 'Comprehensive topic analysis',
      inputSchema: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: 'Topic keyword',
          },
          country_code: {
            type: 'string',
            description: 'Country code (e.g., US, GB, DE)',
          },
          language_code: {
            type: 'string',
            description: 'Optional: Language code (e.g., en, de, fr)',
          },
        },
        required: ['keyword', 'country_code'],
      },
    };
  }

  /**
   * Get domain overview tool definition
   */
  static getDomainOverviewDefinition() {
    return {
      name: 'get_domain_overview',
      description: 'Domain SEO overview and metrics',
      inputSchema: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'Target domain (without protocol)',
          },
          country_code: {
            type: 'string',
            description: 'Country code (e.g., US, GB, DE)',
          },
          language_code: {
            type: 'string',
            description: 'Optional: Language code (e.g., en, de, fr)',
          },
          campaign_id: {
            type: 'string',
            description: 'Optional: Campaign context for comparison',
          },
        },
        required: ['domain', 'country_code'],
      },
    };
  }

  /**
   * Get domain ranking keywords tool definition
   */
  static getDomainRankingKeywordsDefinition() {
    return {
      name: 'get_domain_ranking_keywords',
      description: 'Keywords a domain ranks for',
      inputSchema: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'Target domain (without protocol)',
          },
          country_code: {
            type: 'string',
            description: 'Country code (e.g., US, GB, DE)',
          },
          language_code: {
            type: 'string',
            description: 'Optional: Language code (e.g., en, de, fr)',
          },
          limit: {
            type: 'number',
            description: 'Optional: Results limit',
          },
          offset: {
            type: 'number',
            description: 'Optional: Pagination offset',
          },
        },
        required: ['domain', 'country_code'],
      },
    };
  }

  /**
   * Get research keyword data tool definition
   */
  static getResearchKeywordDataDefinition() {
    return {
      name: 'get_research_keyword_data',
      description: 'Research-specific keyword metrics',
      inputSchema: {
        type: 'object',
        properties: {
          keywords: {
            type: 'string',
            description: 'Keyword list (comma-separated)',
          },
          country_code: {
            type: 'string',
            description: 'Country code (e.g., US, GB, DE)',
          },
          language_code: {
            type: 'string',
            description: 'Optional: Language code (e.g., en, de, fr)',
          },
          search_data: {
            type: 'boolean',
            description: 'Optional: Include search volume data',
          },
        },
        required: ['keywords', 'country_code'],
      },
    };
  }

  /**
   * Get research ranking data tool definition
   */
  static getResearchRankingDataDefinition() {
    return {
      name: 'get_research_ranking_data',
      description: 'Ranking analysis for research',
      inputSchema: {
        type: 'object',
        properties: {
          keywords: {
            type: 'string',
            description: 'Keyword list (comma-separated)',
          },
          domain: {
            type: 'string',
            description: 'Optional: Domain filter',
          },
          country_code: {
            type: 'string',
            description: 'Country code (e.g., US, GB, DE)',
          },
          language_code: {
            type: 'string',
            description: 'Optional: Language code (e.g., en, de, fr)',
          },
          limit: {
            type: 'number',
            description: 'Optional: Results limit',
          },
        },
        required: ['keywords', 'country_code'],
      },
    };
  }

  /**
   * Execute get_related_keywords tool
   */
  static async executeGetRelatedKeywords(args: any, seoClient: SEOMonitorClient) {
    const { keyword, country_code, language_code, limit } = args;

    const result = await seoClient.getRelatedKeywords(keyword, {
      country: country_code,
      language: language_code,
      limit,
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
    const { keyword, country_code, language_code } = args;

    const result = await seoClient.getTopicOverview(keyword, {
      country: country_code,
      language: language_code,
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
   * Execute get_domain_overview tool
   */
  static async executeGetDomainOverview(args: any, seoClient: SEOMonitorClient) {
    const { domain, country_code, language_code } = args;

    const result = await seoClient.getDomainOverview(domain, {
      country: country_code,
      language: language_code,
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
    const { domain, country_code, language_code, limit, offset } = args;

    const result = await seoClient.getRankingKeywords(domain, {
      country: country_code,
      language: language_code,
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
      case 'get_related_keywords':
        return this.executeGetRelatedKeywords(args, seoClient);
      case 'get_topic_overview':
        return this.executeGetTopicOverview(args, seoClient);
      case 'get_domain_overview':
        return this.executeGetDomainOverview(args, seoClient);
      case 'get_domain_ranking_keywords':
        return this.executeGetDomainRankingKeywords(args, seoClient);
      case 'get_research_keyword_data':
      case 'get_research_ranking_data':
        // These tools need specific API endpoints in SEOMonitorClient
        return {
          content: [
            {
              type: 'text',
              text: `Tool ${toolName} is not yet fully implemented. The corresponding API endpoint needs to be added to SEOMonitorClient.`,
            },
          ],
        };
      default:
        throw new Error(`Unknown research tool: ${toolName}`);
    }
  }
}