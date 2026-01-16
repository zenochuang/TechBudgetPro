
import { Theme } from './types';

export const THEMES: Theme[] = [
  { 
    id: 'cyber', 
    name: '霓虹電路', 
    bgColor: '#050505', 
    panelBg: 'rgba(10, 10, 20, 0.75)', 
    accentColor: '#00f2ff', 
    accentGlow: 'rgba(0, 242, 255, 0.5)', 
    textColor: '#ffffff',
    borderStyle: '1px solid rgba(0, 242, 255, 0.3)',
    bgImage: 'linear-gradient(135deg, #050505 0%, #101020 100%)',
    fontFamily: "'Orbitron', sans-serif"
  },
  { 
    id: 'magma', 
    name: '熔岩黑金', 
    bgColor: '#0f0500', 
    panelBg: 'rgba(25, 10, 5, 0.8)', 
    accentColor: '#ff4d00', 
    accentGlow: 'rgba(255, 77, 0, 0.4)', 
    textColor: '#fff5f0',
    borderStyle: '1px solid rgba(255, 77, 0, 0.4)',
    bgImage: 'radial-gradient(circle at top right, #301000, #0f0500)',
    fontFamily: "'Noto Sans TC', sans-serif"
  },
  { 
    id: 'emerald', 
    name: '翡翠矩陣', 
    bgColor: '#000d05', 
    panelBg: 'rgba(5, 20, 10, 0.75)', 
    accentColor: '#10b981', 
    accentGlow: 'rgba(16, 185, 129, 0.4)', 
    textColor: '#ecfdf5',
    borderStyle: '1px solid rgba(16, 185, 129, 0.3)',
    bgImage: 'linear-gradient(180deg, #001a0a 0%, #000d05 100%)',
    fontFamily: "'Orbitron', sans-serif"
  },
  { 
    id: 'obsidian', 
    name: '極簡曜黑', 
    bgColor: '#000000', 
    panelBg: 'rgba(20, 20, 20, 0.85)', 
    accentColor: '#ffffff', 
    accentGlow: 'rgba(255, 255, 255, 0.2)', 
    textColor: '#ffffff',
    borderStyle: '1px solid #333333',
    bgImage: 'linear-gradient(to bottom, #111111, #000000)',
    fontFamily: "'Noto Sans TC', sans-serif"
  },
  { 
    id: 'amethyst', 
    name: '紫晶幻境', 
    bgColor: '#0a001a', 
    panelBg: 'rgba(20, 5, 40, 0.7)', 
    accentColor: '#d946ef', 
    accentGlow: 'rgba(217, 70, 239, 0.4)', 
    textColor: '#fdf4ff',
    borderStyle: '1px solid rgba(217, 70, 239, 0.3)',
    bgImage: 'radial-gradient(circle at center, #1a0033 0%, #0a001a 100%)',
    fontFamily: "'Orbitron', sans-serif"
  },
  { 
    id: 'deepsea', 
    name: '深海壓力', 
    bgColor: '#000a1a', 
    panelBg: 'rgba(5, 15, 30, 0.8)', 
    accentColor: '#3b82f6', 
    accentGlow: 'rgba(59, 130, 246, 0.4)', 
    textColor: '#eff6ff',
    borderStyle: '1px solid rgba(59, 130, 246, 0.3)',
    bgImage: 'linear-gradient(135deg, #001e3c 0%, #000a1a 100%)',
    fontFamily: "'Noto Sans TC', sans-serif"
  },
  { 
    id: 'carbon', 
    name: '碳纖灰調', 
    bgColor: '#171717', 
    panelBg: 'rgba(30, 30, 30, 0.8)', 
    accentColor: '#a8a29e', 
    accentGlow: 'rgba(168, 162, 158, 0.3)', 
    textColor: '#fafaf9',
    borderStyle: '1px solid #444444',
    bgImage: 'repeating-linear-gradient(45deg, #171717 0px, #171717 10px, #1c1c1c 10px, #1c1c1c 20px)',
    fontFamily: "'Noto Sans TC', sans-serif"
  },
  { 
    id: 'crimson', 
    name: '血脈科技', 
    bgColor: '#1a0000', 
    panelBg: 'rgba(30, 5, 5, 0.8)', 
    accentColor: '#ef4444', 
    accentGlow: 'rgba(239, 68, 68, 0.4)', 
    textColor: '#fef2f2',
    borderStyle: '1px solid rgba(239, 68, 68, 0.4)',
    bgImage: 'linear-gradient(to right, #2a0000, #1a0000)',
    fontFamily: "'Orbitron', sans-serif"
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
