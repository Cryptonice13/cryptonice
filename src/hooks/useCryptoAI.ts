import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PortfolioAnalysis {
  healthScore: number;
  diversification: string;
  riskLevel: string;
  suggestions: string[];
  concerns: string[];
  summary: string;
}

interface MarketPrediction {
  shortTerm: { direction: string; target: number | string; confidence: number | string };
  mediumTerm: { direction: string; target: number | string; confidence: number | string };
  supportLevels: (number | string)[];
  resistanceLevels: (number | string)[];
  sentiment: string;
  overallConfidence: number | string;
  analysis: string;
}

interface TradingSignal {
  signal: 'BUY' | 'SELL' | 'HOLD';
  entryRange: { min: number | string; max: number | string };
  stopLoss: number | string;
  takeProfits: (number | string)[];
  riskReward: string;
  strength: number | string;
  reasoning: string;
  timeframe: string;
}

/** Strip markdown code fences and extract raw JSON string */
function extractJSON(raw: string): string {
  let str = raw.trim();
  const fenceMatch = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) str = fenceMatch[1].trim();
  return str;
}

/** Parse a value that might be "$66,200" or "65%" into a number */
function toNum(v: any): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[$,%\s]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crypto-ai`;

export function useCryptoAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (input: string, portfolioContext?: any) => {
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          type: 'chat',
          context: portfolioContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      const updateAssistant = (content: string) => {
        assistantContent = content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: 'assistant', content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateAssistant(assistantContent);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}

export function usePortfolioAnalysis() {
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePortfolio = useCallback(async (portfolio: any[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Analyze my portfolio' }],
          type: 'portfolio_analysis',
          context: portfolio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze portfolio');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        try {
          // Strip markdown code fences if present
          let jsonStr = content.trim();
          const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (fenceMatch) {
            jsonStr = fenceMatch[1].trim();
          }
          const parsed = JSON.parse(jsonStr);
          setAnalysis(parsed);
        } catch {
          setAnalysis({
            healthScore: 75,
            diversification: content,
            riskLevel: 'medium',
            suggestions: [],
            concerns: [],
            summary: content,
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { analysis, isLoading, error, analyzePortfolio };
}

export function useMarketPrediction() {
  const [prediction, setPrediction] = useState<MarketPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPrediction = useCallback(async (symbol: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Predict ${symbol}` }],
          type: 'market_prediction',
          context: { symbol },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get prediction');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        try {
          const parsed = JSON.parse(content);
          setPrediction(parsed);
        } catch {
          setPrediction({
            shortTerm: { direction: 'neutral', target: 0, confidence: 5 },
            mediumTerm: { direction: 'neutral', target: 0, confidence: 5 },
            supportLevels: [],
            resistanceLevels: [],
            sentiment: 'neutral',
            overallConfidence: 5,
            analysis: content,
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { prediction, isLoading, error, getPrediction };
}

export function useTradingSignal() {
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSignal = useCallback(async (symbol: string, price?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Trading signal for ${symbol}` }],
          type: 'trading_signal',
          context: { symbol, price },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get signal');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        try {
          const parsed = JSON.parse(content);
          setSignal(parsed);
        } catch {
          setSignal({
            signal: 'HOLD',
            entryRange: { min: 0, max: 0 },
            stopLoss: 0,
            takeProfits: [],
            riskReward: 'N/A',
            strength: 5,
            reasoning: content,
            timeframe: '1D',
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { signal, isLoading, error, getSignal };
}
