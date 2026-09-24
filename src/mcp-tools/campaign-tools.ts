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
      description: 'Active tracked campaigns with details from the SEOmonitor dashboard. Paginated: the API returns 10 rows unless limit is passed (max 100); a full account listing takes limit 100 with offset advancing by 100 until a call returns fewer than 100 rows. Without company_id the list spans every company the key can access (each row carries campaign_info.company and company_id); company_id restricts it to one. campaign_info carries primary_device plus max_tracked_position_desktop and max_tracked_position_mobile, which matter for any rank or device comparison: the two devices are often tracked to different depths (e.g. primary mobile to 100, desktop only to 20), and a keyword sitting at the shallower device\'s cap is untracked beyond that point, not ranked at that value.',
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
            description: 'Max 100 records per request. Default 10, so a call without limit returns at most 10 campaigns',
          },
          offset: {
            type: 'integer',
            description: 'Pagination offset. Advance by limit (100) on each call until a page returns fewer than limit rows',
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