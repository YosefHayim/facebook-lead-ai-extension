import { initAI } from '../src/lib/ai';
import { settingsStorage, sessionLimitsStorage, watchedGroupsStorage, updateWatchedGroup } from '../src/lib/storage';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async () => {
    const apiKey = await browser.storage.local.get('geminiApiKey');
    if (apiKey.geminiApiKey) {
      const settings = await settingsStorage.getValue();
      initAI(settings.aiProvider, apiKey.geminiApiKey);
    }
  });
  
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'OPEN_SIDEPANEL') {
      browser.sidePanel.open({ windowId: message.windowId }).catch(console.error);
      sendResponse({ success: true });
      return true;
    }
    
    if (message.type === 'SET_API_KEY') {
      browser.storage.local.set({ [message.provider + 'ApiKey']: message.apiKey });
      initAI(message.provider, message.apiKey);
      sendResponse({ success: true });
      return true;
    }
    
    if (message.type === 'GET_API_KEY') {
      browser.storage.local.get(message.provider + 'ApiKey').then((result) => {
        sendResponse({ apiKey: result[message.provider + 'ApiKey'] });
      });
      return true;
    }

    if (message.type === 'TRIGGER_MANUAL_SCAN') {
      const tabId = sender.tab?.id || message.tabId;
      if (tabId) {
        browser.tabs.sendMessage(tabId, { type: 'MANUAL_SCAN' }).then((result) => {
          sendResponse(result);
        }).catch((error) => {
          sendResponse({ error: error.message });
        });
      }
      return true;
    }

    if (message.type === 'GET_SESSION_LIMITS') {
      sessionLimitsStorage.getValue().then((limits) => {
        sendResponse(limits);
      });
      return true;
    }

    if (message.type === 'RESET_SESSION_LIMITS') {
      sessionLimitsStorage.setValue({
        maxPostsPerHour: message.maxPostsPerHour || 30,
        maxGroupsPerDay: message.maxGroupsPerDay || 10,
        cooldownMinutes: message.cooldownMinutes || 15,
        postsScannedThisHour: 0,
        groupsVisitedToday: 0,
        lastHourReset: Date.now(),
        lastDayReset: new Date().toDateString(),
        isPaused: false,
      }).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.type === 'GET_WATCHED_GROUPS') {
      watchedGroupsStorage.getValue().then((groups) => {
        sendResponse(groups);
      });
      return true;
    }

    if (message.type === 'RECORD_GROUP_VISIT') {
      const { groupId, leadsFound } = message;
      updateWatchedGroup(groupId, { 
        lastVisited: Date.now(),
        leadsFound: leadsFound || 0,
      }).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.type === 'OPEN_GROUP') {
      const { url, groupId } = message;
      browser.tabs.create({ url }).then((tab) => {
        if (groupId) {
          updateWatchedGroup(groupId, { lastVisited: Date.now() });
        }
        sendResponse({ success: true, tabId: tab.id });
      });
      return true;
    }
    
    return false;
  });
  
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      await browser.sidePanel.open({ tabId: tab.id });
    }
  });
});
