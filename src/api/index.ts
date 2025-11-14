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

export const searchMusic = (keyword: string, source: string, page: number = 1, count: number = 100) => {
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