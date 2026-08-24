const { contextBridge } = require('electron');

const apiBaseUrl = process.env.CODEBOOK_API_BASE_URL || process.env.CPPBOOK_API_BASE_URL || 'http://127.0.0.1:8765/api';

const bridgeApi = {
  apiBaseUrl,
  desktop: true,
  platform: process.platform,
};

contextBridge.exposeInMainWorld('codebook', bridgeApi);
contextBridge.exposeInMainWorld('cppbook', bridgeApi);
