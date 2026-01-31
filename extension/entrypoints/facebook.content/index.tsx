import './style.css';
import ReactDOM from 'react-dom/client';
import { LeadOverlay } from './LeadOverlay';
import { manualScanPage, setupAutoScanObserver, getCurrentPageInfo } from './dom-observer';
import { randomDelay } from '../../src/utils/human-mimicry';
import { settingsStorage } from '../../src/lib/storage';
import type { ScanResult } from '../../src/types';

let disconnectObserver: (() => void) | null = null;

export default defineContentScript({
  matches: ['*://*.facebook.com/*'],
  cssInjectionMode: 'ui',
  runAt: 'document_idle',
  
  async main(ctx) {
    const settings = await settingsStorage.getValue();
    if (!settings.isEnabled) return;
    
    await randomDelay(2000, 4000);
    
    if (ctx.isInvalid) return;

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'MANUAL_SCAN') {
        manualScanPage().then((result: ScanResult) => {
          sendResponse(result);
        });
        return true;
      }
      
      if (message.type === 'GET_PAGE_INFO') {
        sendResponse(getCurrentPageInfo());
        return true;
      }
      
      if (message.type === 'TOGGLE_AUTO_SCAN') {
        if (message.enabled && settings.scanMode === 'auto') {
          if (!disconnectObserver) {
            disconnectObserver = setupAutoScanObserver(() => {});
          }
        } else if (disconnectObserver) {
          disconnectObserver();
          disconnectObserver = null;
        }
        sendResponse({ success: true });
        return true;
      }
      
      return false;
    });
    
    if (settings.showOverlay) {
      const ui = await createShadowRootUi(ctx, {
        name: 'leadscout-overlay',
        position: 'overlay',
        anchor: 'body',
        isolateEvents: true,
        onMount: (container) => {
          const wrapper = document.createElement('div');
          wrapper.id = 'leadscout-root';
          container.append(wrapper);
          
          const root = ReactDOM.createRoot(wrapper);
          root.render(<LeadOverlay />);
          return root;
        },
        onRemove: (root) => {
          root?.unmount();
        },
      });
      
      ui.mount();
    }
    
    await randomDelay(1000, 2000);
    
    if (settings.scanMode === 'auto') {
      disconnectObserver = setupAutoScanObserver(() => {});
    }
    
    ctx.onInvalidated(() => {
      if (disconnectObserver) {
        disconnectObserver();
        disconnectObserver = null;
      }
    });
  },
});
