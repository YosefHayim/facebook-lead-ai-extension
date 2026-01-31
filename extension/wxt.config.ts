import { defineConfig } from 'wxt';
import { resolve } from 'node:path';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'LeadScout AI - Facebook Lead Generation',
    description: 'AI-powered lead scouting for Facebook groups and feeds. Find high-intent leads and generate personalized replies.',
    version: '0.1.0',
    permissions: [
      'storage',
      'sidePanel',
      'activeTab',
      'tabs',
      'identity',
    ],
    host_permissions: [
      '*://*.facebook.com/*',
    ],
    side_panel: {
      default_path: 'sidepanel.html',
    },
    icons: {
      16: 'icon/icon-16.png',
      32: 'icon/icon-32.png',
      48: 'icon/icon-48.png',
      128: 'icon/icon-128.png',
    },
    action: {
      default_title: 'LeadScout AI',
      default_popup: 'popup.html',
      default_icon: {
        16: 'icon/icon-16.png',
        32: 'icon/icon-32.png',
        48: 'icon/icon-48.png',
        128: 'icon/icon-128.png',
      },
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
  },
  vite: () => ({
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  }),
});
