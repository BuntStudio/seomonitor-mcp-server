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
      title: 'Get Tracked Campaigns',
      annotations: { title: 'Get Tracked Campaigns', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'Retrieve active tracked campaigns with details from SEOMonitor dashboard. Call this before interpreting any rank or device comparison: campaign_info carries primary_device plus max_tracked_position_desktop and max_tracked_position_mobile, and the two devices are frequently tracked to different depths (e.g. primary mobile to 100, desktop only to 20). A keyword sitting at the shallower device\'s cap is untracked beyond that point, NOT a rank of that value — never read it as the device performing badly.',
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