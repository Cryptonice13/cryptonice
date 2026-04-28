import { Button } from "@/components/ui/button";
import { SUPPORTED_EXCHANGES, type ExchangeId } from "@/lib/exchangeSymbols";
import { cn } from "@/lib/utils";

interface Props {
  value: ExchangeId;
  onChange: (id: ExchangeId) => void;
}

export function ExchangeSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SUPPORTED_EXCHANGES.map((ex) => (
        <Button
          key={ex.id}
          size="sm"
          variant={value === ex.id ? "default" : "outline"}
          onClick={() => onChange(ex.id)}
          className={cn("h-7 px-3 text-xs", value === ex.id && "shadow-sm")}
        >
          {ex.label}
        </Button>
      ))}
    </div>
  );
}
