import { useState, useEffect, useRef, useCallback } from 'react';
import { useDatabase } from '../../../hooks/useDatabase.tsx';
import { useToast } from '../../../hooks/useToast';
import type { Product } from '../../../types/types';

interface UseProductSearchProps {
  onProductSelect: (product: Product) => void;
}

interface UseProductSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: Product[];
  isSearching: boolean;
  selectedResultIndex: number;
  setSelectedResultIndex: (index: number) => void;
  showResults: boolean;
  setShowResults: (show: boolean) => void;
  inputHasFocus: boolean;
  setInputHasFocus: (focus: boolean) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchResultsRef: React.RefObject<HTMLDivElement | null>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleInputFocus: () => void;
  handleInputBlur: () => void;
  clearSearch: () => void;
  addSelectedProduct: () => void;
}

// Constants for barcode detection
const BARCODE_KEYSTROKE_THRESHOLD = 50; // milliseconds
const BARCODE_MIN_KEYSTROKES = 3;
const BARCODE_BLOCK_DURATION = 500; // 500ms to block Enter after detecting barcode

export const useProductSearch = ({ onProductSelect }: UseProductSearchProps): UseProductSearchReturn => {
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [lastSearchTerm, setLastSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [inputHasFocus, setInputHasFocus] = useState(false);
  
  // Refs for barcode detection and DOM elements
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const lastKeystrokeTimeRef = useRef<number>(0);
  const keystrokeTimesRef = useRef<number[]>([]);
  const isBarcodeScanning = useRef<boolean>(false);
  
  // Hooks
  const db = useDatabase();
  const toast = useToast();

  // Auto-focus on the input when component loads
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      setInputHasFocus(true);
    }
  }, []);

  // Handle clicks outside search area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click was outside the search input and results
      if (
        searchInputRef.current && 
        !searchInputRef.current.contains(target) &&
        searchResultsRef.current && 
        !searchResultsRef.current.contains(target)
      ) {
        setShowResults(false);
        setInputHasFocus(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Product search function
  const searchProducts = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setSelectedResultIndex(0);
      setLastSearchTerm('');
      setShowResults(false);
      return;
    }

    // Reset index if search term changed
    if (term !== lastSearchTerm) {
      setSelectedResultIndex(0);
      setLastSearchTerm(term);
    }

    setIsSearching(true);
    try {
      const results = await db.collections.products
        .find({
          selector: {
            $and: [
              { _deleted: false },
              {
                $or: [
                  { code: { $regex: term, $options: 'i' } },
                  { name: { $regex: term, $options: 'i' } }
                ]
              }
            ]
          },
          limit: 10
        })
        .exec();

      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching products:', error);
      toast.showError('Error al buscar productos');
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, [db, toast, lastSearchTerm]);

  // Debounce for search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchProducts]);

  // Handle barcode scanned - search and add product directly
  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const results = await db.collections.products
        .find({
          selector: {
            $and: [
              { _deleted: false },
              {
                $or: [
                  { code: { $regex: `^${barcode}$`, $options: 'i' } }, // Exact search first
                  { code: { $regex: barcode, $options: 'i' } },
                  { name: { $regex: barcode, $options: 'i' } }
                ]
              }
            ]
          },
          limit: 10
        })
        .exec();

      if (results.length > 0) {
        onProductSelect(results[0]);
        clearSearch();
      } else {
        toast.showWarning('No se encontró ningún producto con ese código');
      }
    } catch (error) {
      console.error('Error searching product by barcode:', error);
      toast.showError('Error al buscar producto');
    }
  };

  // Detect pause after fast input (barcode scanner)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const keystrokeTimes = keystrokeTimesRef.current;
      
      if (keystrokeTimes.length >= BARCODE_MIN_KEYSTROKES) {
        // Calculate intervals between keystrokes
        const intervals = [];
        for (let i = 1; i < keystrokeTimes.length; i++) {
          intervals.push(keystrokeTimes[i] - keystrokeTimes[i - 1]);
        }
        
        // Check if most intervals are very short (barcode scanner)
        const fastIntervals = intervals.filter(interval => interval < BARCODE_KEYSTROKE_THRESHOLD);
        const fastRatio = fastIntervals.length / intervals.length;
        
        if (fastRatio > 0.7 && searchTerm.trim()) {
          // Detected barcode scanner input - mark as scanning
          isBarcodeScanning.current = true;
          
          // Search and add product directly
          handleBarcodeScanned(searchTerm.trim());
          
          // Clear flag after a longer period to ensure Enter is blocked
          setTimeout(() => {
            isBarcodeScanning.current = false;
          }, BARCODE_BLOCK_DURATION);
        }
      }
      
      // Clear keystroke log
      keystrokeTimesRef.current = [];
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle input focus
  const handleInputFocus = () => {
    setInputHasFocus(true);
    if (searchResults.length > 0 && searchTerm.trim()) {
      setShowResults(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Don't change inputHasFocus here because click outside handles it
  };

  // Detect barcode entry
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentTime = Date.now();
    
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If we're in barcode scanning process, ignore Enter
      if (isBarcodeScanning.current) {
        console.log('Enter blocked - detected barcode scanning');
        return;
      }
      
      // Additional verification: if last keystroke was very recent (possible barcode scanner)
      const timeSinceLastKeystroke = currentTime - lastKeystrokeTimeRef.current;
      if (timeSinceLastKeystroke < 100 && searchTerm.length > 3) {
        console.log('Enter blocked - very recent keystroke, possible barcode scanner');
        // Mark as scanning temporarily
        isBarcodeScanning.current = true;
        setTimeout(() => {
          isBarcodeScanning.current = false;
        }, BARCODE_BLOCK_DURATION);
        return;
      }
      
      addSelectedProduct();
      return;
    }

    // Navigation with arrows
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedResultIndex(prev => Math.min(prev + 1, searchResults.length - 1));
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedResultIndex(prev => Math.max(prev - 1, 0));
      }
      return;
    }

    // Record keystroke times for barcode scanner detection
    keystrokeTimesRef.current.push(currentTime);
    
    // Keep only last relevant keystrokes
    if (keystrokeTimesRef.current.length > 20) {
      keystrokeTimesRef.current.shift();
    }

    lastKeystrokeTimeRef.current = currentTime;
  };

  // Add selected product from search results
  const addSelectedProduct = () => {
    if (searchResults.length > 0 && selectedResultIndex >= 0 && selectedResultIndex < searchResults.length) {
      onProductSelect(searchResults[selectedResultIndex]);
      clearSearch();
    } else if (searchResults.length > 0) {
      // Fallback: add first product if index is out of range
      onProductSelect(searchResults[0]);
      clearSearch();
    } else if (searchTerm.trim()) {
      toast.showWarning('No se encontró ningún producto con ese código');
    }
  };

  // Clear search and re-focus
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      setInputHasFocus(true);
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    selectedResultIndex,
    setSelectedResultIndex,
    showResults,
    setShowResults,
    inputHasFocus,
    setInputHasFocus,
    searchInputRef,
    searchResultsRef,
    handleKeyDown,
    handleInputFocus,
    handleInputBlur,
    clearSearch,
    addSelectedProduct
  };
};