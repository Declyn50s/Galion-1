import React, { useState, useRef, useEffect } from 'react';
import { Search, User, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SearchResult, mockSearchData } from '@/types/search';

interface GlobalSearchProps {
  onResultSelect: (result: SearchResult) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onResultSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fonction de recherche
  const searchUsers = (searchQuery: string): SearchResult[] => {
    if (searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    
    return mockSearchData.filter(user => {
      // Recherche par nom complet
      if (user.name.toLowerCase().includes(query)) {
        return { ...user, matchField: 'name', matchText: user.name };
      }
      
      // Recherche par prénom
      if (user.firstName?.toLowerCase().includes(query)) {
        return { ...user, matchField: 'firstName', matchText: user.firstName };
      }
      
      // Recherche par nom de famille
      if (user.lastName?.toLowerCase().includes(query)) {
        return { ...user, matchField: 'lastName', matchText: user.lastName };
      }
      
      // Recherche par NSS
      if (user.nss?.toLowerCase().includes(query)) {
        return { ...user, matchField: 'nss', matchText: user.nss };
      }
      
      // Recherche par numéro de dossier
      if (user.dossierNumber?.toLowerCase().includes(query)) {
        return { ...user, matchField: 'dossierNumber', matchText: user.dossierNumber };
      }
      
      // Recherche par date de naissance
      if (user.birthDate?.includes(query)) {
        return { ...user, matchField: 'birthDate', matchText: user.birthDate };
      }
      
      return false;
    }).map(user => ({
      ...user,
      matchField: getMatchField(user, query),
      matchText: getMatchText(user, query)
    }));
  };

  const getMatchField = (user: SearchResult, query: string): string => {
    const q = query.toLowerCase();
    if (user.name.toLowerCase().includes(q)) return 'name';
    if (user.firstName?.toLowerCase().includes(q)) return 'firstName';
    if (user.lastName?.toLowerCase().includes(q)) return 'lastName';
    if (user.nss?.toLowerCase().includes(q)) return 'nss';
    if (user.dossierNumber?.toLowerCase().includes(q)) return 'dossierNumber';
    if (user.birthDate?.includes(q)) return 'birthDate';
    return 'name';
  };

  const getMatchText = (user: SearchResult, query: string): string => {
    const field = getMatchField(user, query);
    switch (field) {
      case 'firstName': return user.firstName || '';
      case 'lastName': return user.lastName || '';
      case 'nss': return user.nss || '';
      case 'dossierNumber': return user.dossierNumber || '';
      case 'birthDate': return user.birthDate || '';
      default: return user.name;
    }
  };

  // Effet pour la recherche
  useEffect(() => {
    const searchResults = searchUsers(query);
    setResults(searchResults);
    setSelectedIndex(-1);
    setIsOpen(searchResults.length > 0);
  }, [query]);

  // Raccourci clavier Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigation clavier dans les résultats
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    onResultSelect(result);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const getFieldLabel = (field: string): string => {
    switch (field) {
      case 'firstName': return 'Prénom';
      case 'lastName': return 'Nom';
      case 'nss': return 'NSS';
      case 'dossierNumber': return 'N° Dossier';
      case 'birthDate': return 'Date de naissance';
      default: return 'Nom complet';
    }
  };

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Recherche... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onBlur={(e) => {
            // Délai pour permettre le clic sur les résultats
            setTimeout(() => {
              if (!resultsRef.current?.contains(e.relatedTarget as Node)) {
                setIsOpen(false);
              }
            }, 150);
          }}
          className="pl-10 pr-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400"
        />
      </div>

      {/* Résultats de recherche */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50"
        >
          {results.map((result, index) => (
            <div
              key={result.id}
              className={cn(
                "px-4 py-3 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors",
                index === selectedIndex
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
              onClick={() => handleResultSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {result.type === 'user' ? (
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-slate-900 dark:text-white truncate">
                      {highlightMatch(result.name, query)}
                    </h4>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                      {result.dossierNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      <strong>{getFieldLabel(result.matchField)}:</strong>{' '}
                      {highlightMatch(result.matchText, query)}
                    </span>
                    {result.birthDate && (
                      <span>
                        Né(e) le {new Date(result.birthDate).toLocaleDateString('fr-CH')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};