import { SEOMonitorClient } from '../clients/seomonitor-client.js';

/**
 * AI Writer Tools
 * Content generation endpoints: article content retrieval, outline/article
 * generation, generation status polling, and topic recommendations.
 */
export class AiWriterTools {
  static getArticleContentDefinition() {
    return {
      name: 'seomonitor_get_article_content',
      description: 'Get current Article content (Outline, AI Version, Working Draft and Live version)',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'string', description: 'Required campaign ID' },
          article_id: { type: 'string', description: 'Required: Specific article ID' },
        },
        required: ['campaign_id', 'article_id'],
      },
    };
  }

  static getGenerateArticlesDefinition() {
    return {
      name: 'seomonitor_generate_articles',
      description: 'Generate outlines and/or full articles for a campaign. Each article supports topic, prompt, article_type, writing styles, internal links and image generation.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'string', description: 'Required campaign ID under which articles are generated' },
          articles: {
            type: 'array',
            description: 'Array of article generation requests',
            items: {
              type: 'object',
              properties: {
                topic: { type: 'string', description: 'Topic or keyword for the article' },
                generate_article: { type: 'boolean', description: 'If false, only an outline is generated; if true, a full article (default true)' },
                article_type: { type: 'string', description: "Article type, e.g. 'authority', 'fresh', 'comprehensive'" },
                prompt: { type: 'string', description: 'Custom instructions; if empty, uses the campaign Campaign Brief' },
                generate_images: { type: 'boolean', description: 'Generate/search relevant images (default false)' },
                own_content_url: { type: 'string', description: 'Reference content URL for inspiration' },
                own_content_prompt: { type: 'string', description: 'Instructions on how to integrate own_content_url' },
                fresh_market: { type: 'boolean', description: 'Enable fresh market research (default false)' },
                fresh_country: { type: 'string', description: "Market for fresh research, e.g. 'US', 'UK' (must differ from campaign primary market)" },
                writing_styles: { type: 'array', items: { type: 'string' }, description: "Writing styles, e.g. ['Informative', 'Professional']" },
                internal_links: { type: 'array', items: { type: 'string' }, description: 'URLs for desired internal links' },
              },
            },
          },
        },
        required: ['campaign_id', 'articles'],
      },
    };
  }

  static getGenerationStatusDefinition() {
    return {
      name: 'seomonitor_get_generation_status',
      description: 'Poll the status of an AI Writer generation request',
      inputSchema: {
        type: 'object',
        properties: {
          request_id: { type: 'string', description: 'Required: The generation request ID returned by generate_articles' },
        },
        required: ['request_id'],
      },
    };
  }

  static getTopicRecommendationsDefinition() {
    return {
      name: 'seomonitor_get_topic_recommendations',
      description: 'Get AI Writer topic recommendations for a campaign',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: { type: 'string', description: 'Required campaign ID' },
          on_demand: { type: 'boolean', description: 'Optional: Generate recommendations on demand' },
          category: { type: 'string', description: 'Optional: Filter by category' },
          limit: { type: 'integer', description: 'Optional: Results limit' },
          metrics: { type: 'boolean', description: 'Optional: Include keyword metrics' },
          sort_by: { type: 'string', description: 'Optional: Sort field' },
          offset: { type: 'integer', description: 'Optional: Pagination offset' },
        },
        required: ['campaign_id'],
      },
    };
  }

  static getAllDefinitions() {
    return [
      this.getArticleContentDefinition(),
      this.getGenerateArticlesDefinition(),
      this.getGenerationStatusDefinition(),
      this.getTopicRecommendationsDefinition(),
    ];
  }

  static async executeGetArticleContent(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, article_id } = args;
    const result = await seoClient.getArticleContent(campaign_id, { articleId: article_id });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async executeGenerateArticles(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, articles } = args;
    const result = await seoClient.generateArticles(campaign_id, articles);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async executeGetGenerationStatus(args: any, seoClient: SEOMonitorClient) {
    const { request_id } = args;
    const result = await seoClient.getGenerationStatus(request_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async executeGetTopicRecommendations(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id, on_demand, category, limit, metrics, sort_by, offset } = args;
    const result = await seoClient.getTopicRecommendations(campaign_id, {
      onDemand: on_demand,
      category,
      limit,
      metrics,
      sortBy: sort_by,
      offset,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async execute(toolName: string, args: any, seoClient: SEOMonitorClient) {
    switch (toolName) {
      case 'seomonitor_get_article_content':
        return this.executeGetArticleContent(args, seoClient);
      case 'seomonitor_generate_articles':
        return this.executeGenerateArticles(args, seoClient);
      case 'seomonitor_get_generation_status':
        return this.executeGetGenerationStatus(args, seoClient);
      case 'seomonitor_get_topic_recommendations':
        return this.executeGetTopicRecommendations(args, seoClient);
      default:
        throw new Error(`Unknown AI Writer tool: ${toolName}`);
    }
  }
}
