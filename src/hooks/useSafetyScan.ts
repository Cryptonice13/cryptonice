import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { useCredits } from '@/hooks/useCredits';
import { useToast } from '@/hooks/use-toast';

const SCAN_COST = 5;

export interface SafetyFactor {
  key: string;
  label: string;
  severity: 'good' | 'info' | 'warning' | 'danger' | 'critical';
  value: string;
  description: string;
  weight: number;
}

export interface SafetyScan {
  id?: string;
  contract_address: string;
  chain: string;
  token_name: string | null;
  token_symbol: string | null;
  token_logo: string | null;
  risk_score: number;
  risk_level: string;
  recommendation: string;
  ai_verdict: string | null;
  factors: SafetyFactor[];
  goplus_data?: any;
  dex_data?: any;
  created_at?: string;
}

export function useSafetyScan() {
  const { user } = useAuth();
  const { address } = useAccount();
  const { balance, deductCredits } = useCredits();
  const { toast } = useToast();

  const [scanning, setScanning] = useState(false);
  const [scan, setScan] = useState<SafetyScan | null>(null);
  const [history, setHistory] = useState<SafetyScan[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const userId = user?.id;
  const walletAddr = address;

  const loadHistory = useCallback(async () => {
    if (!userId && !walletAddr) { setHistory([]); return; }
    setLoadingHistory(true);
    try {
      let q = supabase.from('safety_scans' as any).select('*').order('created_at', { ascending: false }).limit(20);
      if (userId) q = q.eq('user_id', userId);
      else q = q.eq('wallet_address', walletAddr).is('user_id', null);
      const { data } = await q;
      setHistory((data as any[] as SafetyScan[]) || []);
    } finally {
      setLoadingHistory(false);
    }
  }, [userId, walletAddr]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const runScan = useCallback(async (contract: string, chain: string) => {
    if (!contract.trim()) {
      toast({ title: 'Address required', description: 'Paste a contract address to scan.', variant: 'destructive' });
      return null;
    }

    if (!userId && !walletAddr) {
      toast({ title: 'Sign in or connect wallet', description: 'You need an account or wallet to scan tokens.', variant: 'destructive' });
      return null;
    }

    if (balance === null || balance < SCAN_COST) {
      toast({
        title: 'Insufficient credits',
        description: `Token Safety Scans cost ${SCAN_COST} credits. Top up to continue.`,
        variant: 'destructive',
      });
      return null;
    }

    setScanning(true);
    try {
      // Deduct first; refund logic is overkill for a 5-credit op
      const ok = await deductCredits(SCAN_COST, `Token Safety Scan — ${contract.slice(0, 10)}...`);
      if (!ok) return null;

      const { data, error } = await supabase.functions.invoke('token-safety-scan', {
        body: { contract: contract.trim(), chain, userId, walletAddress: walletAddr },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result = data.scan as SafetyScan;
      setScan(result);
      await loadHistory();

      toast({
        title: data.cached ? 'Loaded cached scan' : 'Scan complete',
        description: `Risk score: ${result.risk_score}/100 (${result.risk_level.toUpperCase()})`,
      });
      return result;
    } catch (e: any) {
      toast({
        title: 'Scan failed',
        description: e?.message || 'Could not analyze this contract.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setScanning(false);
    }
  }, [userId, walletAddr, balance, deductCredits, toast, loadHistory]);

  const loadScanById = useCallback((id: string) => {
    const found = history.find(h => h.id === id);
    if (found) setScan(found);
  }, [history]);

  return {
    scanning,
    scan,
    setScan,
    runScan,
    history,
    loadingHistory,
    refreshHistory: loadHistory,
    loadScanById,
    SCAN_COST,
  };
}
