
export interface PaymentCycleConfig {
  fromType: 'PREV' | 'CURRENT' | 'NEXT'; // 起始月份：上月、本月、下月
  fromDay: number; // 起始日
  toType: 'PREV' | 'CURRENT' | 'NEXT'; // 結束月份
  toDay: number; // 結束日
}

export interface PaymentMethod {
  id: string;
  name: string;
  emoji: string;
  // 移除舊的 statementDay，改用更有彈性的 cycleConfig
  cycleConfig?: PaymentCycleConfig; 
}

export interface Transaction {
  id: string;
  subCategoryId: string;
  paymentMethodId: string; // 支付渠道 ID
  name: string;
  amount: number;
  date: number; // 原始交易時間
}

export interface SubCategory {
  id: string;
  projectId: string; // 對應月份卡片的 ID (YYYY-MM)
  name: string;
  emoji: string;
  budget: number;
}

export interface Project {
  id: string; // YYYY-MM
  year: number;
  month: number;
  emoji: string;
  totalBudget: number;
  createdAt: number;
}

export interface YearConfig {
  year: number;
  isCollapsed: boolean;
}

export interface Theme {
  id: string;
  name: string;
  bgColor: string;
  panelBg: string;
  accentColor: string;
  accentGlow: string;
  textColor: string;
  borderStyle: string;
  bgImage: string;
  fontFamily: string;
}

export type ViewState = 
  | { type: 'PROJECT_LIST'; tab: 'BUDGET' | 'PAYMENT' }
  | { type: 'PROJECT_DETAIL'; projectId: string }
  | { type: 'TRANSACTION_HISTORY'; subCategoryId: string; projectId: string }
  | { type: 'THEME_SETTINGS' };

export const EMOJIS = [
  '💰', '🏠', '🚗', '🍔', '✈️', '🎮', '💡', '📱', 
  '👗', '💪', '📚', '🎁', '🐱', '☕', '🎬', '💊',
  '🛠️', '🛒', '🚕', '🏥', '⛽', '💳', '🏦', '💎',
  '💻', '🍜', '🍺', '🎭', '🚲', '⚽', '🎨', '🎹'
];
