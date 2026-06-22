import { SEOMonitorClient } from '../clients/seomonitor-client.js';

/**
 * SEO Forecasting Tools - Phase 5 Implementation
 * Scenario planning and forecasting capabilities
 */
export class ForecastTools {
  /**
   * Get forecast scenarios tool definition
   */
  static getForecastScenariosDefinition() {
    return {
      name: 'seomonitor_get_forecast_scenarios',
      description: 'List available forecast scenarios',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'integer',
            description: 'Required campaign ID',
          },
        },
        required: ['campaign_id'],
      },
    };
  }

  /**
   * Get forecast scenario data tool definition
   */
  static getForecastScenarioDataDefinition() {
    return {
      name: 'seomonitor_get_forecast_scenario_data',
      description: 'Detailed forecast for specific scenario',
      inputSchema: {
        type: 'object',
        properties: {
          forecast_id: {
            type: 'integer',
            description: 'Forecast scenario ID',
          },
          campaign_id: {
            type: 'integer',
            description: 'Campaign ID',
          },
        },
        required: ['forecast_id', 'campaign_id'],
      },
    };
  }

  /**
   * Get forecast objective data tool definition
   */
  static getForecastObjectiveDataDefinition() {
    return {
      name: 'seomonitor_get_forecast_objective_data',
      description: 'Objective-specific forecast data',
      inputSchema: {
        type: 'object',
        properties: {
          forecast_id: {
            type: 'integer',
            description: 'Forecast objective ID',
          },
          campaign_id: {
            type: 'integer',
            description: 'Campaign ID',
          },
        },
        required: ['forecast_id', 'campaign_id'],
      },
    };
  }

  /**
   * Get forecast keywords tool definition
   */
  static getForecastKeywordsDefinition() {
    return {
      name: 'seomonitor_get_forecast_keywords',
      description: 'Keyword-level forecasting',
      inputSchema: {
        type: 'object',
        properties: {
          forecast_id: {
            type: 'integer',
            description: 'Forecast scenario ID',
          },
          campaign_id: {
            type: 'integer',
            description: 'Campaign ID',
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
        required: ['forecast_id', 'campaign_id'],
      },
    };
  }

  /**
   * Execute get_forecast_scenarios tool
   */
  static async executeGetForecastScenarios(args: any, seoClient: SEOMonitorClient) {
    const { campaign_id } = args;

    const result = await seoClient.getForecastScenarios(campaign_id);

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
   * Execute get_forecast_scenario_data tool
   */
  static async executeGetForecastScenarioData(args: any, seoClient: SEOMonitorClient) {
    const { forecast_id, campaign_id } = args;

    const result = await seoClient.getForecastData(campaign_id, forecast_id);

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
      this.getForecastScenariosDefinition(),
      this.getForecastScenarioDataDefinition(),
      this.getForecastObjectiveDataDefinition(),
      this.getForecastKeywordsDefinition(),
    ];
  }

  /**
   * Execute tool based on name
   */
  /**
   * Execute get_forecast_objective_data tool
   */
  static async executeGetForecastObjectiveData(args: any, seoClient: SEOMonitorClient) {
    const { forecast_id, campaign_id } = args;

    const result = await seoClient.getForecastObjectiveData(campaign_id, forecast_id);

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
   * Execute get_forecast_keywords tool
   */
  static async executeGetForecastKeywords(args: any, seoClient: SEOMonitorClient) {
    const { forecast_id, campaign_id, limit, offset } = args;

    const result = await seoClient.getForecastKeywords(campaign_id, forecast_id, {
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

  static async execute(toolName: string, args: any, seoClient: SEOMonitorClient) {
    switch (toolName) {
      case 'seomonitor_get_forecast_scenarios':
        return this.executeGetForecastScenarios(args, seoClient);
      case 'seomonitor_get_forecast_scenario_data':
        return this.executeGetForecastScenarioData(args, seoClient);
      case 'seomonitor_get_forecast_objective_data':
        return this.executeGetForecastObjectiveData(args, seoClient);
      case 'seomonitor_get_forecast_keywords':
        return this.executeGetForecastKeywords(args, seoClient);
      default:
        throw new Error(`Unknown forecast tool: ${toolName}`);
    }
  }
}