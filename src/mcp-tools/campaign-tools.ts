import { SEOMonitorClient } from '../clients/seomonitor-client.js';

/**
 * Campaign Management Tools - Phase 1 Implementation
 * Based on SEOMonitor API 3.0 specification: /v3/dashboard/v3.0/campaigns/tracked
 */
export class CampaignTools {
  /**
   * Get tracked campaigns tool definition
   */
  static getDefinition() {
    return {
      name: 'seomonitor_get_tracked_campaigns',
      description: 'Retrieve active tracked campaigns with details from SEOMonitor dashboard',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_ids: {
            type: 'array',
            description: 'Optional: Specific campaign IDs',
            items: {
              type: 'integer',
            },
          },
          company_id: {
            type: 'integer',
            description: 'Optional: Company subscription ID',
          },
          limit: {
            type: 'integer',
            description: 'Optional: Max 100 records per request',
          },
          offset: {
            type: 'integer',
            description: 'Optional: Pagination offset',
          },
        },
        required: [],
      },
    };
  }

  /**
   * Execute get_tracked_campaigns tool
   */
  static async execute(args: any, seoClient: SEOMonitorClient) {
    const { userId, ...apiOptions } = args;

    try {
      const result = await seoClient.getTrackedCampaigns(apiOptions);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw error;
    }
  }
}