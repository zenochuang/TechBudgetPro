
import { Theme } from './types';

export const THEMES: Theme[] = [
  { 
    id: 'space', 
    name: '星際星雲', 
    bgColor: '#020617', 
    panelBg: 'rgba(10, 20, 40, 0.7)', 
    accentColor: '#c084fc', 
    accentGlow: 'rgba(192, 132, 252, 0.5)', 
    textColor: '#f1f5f9',
    borderStyle: '1px solid rgba(192, 132, 252, 0.2)',
    bgImage: 'url("bg-1.jpg")',
    fontFamily: "'Orbitron', sans-serif"
  },
  { 
    id: 'sunset', 
    name: '暮色暖陽', 
    bgColor: '#1c0a00', 
    panelBg: 'rgba(40, 20, 10, 0.75)', 
    accentColor: '#fb923c', 
    accentGlow: 'rgba(251, 146, 60, 0.5)', 
    textColor: '#fff7ed',
    borderStyle: '1px solid rgba(251, 146, 60, 0.4)',
    bgImage: 'url("bg-2.jpg")',
    fontFamily: "'Noto Sans TC', sans-serif"
  },
  { 
    id: 'ice', 
    name: '極地霜凍', 
    bgColor: '#0f172a', 
    panelBg: 'rgba(255, 255, 255, 0.1)', 
    accentColor: '#7dd3fc', 
    accentGlow: 'rgba(125, 211, 252, 0.4)', 
    textColor: '#f0f9ff',
    borderStyle: '1px solid rgba(255, 255, 255, 0.3)',
    bgImage: 'url("bg-3.jpg")',
    fontFamily: "'Noto Sans TC', sans-serif"
  },
  { 
    id: 'sakura', 
    name: '櫻花時光', 
    bgColor: '#1c0b11', 
    panelBg: 'rgba(50, 15, 30, 0.75)', 
    accentColor: '#f9a8d4', 
    accentGlow: 'rgba(249, 168, 212, 0.5)', 
    textColor: '#fff1f2',
    borderStyle: '1px solid rgba(249, 168, 212, 0.3)',
    bgImage: 'url("bg-4.jpg")',
    fontFamily: "'Noto Sans TC', sans-serif"
  },
  { 
    id: 'royal', 
    name: '曜黑流金', 
    bgColor: '#000000', 
    panelBg: 'rgba(15, 15, 15, 0.85)', 
    accentColor: '#fbbf24', 
    accentGlow: 'rgba(251, 191, 36, 0.6)', 
    textColor: '#ffffff',
    borderStyle: '1.5px solid #fbbf24',
    bgImage: 'url("bg-5.jpg")',
    fontFamily: "'Noto Sans TC', sans-serif"
  },
  { 
    id: 'abstract', 
    name: '幻彩波紋', 
    bgColor: '#061a1a', 
    panelBg: 'rgba(15, 30, 30, 0.7)', 
    accentColor: '#99f6e4', 
    accentGlow: 'rgba(153, 246, 228, 0.4)', 
    textColor: '#f0fdfa',
    borderStyle: '1px solid rgba(153, 246, 228, 0.2)',
    bgImage: 'url("bg-6.jpg")',
    fontFamily: "'Orbitron', sans-serif"
  },
  { 
    id: 'cyber', 
    name: '霓虹都市', 
    bgColor: '#050505', 
    panelBg: 'rgba(10, 5, 25, 0.75)', 
    accentColor: '#22d3ee', 
    accentGlow: 'rgba(34, 211, 238, 0.6)', 
    textColor: '#ffffff',
    borderStyle: '2px solid #22d3ee',
    bgImage: 'url("bg-7.jpg")',
    fontFamily: "'Orbitron', sans-serif"
  },
  { 
    id: 'forest', 
    name: '晨曦森林', 
    bgColor: '#052e16', 
    panelBg: 'rgba(10, 25, 15, 0.75)', 
    accentColor: '#4ade80', 
    accentGlow: 'rgba(74, 222, 128, 0.5)', 
    textColor: '#f0fdf4',
    borderStyle: '1px solid rgba(74, 222, 128, 0.3)',
    bgImage: 'url("bg-8.jpg")',
    fontFamily: "'Noto Sans TC', sans-serif"
  }
];

export const COLORS = {
  success: '#22c55e',
  danger: '#ef4444',
  budget: '#475569',
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount);
};
