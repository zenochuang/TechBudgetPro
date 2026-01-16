
import React from 'react';

export const COLORS = {
  primary: '#00f2ff', // Electric Cyan
  success: '#22c55e', // Green 500
  danger: '#ef4444',  // Red 500
  budget: '#475569',  // Slate 600 (for budget bars)
  bg: '#020617',
  card: '#0f172a',
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount);
};
