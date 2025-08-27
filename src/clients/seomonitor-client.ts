import axios, { AxiosInstance } from 'axios';
import { UserSession, ApiResponse } from '../types.js';
import { logger } from '../logger.js';

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

  constructor(session: UserSession) {
    this.session = session;
    this.client = axios.create({
      baseURL: 'https://apigw.seomonitor.com/v3',
      headers: {
        'Authorization': session.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
    
    logger.info(`SEOMonitor client initialized for user ${session.userId}`);

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('SEOMonitor API Request', {
          user: session.userId,
          method: config.method?.toUpperCase(),
          url: (config.baseURL || '') + (config.url || ''),
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error('SEOMonitor API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for consistent error handling and logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('SEOMonitor API Response', {
          user: session.userId,
          status: response.status,
          responseSize: JSON.stringify(response.data).length
        });
        return response;
      },
      (error) => {
        logger.error('SEOMonitor API Error', {
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
    const response = await this.client.get('/dashboard/v3.0/campaigns/tracked');
    return response.data;
  }

  async getTrackedCampaigns(options?: {
    campaign_ids?: string;
    company_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<SEOMonitorCampaign[]> {
    const params = new URLSearchParams();
    
    if (options?.campaign_ids) params.append('campaign_ids', options.campaign_ids);
    if (options?.company_id) params.append('company_id', options.company_id.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const url = params.toString() ? `/dashboard/v3.0/campaigns/tracked?${params}` : '/dashboard/v3.0/campaigns/tracked';
    const response = await this.client.get(url);
    
    return response.data;
  }

  // Rank Tracker - Keywords
  async getKeywordData(campaignId: number, options?: {
    groupId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<SEOMonitorKeyword[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    
    if (options?.groupId) params.append('group_id', options.groupId.toString());
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

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
    groupId?: number;
    keywordIds?: string;
    domain?: string;
    featureVisibility?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    params.append('start_date', options?.startDate || '');
    params.append('end_date', options?.endDate || '');
    
    if (options?.groupId) params.append('group_id', options.groupId.toString());
    if (options?.keywordIds) params.append('keyword_ids', options.keywordIds);
    if (options?.domain) params.append('domain', options.domain);
    if (options?.featureVisibility) params.append('feature_visibility', options.featureVisibility);

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

    const response = await this.client.get(`/organic-traffic/v3.0/traffic/daily?${params}`);
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

    const response = await this.client.get(`/research/v3.0/domain/overview?${params}`);
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

    const response = await this.client.get(`/research/v3.0/domain/ranking-keywords?${params}`);
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
    groupId?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('campaign_id', campaignId.toString());
    
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


  // Update session (useful for refreshing API keys)
  updateSession(newSession: UserSession) {
    this.session = newSession;
    this.client.defaults.headers['Authorization'] = newSession.apiKey;
    logger.info(`Updated SEOMonitor session for user ${newSession.userId}`);
  }
}