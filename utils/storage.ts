
import { Project, SubCategory, Transaction } from '../types';

const STORAGE_KEY = 'TECH_BUDGET_PRO_DATA';

interface AppData {
  projects: Project[];
  subCategories: SubCategory[];
  transactions: Transaction[];
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
  return { projects: [], subCategories: [], transactions: [] };
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
