const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('cppbook', {
  apiBaseUrl: process.env.CPPBOOK_API_BASE_URL || 'http://127.0.0.1:8765/api',
  desktop: true,
  platform: process.platform,
});
