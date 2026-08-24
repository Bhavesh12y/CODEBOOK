const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('codebook', {
  apiBaseUrl: process.env.CODEBOOK_API_BASE_URL || 'http://127.0.0.1:8765/api',
  desktop: true,
  platform: process.platform,
});
