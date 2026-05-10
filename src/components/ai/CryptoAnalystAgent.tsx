import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { invokeCryptoAI, readCryptoAIError } from '@/lib/cryptoAIClient';


const quickPrompts = [
  "Should I buy BTC?",
  "Market outlook",
  "Risk analysis",
];

export default function CryptoAnalystAgent() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { address } = useAccount();

  const runAnalysis = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const res = await invokeCryptoAI({
        type: 'crypto_analyst',
        messages: [{ role: 'user', content: input }],
        context: {},
        walletAddress: address,
      });

      if (!res.ok) {
        const msg = await readCryptoAIError(res);
        throw new Error(msg);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setResponse(content);
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
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis(query);
  };

  return (
    <Card className="glass border-border/50 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border/30">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Strict Crypto Analyst</h3>
            <p className="text-xs text-muted-foreground tracking-wide">Emotionless · Data-Driven · Capital First</p>
          </div>
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2 mt-4">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => { setQuery(prompt); runAnalysis(prompt); }}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Analyze the Bitcoin market today"
          disabled={isLoading}
          className="bg-secondary/50 border-border/30"
        />
        <Button type="submit" disabled={isLoading || !query.trim()} size="icon" className="shrink-0">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>

      {/* Response */}
      {(response || isLoading || error) && (
        <div className="px-6 pb-6">
          {error && (
            <Badge variant="destructive" className="mb-2">{error}</Badge>
          )}
          {isLoading && !response && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Gathering live data & running analysis…
            </div>
          )}
          {response && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-invert prose-sm max-w-none text-foreground [&_h2]:text-primary [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_strong]:text-foreground"
            >
              <ReactMarkdown>{response}</ReactMarkdown>
            </motion.div>
          )}
        </div>
      )}
    </Card>
  );
}
