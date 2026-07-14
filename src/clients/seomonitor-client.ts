import axios, { AxiosInstance } from 'axios';
import { UserSession, ApiResponse } from '../types.js';
import { Logger } from '../logger.js';

export interface SEOMonitorCampaign {
  campaign_id: number;
  campaign_name: string;
  domain: string;
  country_code: string;
  language_code: string;
  device_type: string;
  created_at: string;
}

export interface SEOMonitorKeyword {
  keyword_id: number;
  keyword: string;
  search_volume: number;
  difficulty: number;
  current_rank: number;
  previous_rank: number;
  rank_change: number;
  url: string;
  landing_page: string;
}

export interface SEOMonitorGroup {
  group_id: number;
  group_name: string;
  keywords_count: number;
  avg_rank: number;
  visibility: number;
}

export interface SEOMonitorTrafficData {
  date: string;
  organic_traffic: number;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
}

export class SEOMonitorClient {
  private client: AxiosInstance;
  private session: UserSession;
  private logger: Logger;

  constructor(session: UserSession, logger: Logger) {
    this.session = session;
    this.logger = logger;
    
    // Resolve HTTP timeout (default to 180s, must be >120s for long-running tools)
    const defaultTimeoutMs = 180_000; // 180 seconds
    const envTimeout = process.env.SEOMONITOR_HTTP_TIMEOUT_MS;
    const resolvedTimeout = (() => {
      const parsed = envTimeout ? parseInt(envTimeout, 10) : NaN;
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
      return defaultTimeoutMs;
    })();

    this.client = axios.create({
      baseURL: 'https://apigw.seomonitor.com/v3',
      headers: {
        // SEOMonitor expects a Bearer token
        'Authorization': `Bearer ${session.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: resolvedTimeout,
    });
    
    this.logger.info('SEOMonitor client initialized', { httpTimeoutMs: resolvedTimeout });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug('SEOMonitor API Request', {
          user: session.userId,
          method: config.method?.toUpperCase(),
          url: (config.baseURL || '') + (config.url || ''),
          data: config.data
        });
        return config;
      },
      (error) => {
        this.logger.error('SEOMonitor API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for consistent error handling and logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug('SEOMonitor API Response', {
          user: session.userId,
          status: response.status,
          responseSize: JSON.stringify(response.data).length
        });
        return response;
      },
      (error) => {
        this.logger.error('SEOMonitor API Error', {
          user: session.userId,
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          data: error.response?.data
        });
        throw error;
      }
    );
  }

  // Campaign Management
  async getCampaigns(): Promise<SEOMonitorCampaign[]> {
    // Align with OpenAPI: /v3/dashboard/v3.0/campaigns/tracked (baseURL already includes /v3)
    const response = await this.client.get('/dashboard/v3.0/campaigns/tracked');
    return response.data;
  }

  async getTrackedCampaigns(options: any = {}): Promise<SEOMonitorCampaign[]> {
    this.logger.info(`Fetching tracked campaigns with options:`, options);
    const response = await this.client.get('/dashboard/v3.0/campaigns/tracked', { params: options });
    return response.data;
  }

  // Rank Tracker - Keywords
  async getKeywordData(campaignId: number, options?: {
    groupId?: number | string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    device?: string;
    search?: string;
    // Server-side ordering (per /keywords spec): order_by ∈ keyword |
    // search_volume | year-over-year | rank | rank_trend | rank_trend_impact |
    // opportunity. Lets callers get a true top/bottom-N across ALL keywords
    // instead of sorting a single page.
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    intent?: string;
    serpFeature?: string;
    rankBand?: string;
    brand?: boolean;
    aioPresence?: boolean;
    aisPresence?: boolean;
  }): Promise<SEOMonitorKeyword[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());

    if (options?.groupId) params.append('group_id', options.groupId.toString());
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.device) params.append('device', options.device);
    if (options?.search) params.append('search', options.search);
    if (options?.orderBy) params.append('order_by', options.orderBy);
    if (options?.orderDirection) params.append('order_direction', options.orderDirection);
    if (options?.intent) params.append('intent', options.intent);
    if (options?.serpFeature) params.append('serp_feature', options.serpFeature);
    if (options?.rankBand) params.append('rank_band', options.rankBand);
    if (options?.brand !== undefined) params.append('brand', options.brand.toString());
    if (options?.aioPresence !== undefined) params.append('aio_presence', options.aioPresence.toString());
    if (options?.aisPresence !== undefined) params.append('ais_presence', options.aisPresence.toString());

    const response = await this.client.get(`/rank-tracker/v3.0/keywords?${params}`);
    return response.data;
  }

  async getKeywordRanks(campaignId: number, options?: {
    startDate?: string;
    endDate?: string;
    keywordIds?: number[];
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.keywordIds) {
      options.keywordIds.forEach(id => params.append('keyword_ids[]', id.toString()));
    }

    const response = await this.client.get(`/rank-tracker/v3.0/keywords/daily-ranks?${params}`);
    return response.data;
  }

  // Groups Management
  async getGroups(campaignId: number): Promise<SEOMonitorGroup[]> {
    const response = await this.client.get(`/rank-tracker/v3.0/groups?campaign_id=${campaignId}`);
    return response.data;
  }

  async getGroupData(campaignId: number, groupIds: string, options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('group_ids', groupIds);
    
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);

    const response = await this.client.get(`/rank-tracker/v3.0/groups/data?${params}`);
    return response.data;
  }

  // Competition Analysis
  async getCompetitionData(campaignId: number, options?: {
    device: string;
    competitorDomains?: string[];
    startDate?: string;
    endDate?: string;
    groupId?: string;
    keywordIds?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: string;
    search?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('device', options?.device || 'desktop');
    
    if (options?.competitorDomains) {
      params.append('competitors', JSON.stringify(options.competitorDomains));
    }
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.groupId) params.append('group_id', options.groupId);
    if (options?.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.orderBy) params.append('order_by', options.orderBy);
    if (options?.orderDirection) params.append('order_direction', options.orderDirection);
    if (options?.search) params.append('search', options.search);

    const response = await this.client.get(`/rank-tracker/v3.0/keywords/competition?${params}`);
    return response.data;
  }

  // Top Results
  async getTopResults(campaignId: number, options?: {
    device: string;
    date: string;
    groupId?: string;
    keywordIds?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('device', options?.device || 'desktop');
    params.append('date', options?.date || new Date().toISOString().split('T')[0]);
    
    if (options?.groupId) params.append('group_id', options.groupId);
    if (options?.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await this.client.get(`/rank-tracker/v3.0/keywords/top-results?${params}`);
    return response.data;
  }

  // AI Overview Data
  async getKeywordAiOverview(campaignId: number, options?: {
    startDate: string;
    endDate: string;
    groupId?: string;
    keywordIds?: string;
    limit?: number;
    offset?: number;
    responseEncoding?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('start_date', options?.startDate || '');
    params.append('end_date', options?.endDate || '');
    
    if (options?.groupId) params.append('group_id', options.groupId);
    if (options?.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.responseEncoding) params.append('response_encoding', options.responseEncoding);

    const response = await this.client.get(`/rank-tracker/v3.0/keywords/aio?${params}`);
    return response.data;
  }

  // Daily Group Visibility
  async getDailyGroupVisibility(campaignId: number, options?: {
    startDate: string;
    endDate: string;
    groupId?: number | string;
    keywordIds?: string;
    domain?: string;
    domains?: string;
    featureVisibility?: string;
    intent?: string;
    hasAio?: boolean;
    brand?: boolean;
    nonBrand?: boolean;
    top10?: boolean;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('start_date', options?.startDate || '');
    params.append('end_date', options?.endDate || '');

    if (options?.groupId) params.append('group_id', options.groupId.toString());
    if (options?.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options?.domain) params.append('domain', options.domain);
    if (options?.domains) params.append('domains', options.domains);
    if (options?.featureVisibility) params.append('feature_visibility', options.featureVisibility);
    if (options?.intent) params.append('intent', options.intent);
    if (options?.hasAio !== undefined) params.append('has_aio', options.hasAio.toString());
    if (options?.brand !== undefined) params.append('brand', options.brand.toString());
    if (options?.nonBrand !== undefined) params.append('non_brand', options.nonBrand.toString());
    if (options?.top10 !== undefined) params.append('top_10', options.top10.toString());

    const response = await this.client.get(`/rank-tracker/v3.0/groups/daily-visibility?${params}`);
    return response.data;
  }

  // Add Keywords
  async addKeywords(campaignId: number, keywords: string, options?: {
    groupIds?: string;
  }): Promise<any> {
    const payload = {
      campaign_id: campaignId,
      keywords: keywords,
      ...(options?.groupIds && { group_ids: options.groupIds }),
    };

    const response = await this.client.post('/rank-tracker/v3.0/keywords/import', payload);
    return response.data;
  }

  // Get Keywords Import Status
  async getKeywordImportStatus(campaignId: number, importId: number): Promise<any> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('import_id', importId.toString());

    const response = await this.client.get(`/rank-tracker/v3.0/keywords/import-status?${params}`);
    return response.data;
  }

  // Organic Traffic
  async getTrafficData(campaignId: number, options?: {
    startDate?: string;
    endDate?: string;
    segmentId?: number;
  }): Promise<SEOMonitorTrafficData[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.segmentId) params.append('segment_id', options.segmentId.toString());

    // Align with OpenAPI: /v3/organic-traffic/v3.0/daily-traffic (baseURL already includes /v3)
    const response = await this.client.get(`/organic-traffic/v3.0/daily-traffic?${params}`);
    return response.data;
  }

  async getTrafficByKeywords(campaignId: number, options?: {
    startDate?: string;
    endDate?: string;
    keywordIds?: number[];
    limit?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.keywordIds) {
      options.keywordIds.forEach(id => params.append('keyword_ids[]', id.toString()));
    }

    const response = await this.client.get(`/organic-traffic/v3.0/keywords?${params}`);
    return response.data;
  }

  // Keyword Research
  async getRelatedKeywords(campaignId: number, keyword: string, options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('keyword', keyword);
    
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.orderBy) params.append('order_by', options.orderBy);
    if (options?.orderDirection) params.append('order_direction', options.orderDirection);

    const response = await this.client.get(`/research/v3.0/related-keywords?${params}`);
    return response.data;
  }

  async getTopicOverview(campaignId: number, keyword: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('keyword', keyword);

    const response = await this.client.get(`/research/v3.0/topic-overview?${params}`);
    return response.data;
  }

  async getDomainOverview(domain: string, options?: {
    country?: string;
    language?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    params.append('domain', domain);
    
    if (options?.country) params.append('country', options.country);
    if (options?.language) params.append('language', options.language);

    // Align with OpenAPI: /v3/research/v3.0/domain-overview (baseURL already includes /v3)
    const response = await this.client.get(`/research/v3.0/domain-overview?${params}`);
    return response.data;
  }

  async getRankingKeywords(domain: string, options?: {
    country?: string;
    language?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('domain', domain);
    
    if (options?.country) params.append('country', options.country);
    if (options?.language) params.append('language', options.language);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    // Align with OpenAPI: /v3/research/v3.0/domain-ranking-keywords (baseURL already includes /v3)
    const response = await this.client.get(`/research/v3.0/domain-ranking-keywords?${params}`);
    return response.data;
  }

  // Forecasting
  async getForecastScenarios(campaignId: number): Promise<any[]> {
    const response = await this.client.get(`/forecast/v3.0/scenarios?campaign_id=${campaignId}`);
    return response.data;
  }

  async getForecastData(campaignId: number, forecastId: number): Promise<any> {
    const response = await this.client.get(`/forecast/v3.0/scenario?campaign_id=${campaignId}&forecast_id=${forecastId}`);
    return response.data;
  }

  async getForecastObjectiveData(campaignId: number, forecastId: number): Promise<any> {
    const response = await this.client.get(`/forecast/v3.0/objective?campaign_id=${campaignId}&forecast_id=${forecastId}`);
    return response.data;
  }

  async getForecastKeywords(campaignId: number, forecastId: number, options?: {
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('forecast_id', forecastId.toString());
    
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await this.client.get(`/forecast/v3.0/keywords?${params}`);
    return response.data;
  }

  // Keyword Vault
  async getKeywordVaultData(campaignId: number, listName: string, options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: string;
    search?: string;
    includeUnqualified?: boolean;
    domain?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('list', listName);
    
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.orderBy) params.append('order_by', options.orderBy);
    if (options?.orderDirection) params.append('order_direction', options.orderDirection);
    if (options?.search) params.append('search', options.search);
    if (options?.includeUnqualified) params.append('include_unqualified', options.includeUnqualified.toString());
    if (options?.domain) params.append('domain', options.domain);

    const response = await this.client.get(`/keyword-vault/v3.0/get-keyword-data-by-list?${params}`);
    return response.data;
  }

  async getKeywordVaultOverview(campaignId: number, listName: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('list', listName);

    const response = await this.client.get(`/keyword-vault/v3.0/get-overview-data?${params}`);
    return response.data;
  }

  // SERP Feature Presence
  async getSerpFeaturePresence(campaignId: number, options?: {
    startDate: string;
    endDate: string;
    groupId?: string;
    keywordIds?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('start_date', options?.startDate || '');
    params.append('end_date', options?.endDate || '');
    
    if (options?.groupId) params.append('group_id', options.groupId);
    if (options?.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.search) params.append('search', options.search);

    const response = await this.client.get(`/rank-tracker/v3.0/keywords/serp-feature-presence?${params}`);
    return response.data;
  }

  // Ranking Pages
  async getRankingPages(campaignId: number, options?: {
    startDate?: string;
    endDate?: string;
    keywordIds?: string;
    groupId?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());

    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options?.groupId) params.append('group_id', options.groupId);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.search) params.append('search', options.search);

    const response = await this.client.get(`/rank-tracker/v3.0/keywords/ranking-pages?${params}`);
    return response.data;
  }

  // Research Keywords
  async getResearchKeywords(campaignId: number, keywords: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('keywords', keywords);
    
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await this.client.get(`/research/v3.0/keywords?${params}`);
    return response.data;
  }

  // Research Ranking Data
  async getResearchRankingData(campaignId: number, keywords: string, options?: {
    domains?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('keywords', keywords);
    
    if (options?.domains) params.append('domains', options.domains);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await this.client.get(`/research/v3.0/ranking-data?${params}`);
    return response.data;
  }


  // ===========================================================================
  // AI Overview (AIO) - extended rank-tracker endpoints
  // ===========================================================================

  // Get Daily Keyword Ranks AI Overview
  async getKeywordRanksAiOverview(campaignId: number, options: {
    startDate: string;
    endDate: string;
    groupId?: number;
    keywordIds?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('start_date', options.startDate);
    params.append('end_date', options.endDate);

    if (options.groupId) params.append('group_id', options.groupId.toString());
    if (options.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const response = await this.client.get(`/rank-tracker/v3.0/keywords/daily-ranks/aio?${params}`);
    return response.data;
  }

  // Get Keywords Competition Data AI Overview
  async getCompetitionAiOverview(campaignId: number, options: {
    device: string;
    startDate: string;
    endDate: string;
    groupId?: number;
    keywordIds?: string;
    competitors?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('device', options.device);
    params.append('start_date', options.startDate);
    params.append('end_date', options.endDate);

    if (options.groupId) params.append('group_id', options.groupId.toString());
    if (options.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options.competitors) params.append('competitors', options.competitors);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const response = await this.client.get(`/rank-tracker/v3.0/keywords/competition/aio?${params}`);
    return response.data;
  }

  // Get Daily Group Visibility AI Overview Mentions
  async getDailyGroupVisibilityAioMentions(campaignId: number, options: {
    startDate: string;
    endDate: string;
    groupId?: number | string;
    keywordIds?: string;
    domain?: string;
    limit?: number;
    offset?: number;
    intent?: string;
    hasAio?: boolean;
    brand?: boolean;
    nonBrand?: boolean;
    top10?: boolean;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('start_date', options.startDate);
    params.append('end_date', options.endDate);

    if (options.groupId) params.append('group_id', options.groupId.toString());
    if (options.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options.domain) params.append('domain', options.domain);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.intent) params.append('intent', options.intent);
    if (options.hasAio !== undefined) params.append('has_aio', options.hasAio.toString());
    if (options.brand !== undefined) params.append('brand', options.brand.toString());
    if (options.nonBrand !== undefined) params.append('non_brand', options.nonBrand.toString());
    if (options.top10 !== undefined) params.append('top_10', options.top10.toString());

    const response = await this.client.get(`/rank-tracker/v3.0/groups/daily-visibility/aio-mentions?${params}`);
    return response.data;
  }

  // Get Daily Group Visibility AI Overview Citations
  async getDailyGroupVisibilityAioCitations(campaignId: number, options: {
    startDate: string;
    endDate: string;
    groupId?: number;
    keywordIds?: string;
    domain?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('start_date', options.startDate);
    params.append('end_date', options.endDate);

    if (options.groupId) params.append('group_id', options.groupId.toString());
    if (options.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options.domain) params.append('domain', options.domain);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const response = await this.client.get(`/rank-tracker/v3.0/groups/daily-visibility/aio-citations?${params}`);
    return response.data;
  }

  // ===========================================================================
  // AI Search (AIS) - rank-tracker endpoints
  // ===========================================================================

  // Get Keyword AI Search Data
  async getKeywordAiSearch(campaignId: number, options: {
    startDate: string;
    endDate: string;
    groupId?: string;
    keywordIds?: string;
    limit?: number;
    offset?: number;
    contentEncoding?: string;
    skipHtml?: boolean;
    provider?: string;
    engine?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('start_date', options.startDate);
    params.append('end_date', options.endDate);

    if (options.groupId) params.append('group_id', options.groupId);
    if (options.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.contentEncoding) params.append('content_encoding', options.contentEncoding);
    if (options.skipHtml !== undefined) params.append('skip_html', options.skipHtml.toString());
    if (options.provider) params.append('provider', options.provider);
    if (options.engine) params.append('engine', options.engine);

    const response = await this.client.get(`/rank-tracker/v3.0/keywords/ais?${params}`);
    return response.data;
  }

  // Get Keywords Competition AI Search Data
  async getCompetitionAiSearch(campaignId: number, options: {
    startDate: string;
    endDate: string;
    groupId?: number;
    keywordIds?: string;
    competitors?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: string;
    search?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('start_date', options.startDate);
    params.append('end_date', options.endDate);

    if (options.groupId) params.append('group_id', options.groupId.toString());
    if (options.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options.competitors) params.append('competitors', options.competitors);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.orderBy) params.append('order_by', options.orderBy);
    if (options.orderDirection) params.append('order_direction', options.orderDirection);
    if (options.search) params.append('search', options.search);

    const response = await this.client.get(`/rank-tracker/v3.0/keywords/competition/ais?${params}`);
    return response.data;
  }

  // Get Daily AI Search Keyword Ranks
  async getDailyAiSearchKeywordRanks(campaignId: number, options: {
    startDate: string;
    endDate: string;
    domain?: string;
    groupId?: string;
    keywordIds?: string;
    getArchive?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('start_date', options.startDate);
    params.append('end_date', options.endDate);

    if (options.domain) params.append('domain', options.domain);
    if (options.groupId) params.append('group_id', options.groupId);
    if (options.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options.getArchive) params.append('get_archive', options.getArchive);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.search) params.append('search', options.search);

    const response = await this.client.get(`/rank-tracker/v3.0/keywords/daily-ranks/ais?${params}`);
    return response.data;
  }

  // Get Daily Group AI Search Brand Mentions visibility
  async getDailyGroupAisMentions(campaignId: number, options: {
    startDate: string;
    endDate: string;
    groupId?: number | string;
    keywordIds?: string;
    domain?: string;
    metricsWeightedBySearchVolume?: number;
    provider?: string;
    engine?: string;
    intent?: string;
    hasAio?: boolean;
    brand?: boolean;
    nonBrand?: boolean;
    top10?: boolean;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('start_date', options.startDate);
    params.append('end_date', options.endDate);

    if (options.groupId) params.append('group_id', options.groupId.toString());
    if (options.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options.domain) params.append('domain', options.domain);
    if (options.metricsWeightedBySearchVolume !== undefined) {
      params.append('metrics_weighted_by_search_volume', options.metricsWeightedBySearchVolume.toString());
    }
    if (options.provider) params.append('provider', options.provider);
    if (options.engine) params.append('engine', options.engine);
    if (options.intent) params.append('intent', options.intent);
    if (options.hasAio !== undefined) params.append('has_aio', options.hasAio.toString());
    if (options.brand !== undefined) params.append('brand', options.brand.toString());
    if (options.nonBrand !== undefined) params.append('non_brand', options.nonBrand.toString());
    if (options.top10 !== undefined) params.append('top_10', options.top10.toString());

    const response = await this.client.get(`/rank-tracker/v3.0/groups/daily-visibility/ais-mentions?${params}`);
    return response.data;
  }

  // Get Daily Group AI Search Site Citations visibility
  async getDailyGroupAisCitations(campaignId: number, options: {
    startDate: string;
    endDate: string;
    groupId?: number | string;
    keywordIds?: string;
    domain?: string;
    metricsWeightedBySearchVolume?: number;
    provider?: string;
    engine?: string;
    intent?: string;
    hasAio?: boolean;
    brand?: boolean;
    nonBrand?: boolean;
    top10?: boolean;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('start_date', options.startDate);
    params.append('end_date', options.endDate);

    if (options.groupId) params.append('group_id', options.groupId.toString());
    if (options.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options.domain) params.append('domain', options.domain);
    if (options.metricsWeightedBySearchVolume !== undefined) {
      params.append('metrics_weighted_by_search_volume', options.metricsWeightedBySearchVolume.toString());
    }
    if (options.provider) params.append('provider', options.provider);
    if (options.engine) params.append('engine', options.engine);
    if (options.intent) params.append('intent', options.intent);
    if (options.hasAio !== undefined) params.append('has_aio', options.hasAio.toString());
    if (options.brand !== undefined) params.append('brand', options.brand.toString());
    if (options.nonBrand !== undefined) params.append('non_brand', options.nonBrand.toString());
    if (options.top10 !== undefined) params.append('top_10', options.top10.toString());

    const response = await this.client.get(`/rank-tracker/v3.0/groups/daily-visibility/ais-citations?${params}`);
    return response.data;
  }

  // ===========================================================================
  // Visibility metrics - rank-tracker endpoints
  // ===========================================================================

  // Get Daily Share of Clicks
  async getDailyShareOfClicks(campaignId: number, options?: {
    startDate?: string;
    endDate?: string;
    groupId?: number;
    keywordIds?: string;
    device?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());

    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.groupId) params.append('group_id', options.groupId.toString());
    if (options?.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options?.device) params.append('device', options.device);

    const response = await this.client.get(`/rank-tracker/v3.0/daily-share-of-clicks?${params}`);
    return response.data;
  }

  // Get Share of Voice
  async getShareOfVoice(campaignId: number, options: {
    date: string;
    groupId?: number;
    keywordIds?: string;
    competitors?: string;
    metricsWeightedBySearchVolume?: number;
    device?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('date', options.date);

    if (options.groupId) params.append('group_id', options.groupId.toString());
    if (options.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options.competitors) params.append('competitors', options.competitors);
    if (options.metricsWeightedBySearchVolume !== undefined) {
      params.append('metrics_weighted_by_search_volume', options.metricsWeightedBySearchVolume.toString());
    }
    if (options.device) params.append('device', options.device);

    const response = await this.client.get(`/rank-tracker/v3.0/share-of-voice?${params}`);
    return response.data;
  }

  // Get SERP Visibility Data
  async getSerpVisibility(campaignId: number, options: {
    startDate: string;
    endDate: string;
    groupId?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('start_date', options.startDate);
    params.append('end_date', options.endDate);

    if (options.groupId) params.append('group_id', options.groupId);

    const response = await this.client.get(`/rank-tracker/v3.0/serp-visibility?${params}`);
    return response.data;
  }

  // ===========================================================================
  // Keyword Vault - lists
  // ===========================================================================

  // Get Lists
  async getVaultLists(campaignId: number, options?: {
    limit?: number;
    offset?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());

    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset);

    const response = await this.client.get(`/keyword-vault/v3.0/get-lists?${params}`);
    return response.data;
  }

  // ===========================================================================
  // AI Writer
  // ===========================================================================

  // Get Article Content
  async getArticleContent(campaignId: string, options?: {
    articleId?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId);

    if (options?.articleId) params.append('article_id', options.articleId);

    const response = await this.client.get(`/ai-writer/v3.0/article?${params}`);
    return response.data;
  }

  // Generate Outlines and Articles
  async generateArticles(campaignId: string, articles: any[]): Promise<any> {
    const payload = {
      campaign_id: campaignId,
      articles,
    };

    const response = await this.client.post('/ai-writer/v3.0/generate', payload);
    return response.data;
  }

  // Get Generation Status
  async getGenerationStatus(requestId: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('request_id', requestId);

    const response = await this.client.get(`/ai-writer/v3.0/status?${params}`);
    return response.data;
  }

  // Get Topic Recommendations
  async getTopicRecommendations(campaignId: string, options?: {
    onDemand?: boolean;
    category?: string;
    limit?: number;
    metrics?: boolean;
    sortBy?: string;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId);

    if (options?.onDemand !== undefined) params.append('on_demand', options.onDemand.toString());
    if (options?.category) params.append('category', options.category);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.metrics !== undefined) params.append('metrics', options.metrics.toString());
    if (options?.sortBy) params.append('sort_by', options.sortBy);
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await this.client.get(`/ai-writer/v3.0/topic-recommendations?${params}`);
    return response.data;
  }

  // ===========================================================================
  // Dashboard
  // ===========================================================================

  // List Companies (Accounts)
  async getCompanies(): Promise<any[]> {
    const response = await this.client.get('/dashboard/v3.0/companies');
    return response.data;
  }

  // Update session (useful for refreshing API keys)
  updateSession(newSession: UserSession) {
    this.session = newSession;
    this.client.defaults.headers['Authorization'] = newSession.apiKey;
    this.logger.info(`Updated SEOMonitor session for user ${newSession.userId}`);
  }

}
