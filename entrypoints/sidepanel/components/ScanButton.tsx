import { useState } from 'react';
import { Search, RefreshCw, AlertCircle } from 'lucide-react';
import type { ScanResult, SessionLimits } from '../../../src/types';

interface ScanButtonProps {
  sessionLimits: SessionLimits | null;
}

export function ScanButton({ sessionLimits }: ScanButtonProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const handleManualScan = async () => {
    setIsScanning(true);
    setScanResult(null);

    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const result = (await browser.tabs.sendMessage(tab.id, { type: 'MANUAL_SCAN' })) as ScanResult;
        setScanResult(result);
      }
    } catch (error) {
      setScanResult({
        postsFound: 0,
        leadsDetected: 0,
        errors: [`Scan failed: ${error}`],
        timestamp: Date.now(),
      });
    } finally {
      setIsScanning(false);
    }
  };

  const isPaused = sessionLimits?.isPaused ?? false;
  const isDisabled = isScanning || isPaused;

  return (
    <div className="bg-white border-b border-gray-200 p-3">
      <button
        onClick={handleManualScan}
        disabled={isDisabled}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
          isDisabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isScanning ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" /> Scanning...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" /> Scan This Page
          </>
        )}
      </button>
      {scanResult && <ScanResultMessage result={scanResult} />}
    </div>
  );
}

function ScanResultMessage({ result }: { result: ScanResult }) {
  const hasErrors = result.errors.length > 0;

  return (
    <div
      className={`mt-2 text-xs p-2 rounded ${
        hasErrors ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
      }`}
    >
      {hasErrors ? (
        <span className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {result.errors[0]}
        </span>
      ) : (
        <span>
          Found {result.postsFound} posts, {result.leadsDetected} leads detected
        </span>
      )}
    </div>
  );
}
