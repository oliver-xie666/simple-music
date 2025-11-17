import axios from 'axios';

// 根据环境确定 API 的 baseURL
const baseURL = import.meta.env.DEV ? '/' : 'https://music-api.gdstudio.xyz/';

const apiClient = axios.create({
  baseURL: baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function generateSignature() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const searchMusic = (keyword: string, source: string, page: number = 1, count: number = 20) => {
  const signature = generateSignature();
  const params = new URLSearchParams({
    types: 'search',
    source,
    name: keyword,
    count: count.toString(),
    pages: page.toString(),
    s: signature,
  });

  // 根据环境确定请求路径
  const url = import.meta.env.DEV ? `/proxy?${params.toString()}` : `/api.php?${params.toString()}`;
  
  return apiClient.get(url);
};

export const getSongUrl = async (songId: string, source: string, quality: string = '320') => {
  const signature = generateSignature();
  const params = new URLSearchParams({
    types: 'url',
    id: songId,
    source,
    br: quality,
    s: signature,
  });

  const url = import.meta.env.DEV ? `/proxy?${params.toString()}` : `/api.php?${params.toString()}`;
  
  return apiClient.get(url);
};

export const getLyric = async (songId: string, source: string = 'netease') => {
  const signature = generateSignature();
  const params = new URLSearchParams({
    types: 'lyric',
    id: songId,
    source,
    s: signature,
  });

  const url = import.meta.env.DEV ? `/proxy?${params.toString()}` : `/api.php?${params.toString()}`;

  return apiClient.get(url);
};

export const getPicUrl = async (picId: string, source: string = 'netease', size: number = 300): Promise<string> => {
  if (!picId) return '';

  const signature = generateSignature();
  const params = new URLSearchParams({
    types: 'pic',
    id: picId,
    source,
    size: size.toString(),
    s: signature,
  });

  const url = import.meta.env.DEV ? `/proxy?${params.toString()}` : `/api.php?${params.toString()}`;
  const response = await apiClient.get(url);
  const data = response?.data;

  if (typeof data === 'string') {
    return data;
  }

  if (data && typeof data.url === 'string') {
    return data.url;
  }

  return '';
};