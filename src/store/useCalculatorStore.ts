import { create } from 'zustand';
import { CalculatorOperation, CalculatorHistoryItem } from '../types';
import { executeCalculatorRequest } from '../lib/socket';
import { getErrorMessage } from '../lib/api';

interface CalculatorState {
  operation: CalculatorOperation;
  numbers: string[];
  result: number | null;
  isCalculating: boolean;
  error: string | null;
  history: CalculatorHistoryItem[];

  // Actions
  setOperation: (operation: CalculatorOperation) => void;
  setNumber: (index: number, value: string) => void;
  addNumber: () => void;
  removeNumber: (index: number) => void;
  reset: () => void;
  calculate: () => Promise<void>;
  clearHistory: () => void;
}

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  operation: 'add',
  numbers: ['', ''],
  result: null,
  isCalculating: false,
  error: null,
  history: [],

  setOperation: (operation) => set({ operation }),

  setNumber: (index, value) => {
    set((state) => ({
      numbers: state.numbers.map((num, i) => (i === index ? value : num)),
    }));
  },

  addNumber: () => {
    set((state) => {
      if (state.numbers.length >= 100) return state;
      return { numbers: [...state.numbers, ''] };
    });
  },

  removeNumber: (index) => {
    set((state) => {
      if (state.numbers.length <= 1) return state;
      return { numbers: state.numbers.filter((_, i) => i !== index) };
    });
  },

  reset: () => {
    set({
      numbers: ['', ''],
      result: null,
      error: null,
      operation: 'add',
    });
  },

  calculate: async () => {
    const { operation, numbers, isCalculating } = get();
    if (isCalculating) return;

    set({ error: null, result: null });

    // Validation
    const numericValues = numbers.map((val) => Number(val));

    if (
      numbers.some((val) => val.trim() === '') ||
      numericValues.some((val) => !Number.isFinite(val) || Math.abs(val) > 1e12)
    ) {
      set({ error: '۱ تا ۱۰۰ عدد معتبر با قدر مطلق حداکثر ۱۰ به توان ۱۲ وارد کنید.' });
      return;
    }

    if (numericValues.length < 1 || numericValues.length > 100) {
      set({ error: 'تعداد اعداد باید بین ۱ تا ۱۰۰ باشد.' });
      return;
    }

    if (operation === 'divide' && numericValues.some((val) => val === 0)) {
      set({ error: 'برای عمل تقسیم، عدد صفر مجاز نیست.' });
      return;
    }

    set({ isCalculating: true });

    try {
      const calculatedResult = await executeCalculatorRequest({
        operation,
        numbers: numericValues,
      });

      const historyItem: CalculatorHistoryItem = {
        id: crypto.randomUUID(),
        operation,
        numbers: numericValues,
        result: calculatedResult,
        timestamp: Date.now(),
      };

      set((state) => ({
        result: calculatedResult,
        isCalculating: false,
        history: [historyItem, ...state.history.slice(0, 19)], // Keep up to 20 items
      }));
    } catch (err) {
      set({
        error: getErrorMessage(err),
        isCalculating: false,
      });
    }
  },

  clearHistory: () => set({ history: [] }),
}));
