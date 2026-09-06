import React, { useState, useEffect, useRef } from 'react';

export interface SearchOption {
  id: string;
  title: string;
  [key: string]: any;
}

interface SearchSelectProps {
  label?: string;
  placeholder?: string;
  error?: string;
  value: SearchOption | null;
  onChange: (option: SearchOption | null) => void;
  onSearch: (query: string) => Promise<SearchOption[]>;
}

export function SearchSelect({ label, placeholder, error, value, onChange, onSearch }: SearchSelectProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await onSearch(query);
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleSelect = (option: SearchOption) => {
    onChange(option);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="flex flex-col gap-1 w-full text-left relative" ref={containerRef}>
      {label && <label className="text-sm font-medium text-ink">{label}</label>}
      
      {value ? (
        <div className="border border-pine bg-pine/5 p-4 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <h3 className="font-display font-medium">{value.id}</h3>
            <button 
              type="button" 
              onClick={() => onChange(null)}
              className="text-sm text-neutral-grey hover:text-ink underline"
            >
              Change
            </button>
          </div>
          <p className="text-sm">{value.title}</p>
        </div>
      ) : (
        <>
          <input
            type="text"
            className={`border bg-transparent px-3 py-2 outline-none focus:border-pine placeholder:text-neutral-grey
              ${error ? 'border-ember' : 'border-neutral-grey/30'}
            `}
            placeholder={placeholder || "Search..."}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
          {error && <span className="text-sm text-ember">{error}</span>}

          {isOpen && (query.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-paper border border-neutral-grey/30 shadow-lg max-h-60 overflow-y-auto z-10">
              {loading ? (
                <div className="p-3 text-sm text-neutral-grey">Searching...</div>
              ) : results.length > 0 ? (
                results.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    className="w-full text-left p-3 hover:bg-black/5 border-b border-neutral-grey/10 last:border-0"
                    onClick={() => handleSelect(opt)}
                  >
                    <div className="font-mono text-sm text-pine mb-1">{opt.id}</div>
                    <div className="text-sm line-clamp-2">{opt.title}</div>
                  </button>
                ))
              ) : (
                <div className="p-3 text-sm text-neutral-grey">No results found</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
