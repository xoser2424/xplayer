import axios from 'axios';

interface XtreamConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export class XtreamService {
  private baseUrl: string;
  private params: string;

  constructor(config: XtreamConfig) {
    let url = config.baseUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    this.baseUrl = url.replace(/\/$/, '');
    this.params = `username=${config.username}&password=${config.password}`;
  }

  private async request(url: string) {
    const w: any = window as any;
    try {
      if (w?.ipcRenderer?.invoke) {
        return await w.ipcRenderer.invoke('xtream:get', url);
      }
      const ipcr = w?.require?.('electron')?.ipcRenderer;
      if (ipcr?.invoke) {
        return await ipcr.invoke('xtream:get', url);
      }
    } catch (e) {
      // If IPC fails, fall back to direct HTTP
    }
    const tryOnce = async (u: string) => {
      const res = await axios.get(u, { timeout: 20000, validateStatus: () => true });
      if (res.status >= 200 && res.status < 300) return res.data;
      const err: any = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    };
    try {
      return await tryOnce(url);
    } catch (e: any) {
      const isTimeout = /timeout/i.test(e?.message || '') || e?.code === 'ECONNABORTED';
      const canSwitch = url.startsWith('http://') || url.startsWith('https://');
      if ((isTimeout || e?.status >= 500) && canSwitch) {
        const alt = url.startsWith('http://') ? url.replace('http://', 'https://') : url.replace('https://', 'http://');
        return await tryOnce(alt);
      }
      throw e;
    }
  }

  async authenticate() {
    try {
      const data = await this.request(`${this.baseUrl}/player_api.php?${this.params}`);
      return data;
    } catch (error) {
      const e: any = error;
      const status = e?.response?.status;
      const msg = e?.response?.data?.user_info?.message || e?.message || e?.code || 'Unknown error';
      throw new Error(`Xtream authentication failed: ${status ?? 'N/A'} ${msg}`);
    }
  }

  async getLiveCategories() {
    return await this.request(`${this.baseUrl}/player_api.php?${this.params}&action=get_live_categories`);
  }

  async getLiveStreams(categoryId?: string) {
    const action = `&action=get_live_streams${categoryId ? `&category_id=${categoryId}` : ''}`;
    return await this.request(`${this.baseUrl}/player_api.php?${this.params}${action}`);
  }

  async getVodCategories() {
    return await this.request(`${this.baseUrl}/player_api.php?${this.params}&action=get_vod_categories`);
  }

  async getVodStreams(categoryId?: string) {
    const action = `&action=get_vod_streams${categoryId ? `&category_id=${categoryId}` : ''}`;
    return await this.request(`${this.baseUrl}/player_api.php?${this.params}${action}`);
  }

  async getSeriesCategories() {
    return await this.request(`${this.baseUrl}/player_api.php?${this.params}&action=get_series_categories`);
  }

  async getSeries(categoryId?: string) {
    const action = `&action=get_series${categoryId ? `&category_id=${categoryId}` : ''}`;
    return await this.request(`${this.baseUrl}/player_api.php?${this.params}${action}`);
  }
  
  async getSeriesInfo(seriesId: string) {
    const action = `&action=get_series_info&series_id=${seriesId}`;
    return await this.request(`${this.baseUrl}/player_api.php?${this.params}${action}`);
  }

  async getVodInfo(vodId: string) {
    const action = `&action=get_vod_info&vod_id=${vodId}`;
    return await this.request(`${this.baseUrl}/player_api.php?${this.params}${action}`);
  }
}
