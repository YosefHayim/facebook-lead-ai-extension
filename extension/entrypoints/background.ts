import { initAI, generatePostReply } from '../src/lib/ai';
import { settingsStorage, sessionLimitsStorage, watchedGroupsStorage, updateWatchedGroup, leadsStorage, getActivePersona, updateLeadLCI, getLeadById } from '../src/lib/storage';
import { getLeadsByIds } from '../src/lib/bulk-actions';
import { startScheduler, stopScheduler, getSchedulerStatus, updateAutomationSettings } from '../src/lib/scheduler';
import { fetchLCIForLead } from '../src/lib/profile-scraper';

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

    if (message.type === 'BULK_GENERATE_REPLIES') {
      const { leadIds } = message as { leadIds: string[] };
      handleBulkGenerateReplies(leadIds).then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        sendResponse({ error: error.message });
      });
      return true;
    }

    if (message.type === 'GET_SCHEDULER_STATUS') {
      getSchedulerStatus().then((status) => {
        sendResponse(status);
      });
      return true;
    }

    if (message.type === 'START_SCHEDULER') {
      startScheduler().then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        sendResponse({ error: error.message });
      });
      return true;
    }

    if (message.type === 'STOP_SCHEDULER') {
      stopScheduler().then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        sendResponse({ error: error.message });
      });
      return true;
    }

    if (message.type === 'UPDATE_AUTOMATION_SETTINGS') {
      const { settings } = message as { settings: Record<string, unknown> };
      updateAutomationSettings(settings).then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        sendResponse({ error: error.message });
      });
      return true;
    }

    if (message.type === 'AUTOMATION_SCAN_GROUP') {
      const { groupId, groupUrl } = message as { groupId: string; groupUrl: string };
      browser.tabs.create({ url: groupUrl, active: false }).then((tab) => {
        if (tab.id) {
          setTimeout(() => {
            browser.tabs.sendMessage(tab.id!, { type: 'MANUAL_SCAN' }).then(() => {
              updateWatchedGroup(groupId, { lastVisited: Date.now() });
              setTimeout(() => {
                browser.tabs.remove(tab.id!);
              }, 30000);
            });
          }, 5000);
        }
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.type === 'FETCH_LEAD_LCI') {
      const { leadId } = message as { leadId: string };
      getLeadById(leadId).then(async (lead) => {
        if (!lead) {
          sendResponse({ error: 'Lead not found' });
          return;
        }
        const result = await fetchLCIForLead(leadId, lead.authorProfileUrl);
        if (result.lci) {
          await updateLeadLCI(leadId, result.lci);
        }
        sendResponse({ success: true, lci: result.lci });
      }).catch((error) => {
        sendResponse({ error: error.message });
      });
      return true;
    }
    
    return false;
  });

  async function handleBulkGenerateReplies(leadIds: string[]) {
    const persona = await getActivePersona();
    if (!persona) return;

    const leadsToProcess = await getLeadsByIds(leadIds);
    const leadsNeedingReplies = leadsToProcess.filter(lead => !lead.aiDraftReply);
    
    const allLeads = await leadsStorage.getValue();
    
    for (const lead of leadsNeedingReplies) {
      try {
        const reply = await generatePostReply(lead.postText, persona);
        const leadIndex = allLeads.findIndex(l => l.id === lead.id);
        if (leadIndex >= 0) {
          allLeads[leadIndex].aiDraftReply = reply;
        }
      } catch (error) {
        console.error(`Failed to generate reply for lead ${lead.id}:`, error);
      }
    }
    
    await leadsStorage.setValue(allLeads);
  }
  
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      await browser.sidePanel.open({ tabId: tab.id });
    }
  });
});
