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
    action: {
      default_title: 'LeadScout AI',
      default_popup: 'popup.html',
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
