
import { Project, SubCategory, Transaction, PaymentMethod, YearConfig } from '../types';

const STORAGE_KEY = 'TECH_BUDGET_PRO_V3_DATA';

interface AppData {
  projects: Project[];
  subCategories: SubCategory[];
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  yearConfigs: YearConfig[];
  themeId?: string;
}

export const loadData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse storage', e);
    }
  }
  return { 
    projects: [], 
    subCategories: [], 
    transactions: [], 
    paymentMethods: [{ id: 'cash', name: '現金', emoji: '💵' }],
    yearConfigs: [{ year: new Date().getFullYear(), isCollapsed: false }]
  };
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
