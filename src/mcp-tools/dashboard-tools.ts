import { SEOMonitorClient } from '../clients/seomonitor-client.js';

/**
 * Dashboard Tools
 * Account/company-level endpoints exposed under the dashboard module.
 */
export class DashboardTools {
  static getListCompaniesDefinition() {
    return {
      name: 'seomonitor_list_companies',
      title: 'List Companies',
      annotations: { title: 'List Companies', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: 'List the companies (accounts) accessible to the authenticated API key',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    };
  }

  static getAllDefinitions() {
    return [
      this.getListCompaniesDefinition(),
    ];
  }

  static async executeListCompanies(_args: any, seoClient: SEOMonitorClient) {
    const result = await seoClient.getCompanies();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  static async execute(toolName: string, args: any, seoClient: SEOMonitorClient) {
    switch (toolName) {
      case 'seomonitor_list_companies':
        return this.executeListCompanies(args, seoClient);
      default:
        throw new Error(`Unknown dashboard tool: ${toolName}`);
    }
  }
}
