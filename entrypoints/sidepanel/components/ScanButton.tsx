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
    <div className="bg-background p-4">
      <button
        onClick={handleManualScan}
        disabled={isDisabled}
        className={`w-full flex items-center justify-center gap-2.5 h-12 rounded-xl font-semibold text-[15px] transition-colors ${
          isDisabled
            ? 'bg-card-elevated text-foreground-muted cursor-not-allowed'
            : 'bg-foreground text-background hover:bg-accent-hover'
        }`}
      >
        {isScanning ? (
          <>
            <RefreshCw className="w-[18px] h-[18px] animate-spin" /> Scanning...
          </>
        ) : (
          <>
            <Search className="w-[18px] h-[18px]" /> Scan This Page
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
      className={`mt-3 text-xs p-3 rounded-lg ${
        hasErrors ? 'bg-card text-foreground-secondary' : 'bg-card text-foreground-secondary'
      }`}
    >
      {hasErrors ? (
        <span className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
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
