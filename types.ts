
export interface Transaction {
  id: string;
  subCategoryId: string;
  name: string;
  amount: number;
  date: number;
}

export interface SubCategory {
  id: string;
  projectId: string;
  name: string;
  emoji: string;
  budget: number;
}

export interface Project {
  id: string;
  name: string;
  emoji: string;
  totalBudget: number;
  createdAt: number;
}

export type ViewState = 
  | { type: 'PROJECT_LIST' }
  | { type: 'PROJECT_DETAIL'; projectId: string; tab: 'LIST' | 'CHART' }
  | { type: 'TRANSACTION_HISTORY'; subCategoryId: string; projectId: string };

export const EMOJIS = [
  '💰', '🏠', '🚗', '🍔', '✈️', '🎮', '💡', '📱', 
  '👗', '💪', '📚', '🎁', '🐱', '☕', '🎬', '💊',
  '🛠️', '🛒', '🚕', '🏥', '⛽', '💳', '🏦', '💎',
  '💻', '🍜', '🍺', '🎭', '🚲', '⚽', '🎨', '🎹'
];
