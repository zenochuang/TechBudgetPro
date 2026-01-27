
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, 
  ChevronLeft, 
  Trash2, 
  Edit3, 
  List, 
  Settings2,
  Calendar,
  Wallet,
  Palette,
  Check,
  CreditCard,
  ChevronDown,
  ChevronUp,
  History,
  Info,
  Settings
} from 'lucide-react';
import { Project, SubCategory, Transaction, ViewState, EMOJIS, Theme, PaymentMethod, YearConfig } from './types';
import { THEMES, formatCurrency } from './constants';
import { loadData, saveData } from './utils/storage';

// 支付專用 16 個 Emoji
const PAYMENT_EMOJIS = ['💳', '💵', '📱', '🏦', '💎', '💰', '💸', '🔗', '🍎', '🧧', '🏪', '🛒', '🚕', '🍔', '🎮', '✈️'];

// 12 生肖 Emoji
const ZODIACS = ['🐭', '🐂', '🐅', '🐇', '🐉', '🐍', '🐎', '🐑', '🐒', '🐓', '🐕', '🐖'];

const App = () => {
  const [data, setData] = useState(() => {
    const d = loadData();
    if (!d.paymentMethods || d.paymentMethods.length === 0) {
      d.paymentMethods = [{ id: 'cash', name: '現金', emoji: '💵' }];
    }
    if (!d.yearConfigs) {
      d.yearConfigs = [{ year: new Date().getFullYear(), isCollapsed: false }];
    }
    return d;
  });

  const [view, setView] = useState<ViewState>({ type: 'PROJECT_LIST', tab: 'BUDGET' });
  const [activePaymentModal, setActivePaymentModal] = useState<{ type: 'ADD' | 'EDIT', method?: PaymentMethod } | null>(null);
  const [isManagingPayments, setIsManagingPayments] = useState(false);
  const [activeSubCategoryModal, setActiveSubCategoryModal] = useState<{ type: 'ADD' | 'EDIT', sub?: SubCategory, projectId: string } | null>(null);
  const [activeTransactionModal, setActiveTransactionModal] = useState<{ type: 'ADD' | 'EDIT', subId: string, tx?: Transaction } | null>(null);
  const [isEditProjectModal, setIsEditProjectModal] = useState<Project | null>(null);
  
  // 新增：客製化確認視窗狀態，取代原生 window.confirm 以避免手機端阻擋
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    title: string; 
    message: string; 
    onConfirm: () => void;
  } | null>(null);

  const currentMonthRef = useRef<HTMLDivElement>(null);
  const paymentMonthRef = useRef<HTMLDivElement>(null);

  const [currentTheme, setCurrentTheme] = useState<Theme>(
    THEMES.find(t => t.id === (data as any).themeId) || THEMES[0]
  );

  useEffect(() => {
    const today = new Date();
    ensureYearExists(today.getFullYear());
  }, []);

  useEffect(() => {
    if (view.type === 'PROJECT_LIST') {
      const targetRef = view.tab === 'BUDGET' ? currentMonthRef : paymentMonthRef;
      if (targetRef.current) {
        setTimeout(() => {
          targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [view]);

  const ensureYearExists = (year: number) => {
    setData(prev => {
      const existingMonths = prev.projects.filter(p => p.year === year);
      if (existingMonths.length === 12) return prev;
      const newMonths: Project[] = [];
      for (let m = 1; m <= 12; m++) {
        const id = `${year}-${String(m).padStart(2, '0')}`;
        if (!prev.projects.find(p => p.id === id)) {
          newMonths.push({
            id,
            year,
            month: m,
            emoji: '📅',
            totalBudget: 30000,
            createdAt: Date.now()
          });
        }
      }
      const updatedYearConfigs = prev.yearConfigs || [];
      if (!updatedYearConfigs.find(y => y.year === year)) {
        updatedYearConfigs.push({ year, isCollapsed: false });
      }
      return { 
        ...prev, 
        projects: [...prev.projects, ...newMonths].sort((a,b) => a.id.localeCompare(b.id)),
        yearConfigs: updatedYearConfigs
      };
    });
  };

  useEffect(() => {
    saveData({ ...data, themeId: currentTheme.id } as any);
  }, [data, currentTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', currentTheme.bgColor);
    root.style.setProperty('--bg-gradient', currentTheme.bgImage);
    root.style.setProperty('--panel-bg', currentTheme.panelBg);
    root.style.setProperty('--accent-color', currentTheme.accentColor);
    root.style.setProperty('--accent-glow', currentTheme.accentGlow);
    root.style.setProperty('--text-color', currentTheme.textColor);
    root.style.setProperty('--border-style', currentTheme.borderStyle);
    root.style.fontFamily = currentTheme.fontFamily;
  }, [currentTheme]);

  const endCurrentYear = () => {
    const lastYear = Math.max(...data.yearConfigs.map(y => y.year));
    setData(prev => ({
      ...prev,
      yearConfigs: prev.yearConfigs.map(y => ({ ...y, isCollapsed: true }))
    }));
    ensureYearExists(lastYear + 1);
    alert(`已完成 ${lastYear} 年結算，已為您開啟 ${lastYear + 1} 年預算表。`);
  };

  // 刪除年度邏輯 (使用客製化 Modal)
  const deleteYear = (year: number) => {
    const currentYearNum = new Date().getFullYear();
    if (Number(year) === currentYearNum) {
      alert("無法刪除當前年度。");
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: '刪除年度確認',
      message: `確定要刪除 ${year} 年度嗎？\n這將永久移除該年份的所有月份卡片、摺疊清單、支項設定與交易紀錄！此操作不可恢復。`,
      onConfirm: () => {
        setData(prev => {
          const projectIdsToDelete = prev.projects.filter(p => p.year === year).map(p => p.id);
          const subCategoryIdsToDelete = prev.subCategories
            .filter(s => projectIdsToDelete.includes(s.projectId))
            .map(s => s.id);

          return {
            ...prev,
            yearConfigs: prev.yearConfigs.filter(y => y.year !== year),
            projects: prev.projects.filter(p => p.year !== year),
            subCategories: prev.subCategories.filter(s => !projectIdsToDelete.includes(s.projectId)),
            transactions: prev.transactions.filter(t => {
              if (subCategoryIdsToDelete.includes(t.subCategoryId)) return false;
              if (t.subCategoryId.startsWith('free-money-')) {
                const pid = t.subCategoryId.replace('free-money-', '');
                if (projectIdsToDelete.includes(pid)) return false;
              }
              return true;
            })
          };
        });
        setConfirmModal(null);
      }
    });
  };

  const getProjectStats = (projectId: string) => {
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return { totalRemaining: 0, subStats: [], totalBudget: 0, totalSpent: 0 };
    const subs = data.subCategories.filter(s => s.projectId === projectId);
    const allocatedBudgetSum = subs.reduce((sum, s) => sum + s.budget, 0);
    const freeMoneyBudget = project.totalBudget - allocatedBudgetSum;
    const regularSubStats = subs.map(sub => {
      const spent = data.transactions.filter(t => t.subCategoryId === sub.id).reduce((sum, t) => sum + t.amount, 0);
      return { ...sub, spent, remaining: sub.budget - spent };
    });
    const freeMoneyId = `free-money-${projectId}`;
    const freeMoneySpent = data.transactions.filter(t => t.subCategoryId === freeMoneyId).reduce((sum, t) => sum + t.amount, 0);
    const freeMoneyStat = { id: freeMoneyId, projectId, name: '閒錢', emoji: '✨', budget: freeMoneyBudget, spent: freeMoneySpent, remaining: freeMoneyBudget - freeMoneySpent, isFreeMoney: true };
    const subStats = [freeMoneyStat, ...regularSubStats];
    const totalSpent = data.transactions.filter(t => subStats.some(s => s.id === t.subCategoryId)).reduce((sum, t) => sum + t.amount, 0);
    return { totalRemaining: project.totalBudget - totalSpent, subStats, totalSpent, totalBudget: project.totalBudget };
  };

  const getPaymentStatsByMonth = (projectId: string) => {
    const [y, m] = projectId.split('-').map(Number);
    return data.paymentMethods.map(method => {
      const total = data.transactions.filter(t => {
        if (t.paymentMethodId !== method.id) return false;
        const txDate = new Date(t.date);
        let targetMonth = txDate.getMonth() + 1;
        let targetYear = txDate.getFullYear();
        if (method.statementDay && txDate.getDate() > method.statementDay) {
          targetMonth += 1;
          if (targetMonth > 12) { targetMonth = 1; targetYear += 1; }
        }
        return targetYear === y && targetMonth === m;
      }).reduce((sum, t) => sum + t.amount, 0);
      return { ...method, total };
    });
  };

  const updateBudgetAndPropagate = (projectId: string, name: string, emoji: string, budget: number, isSubCategory: boolean, subId?: string) => {
    setData(prev => {
      const [y, m] = projectId.split('-').map(Number);
      let newSubCategories = [...prev.subCategories];
      let newProjects = [...prev.projects];

      if (isSubCategory) {
        if (subId) {
          const originalSub = prev.subCategories.find(s => s.id === subId);
          const oldName = originalSub?.name;

          newSubCategories = prev.subCategories.map(s => {
            const [sy, sm] = s.projectId.split('-').map(Number);
            const isFuture = (sy > y) || (sy === y && sm >= m);
            if (s.id === subId || (isFuture && oldName && s.name === oldName)) {
              return { ...s, name, budget, emoji };
            }
            return s;
          });
        } else {
          const futureMonths = prev.projects.filter(p => {
             const [py, pm] = p.id.split('-').map(Number);
             return (py > y) || (py === y && pm >= m);
          });
          futureMonths.forEach(p => {
            if (!newSubCategories.find(s => s.projectId === p.id && s.name === name)) {
              newSubCategories.push({ id: crypto.randomUUID(), projectId: p.id, name, emoji, budget });
            }
          });
        }
      } else {
        newProjects = prev.projects.map(p => {
          const [py, pm] = p.id.split('-').map(Number);
          if ((py > y) || (py === y && pm >= m)) return { ...p, totalBudget: budget };
          return p;
        });
      }
      return { ...prev, subCategories: newSubCategories, projects: newProjects };
    });
    setActiveSubCategoryModal(null);
    setIsEditProjectModal(null);
  };

  // 刪除支項邏輯 (使用客製化 Modal)
  const deleteSubCategoryAndPropagate = (subId: string, projectId: string) => {
    const sub = data.subCategories.find(s => s.id === subId);
    if (!sub) return;
    
    setConfirmModal({
      isOpen: true,
      title: '刪除支項確認',
      message: `確定要刪除「${sub.name}」支項嗎？\n該月份及未來所有月份的同名支項將一併刪除。此操作不可恢復。`,
      onConfirm: () => {
        const [y, m] = projectId.split('-').map(Number);
        const subName = sub.name;

        setData(prev => {
          const subCategoriesToKill = prev.subCategories.filter(s => {
            const [sy, sm] = s.projectId.split('-').map(Number);
            const isFutureOrCurrent = (sy > y) || (sy === y && sm >= m);
            return s.id === subId || (isFutureOrCurrent && s.name === subName);
          });
          const idsToKill = subCategoriesToKill.map(s => s.id);

          return {
            ...prev,
            subCategories: prev.subCategories.filter(s => !idsToKill.includes(s.id)),
            transactions: prev.transactions.filter(t => !idsToKill.includes(t.subCategoryId))
          };
        });
        setActiveSubCategoryModal(null);
        setConfirmModal(null);
      }
    });
  };

  // 刪除交易紀錄邏輯 (使用客製化 Modal)
  const confirmDeleteTransaction = (t: Transaction) => {
    setConfirmModal({
      isOpen: true,
      title: '刪除紀錄確認',
      message: '確定要刪除此筆交易紀錄嗎？',
      onConfirm: () => {
        setData(prev => ({ ...prev, transactions: prev.transactions.filter(tx => tx.id !== t.id) }));
        setConfirmModal(null);
      }
    });
  };

  const saveTransaction = (nameInput: string, amount: number, subCategoryId: string, paymentMethodId: string, id?: string) => {
    const finalName = nameInput.trim() || new Date().toLocaleDateString('zh-TW');
    setData(prev => id 
      ? { ...prev, transactions: prev.transactions.map(t => t.id === id ? { ...t, name: finalName, amount, subCategoryId, paymentMethodId } : t) } 
      : { ...prev, transactions: [{ id: crypto.randomUUID(), subCategoryId, paymentMethodId, name: finalName, amount, date: Date.now() }, ...prev.transactions] }
    );
    setActiveTransactionModal(null);
  };

  const todayId = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const renderBudgetTab = () => {
    const sortedYears = [...data.yearConfigs].sort((a,b) => b.year - a.year);
    const currentYearNum = new Date().getFullYear();

    return (
      <div className="flex-1 overflow-y-auto px-6 space-y-8 pb-32 hide-scrollbar">
        {sortedYears.map(yc => (
          <div key={yc.year} className="space-y-6">
            <div className="flex items-center justify-between py-4 border-b border-white/5 opacity-50">
              <h2 className="text-sm font-black tech-font tracking-[0.3em]">{yc.year} 年度預算</h2>
              
              <div className="flex items-center gap-4">
                {yc.year !== currentYearNum && (
                  <button 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      deleteYear(yc.year); 
                    }} 
                    className="p-2 text-red-500/80 hover:text-red-500 active:scale-90 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <div 
                  onClick={() => setData(prev => ({ ...prev, yearConfigs: prev.yearConfigs.map(y => y.year === yc.year ? { ...y, isCollapsed: !y.isCollapsed } : y) }))}
                  className="cursor-pointer p-2"
                >
                  {yc.isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </div>
              </div>
            </div>
            {!yc.isCollapsed && data.projects.filter(p => p.year === yc.year).map(p => {
              const { totalSpent, totalBudget } = getProjectStats(p.id);
              const isCurrent = p.id === todayId;
              return (
                <div 
                  key={p.id} 
                  ref={isCurrent ? currentMonthRef : null}
                  onClick={() => setView({ type: 'PROJECT_DETAIL', projectId: p.id })} 
                  className={`glass-panel p-6 rounded-[2rem] flex items-center justify-between active:scale-[0.98] transition-all relative ${isCurrent ? 'ring-2 ring-[var(--accent-glow)] neo-shadow' : 'hover:border-white/20'}`} 
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 bg-black/40 flex items-center justify-center rounded-2xl shadow-inner text-2xl ${isCurrent ? 'animate-pulse accent-text' : ''}`}>
                      {ZODIACS[(p.month - 1) % 12]}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${isCurrent ? 'accent-text accent-glow' : ''}`}>{p.year}年 {p.month}月</h3>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">BUDGET: {formatCurrency(totalBudget)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`tech-font font-black text-xl ${totalSpent <= totalBudget ? 'text-green-400' : 'text-red-400'} ${isCurrent ? 'accent-glow' : ''}`}>{formatCurrency(totalSpent)}</p>
                    <p className="text-[9px] text-slate-500 font-black tracking-widest mt-0.5 opacity-70">[總花費]</p>
                    <div className="flex gap-3 justify-end mt-2">
                      <button onClick={(e) => { e.stopPropagation(); setIsEditProjectModal(p); }} className="p-2 text-slate-500 hover:accent-text transition-colors"><Edit3 size={16} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderPaymentTab = () => {
    const sortedYears = [...data.yearConfigs].sort((a,b) => b.year - a.year);
    const currentYearNum = new Date().getFullYear();

    return (
      <div className="flex-1 overflow-y-auto px-6 space-y-8 pb-32 hide-scrollbar relative">
        <div className="sticky top-0 z-30 pt-4 pb-2 bg-[var(--bg-color)]">
          <button onClick={() => setIsManagingPayments(true)} className="w-full p-4 glass-panel rounded-2xl text-sm accent-text flex items-center justify-center gap-2 font-black shadow-xl border-2 accent-border bg-black/40">
            <Settings size={18} /> 管理支付渠道與結帳日
          </button>
        </div>
        {sortedYears.map(yc => (
          <div key={yc.year} className="space-y-6">
            <div className="flex items-center justify-between py-4 border-b border-white/5 opacity-50">
              <h2 className="text-sm font-black tech-font tracking-[0.3em]">{yc.year} 年度支出渠道</h2>
              
              <div className="flex items-center gap-4">
                {yc.year !== currentYearNum && (
                  <button 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      deleteYear(yc.year); 
                    }} 
                    className="p-2 text-red-500/80 hover:text-red-500 active:scale-90 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <div 
                  onClick={() => setData(prev => ({ ...prev, yearConfigs: prev.yearConfigs.map(y => y.year === yc.year ? { ...y, isCollapsed: !y.isCollapsed } : y) }))}
                  className="cursor-pointer p-2"
                >
                  {yc.isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </div>
              </div>
            </div>
            {!yc.isCollapsed && data.projects.filter(p => p.year === yc.year).map(p => {
              const stats = getPaymentStatsByMonth(p.id);
              const isCurrent = p.id === todayId;
              return (
                <div key={p.id} ref={isCurrent ? paymentMonthRef : null} className={`glass-panel p-6 rounded-[2.5rem] space-y-5 transition-all ${isCurrent ? 'ring-2 ring-[var(--accent-glow)] neo-shadow' : ''}`}>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="font-black text-lg flex items-center gap-2">
                       <span className={isCurrent ? 'accent-text accent-glow' : ''}>{p.month}月</span>
                       <span className="text-[10px] text-slate-500 uppercase tracking-widest">{p.year}年</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {stats.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{s.emoji}</span>
                          <div>
                            <p className="font-bold text-sm">{s.name}</p>
                            {s.statementDay && <p className="text-[9px] text-slate-500">每月 {s.statementDay} 號結帳</p>}
                          </div>
                        </div>
                        <p className={`tech-font font-black ${isCurrent ? 'accent-text' : ''}`}>{formatCurrency(s.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const TransactionModal = ({ subId, tx, onClose }: { subId: string, tx?: Transaction, onClose: () => void }) => {
    const [name, setName] = useState(tx?.name || '');
    const [amount, setAmount] = useState(tx?.amount ? String(tx.amount) : '');
    const [pmId, setPmId] = useState(tx?.paymentMethodId || data.paymentMethods[0].id);

    return (
      <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center p-4 bg-black/90 backdrop-blur-xl">
        <div className="bg-[var(--bg-color)] w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8">
          <h3 className="text-2xl font-black mb-8 accent-text">{tx ? '編輯記錄' : '新增收支'}</h3>
          <div className="space-y-6">
            <input className="w-full bg-black/50 rounded-2xl p-5 border border-white/10 text-white font-bold" placeholder="支出內容" value={name} onChange={e => setName(e.target.value)} />
            <div className="relative">
              <input type="number" className="w-full bg-black/50 rounded-2xl p-5 border border-white/10 tech-font text-3xl font-black" placeholder="金額" value={amount} onChange={e => setAmount(e.target.value)} />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-black">TWD</span>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase px-2">支付方式</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                {data.paymentMethods.map(pm => (
                  <button key={pm.id} onClick={() => setPmId(pm.id)} className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${pmId === pm.id ? 'accent-border accent-bg text-[var(--bg-color)]' : 'border-white/10 bg-black/30 text-slate-400'}`}>
                    <span className="text-lg">{pm.emoji}</span>
                    <span className="text-xs font-bold truncate">{pm.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-4 mt-10">
            <button onClick={onClose} className="flex-1 py-4 text-slate-500 font-black">取消</button>
            <button onClick={() => saveTransaction(name, Number(amount), subId, pmId, tx?.id)} className="flex-[2] py-4 accent-bg text-[var(--bg-color)] rounded-2xl font-black shadow-lg">確認儲存</button>
          </div>
        </div>
      </div>
    );
  };

  const SubCategoryModal = ({ sub, type, projectId, onClose }: { sub?: SubCategory, type: 'ADD' | 'EDIT', projectId: string, onClose: () => void }) => {
    const [name, setName] = useState(sub?.name || '');
    const [emoji, setEmoji] = useState(sub?.emoji || EMOJIS[0]);
    const [budget, setBudget] = useState(sub?.budget ? String(sub.budget) : '');

    return (
      <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center p-4 bg-black/90 backdrop-blur-xl">
        <div className="bg-[var(--bg-color)] w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-start mb-8">
            <h3 className="text-2xl font-black accent-text">{sub ? '編輯支項' : '新增支項'}</h3>
            {sub && (
              <button 
                type="button"
                onClick={() => deleteSubCategoryAndPropagate(sub.id, projectId)}
                className="p-3 text-red-500 bg-red-500/10 rounded-2xl hover:bg-red-500/20 active:scale-90 transition-all"
              >
                <Trash2 size={22} />
              </button>
            )}
          </div>
          <div className="space-y-6">
            <div className="flex gap-4">
              <button className="bg-black/50 w-20 h-20 rounded-3xl text-4xl border border-white/5 flex items-center justify-center shrink-0">{emoji}</button>
              <div className="flex-1 overflow-hidden">
                 <input className="w-full bg-black/50 rounded-2xl p-5 border border-white/10 text-white text-lg font-bold" placeholder="支項名稱" value={name} onChange={e => setName(e.target.value)} />
              </div>
            </div>
            <div className="relative">
              <input type="number" className="w-full bg-black/50 rounded-2xl p-5 border border-white/10 tech-font text-2xl font-black" placeholder="預算金額" value={budget} onChange={e => setBudget(e.target.value)} />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-black">TWD</span>
            </div>
            <div className="grid grid-cols-6 gap-3 max-h-40 overflow-y-auto p-4 bg-black/40 rounded-[2rem] border border-white/5 no-scrollbar">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} className={`text-2xl p-2 rounded-xl transition-all ${emoji === e ? 'accent-bg' : 'hover:bg-white/5'}`}>{e}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-4 mt-8">
            <button onClick={onClose} className="flex-1 py-5 text-slate-500 font-black">取消</button>
            <button onClick={() => updateBudgetAndPropagate(projectId, name, emoji, Number(budget), true, sub?.id)} className="flex-[2] py-5 accent-bg text-[var(--bg-color)] rounded-2xl font-black">確認同步</button>
          </div>
        </div>
      </div>
    );
  };

  const PaymentMethodModal = ({ method, onClose }: { method?: PaymentMethod, onClose: () => void }) => {
    const [name, setName] = useState(method?.name || '');
    const [emoji, setEmoji] = useState(method?.emoji || PAYMENT_EMOJIS[0]);
    const [sDay, setSDay] = useState(method?.statementDay ? String(method.statementDay) : '');

    return (
      <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center p-4 bg-black/95 backdrop-blur-2xl">
        <div className="bg-[var(--bg-color)] w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
          <h3 className="text-xl font-black mb-8 accent-text">渠道細節設定</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <button className="bg-black/50 w-20 h-20 rounded-3xl text-4xl border border-white/10 flex items-center justify-center shrink-0">{emoji}</button>
              <div className="flex-1 overflow-hidden">
                <input className="w-full bg-black/50 rounded-2xl p-5 border border-white/10 text-white font-bold" placeholder="渠道名稱" value={name} onChange={e => setName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase px-2">結帳日</label>
              <div className="relative">
                <select className="w-full bg-black/50 rounded-2xl p-5 border border-white/10 text-white font-black appearance-none focus:accent-border transition-all" value={sDay} onChange={e => setSDay(e.target.value)}>
                  <option value="" className="bg-slate-900">不設定 (無結帳日)</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (<option key={day} value={day} className="bg-slate-900">{day} 號</option>))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><ChevronDown size={18} /></div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 max-h-40 overflow-y-auto p-4 bg-black/40 rounded-[2rem] border border-white/5 no-scrollbar">
              {PAYMENT_EMOJIS.map(e => (<button key={e} onClick={() => setEmoji(e)} className={`text-2xl p-2 rounded-xl transition-all ${emoji === e ? 'accent-bg' : 'hover:bg-white/5'}`}>{e}</button>))}
            </div>
          </div>
          <div className="flex gap-4 mt-8">
            <button onClick={onClose} className="flex-1 py-5 text-slate-500 font-black">取消</button>
            <button onClick={() => { setData(prev => method ? { ...prev, paymentMethods: prev.paymentMethods.map(m => m.id === method.id ? { ...m, name, emoji, statementDay: sDay ? Number(sDay) : undefined } : m) } : { ...prev, paymentMethods: [...prev.paymentMethods, { id: crypto.randomUUID(), name, emoji, statementDay: sDay ? Number(sDay) : undefined }] }); onClose(); }} className="flex-[2] py-5 accent-bg text-[var(--bg-color)] rounded-2xl font-black">儲存渠道</button>
          </div>
        </div>
      </div>
    );
  };

  const PaymentManager = () => (
    <div className="fixed inset-0 z-[110] bg-[var(--bg-color)] animate-in">
      <header className="px-6 pt-12 pb-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsManagingPayments(false)} className="p-2 glass-panel rounded-xl"><ChevronLeft /></button>
          <h2 className="text-xl font-black">支付渠道管理</h2>
        </div>
        <button onClick={() => setActivePaymentModal({ type: 'ADD' })} className="p-3 accent-bg text-[var(--bg-color)] rounded-xl font-black"><Plus size={20} /></button>
      </header>
      <div className="p-6 space-y-4 overflow-y-auto h-[calc(100%-120px)] hide-scrollbar">
        {data.paymentMethods.map(pm => (
          <div key={pm.id} className="glass-panel p-5 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{pm.emoji}</span>
              <div>
                <p className="font-bold text-lg">{pm.name}</p>
                <p className="text-xs text-slate-500">結帳日: {pm.statementDay ? `${pm.statementDay} 號` : '未設定'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActivePaymentModal({ type: 'EDIT', method: pm })} className="p-3 bg-white/5 rounded-2xl text-slate-400"><Edit3 size={18} /></button>
              {pm.id !== 'cash' && (
                <button 
                  onClick={() => { 
                    setConfirmModal({
                      isOpen: true,
                      title: '刪除渠道確認',
                      message: `確定要刪除「${pm.name}」支付渠道嗎？`,
                      onConfirm: () => {
                        setData(prev => ({ ...prev, paymentMethods: prev.paymentMethods.filter(m => m.id !== pm.id) }));
                        setConfirmModal(null);
                      }
                    });
                  }} 
                  className="p-3 bg-red-500/5 text-red-400"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto h-full relative shadow-2xl overflow-hidden">
      <div className="relative z-10 h-full flex flex-col">
        {view.type === 'PROJECT_LIST' && (
          <>
            <header className="px-6 pt-12 pb-6 shrink-0 space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black tech-font tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-[var(--accent-color)] accent-glow uppercase">預算管理</h1>
                <button onClick={() => setView({ type: 'THEME_SETTINGS' })} className="p-3 glass-panel rounded-2xl accent-text active:scale-90 transition-all neo-shadow"><Palette size={22} /></button>
              </div>
              <div className="bg-black/40 p-1.5 rounded-2xl flex border border-white/5">
                <button onClick={() => setView({ ...view, tab: 'BUDGET' })} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${view.tab === 'BUDGET' ? 'accent-bg text-[var(--bg-color)] font-black' : 'text-slate-500 font-bold'}`}><Calendar size={18} /> 預算月份</button>
                <button onClick={() => setView({ ...view, tab: 'PAYMENT' })} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${view.tab === 'PAYMENT' ? 'accent-bg text-[var(--bg-color)] font-black' : 'text-slate-500 font-bold'}`}><CreditCard size={18} /> 支付渠道</button>
              </div>
            </header>
            {view.tab === 'BUDGET' ? renderBudgetTab() : renderPaymentTab()}
            {view.tab === 'BUDGET' && (<button onClick={endCurrentYear} className="fixed bottom-10 left-8 px-6 py-4 accent-bg text-[var(--bg-color)] rounded-2xl flex items-center gap-2 font-black tech-font text-xs active:scale-90 transition-all z-50 shadow-2xl">結束今年</button>)}
          </>
        )}

        {view.type === 'PROJECT_DETAIL' && (
          <div className="flex flex-col h-full animate-in">
            <header className="sticky top-0 z-40 glass-panel border-b border-white/5 px-6 pt-12 pb-5 flex items-center gap-4 shrink-0">
              <button onClick={() => setView({ type: 'PROJECT_LIST', tab: 'BUDGET' })} className="p-2 glass-panel rounded-xl"><ChevronLeft /></button>
              <h2 className="text-xl font-black">明細列表</h2>
            </header>
            {(() => {
              const { totalRemaining, totalBudget } = getProjectStats(view.projectId);
              return (
                <div className="shrink-0 p-8 flex flex-col items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">剩餘可用預算</span>
                  <div className={`text-5xl font-black tech-font ${totalRemaining >= 0 ? 'text-green-400' : 'text-red-400'} accent-glow`}>{formatCurrency(totalRemaining)}</div>
                  <div className="mt-4 px-5 py-1.5 bg-black/50 rounded-full border border-white/5 shadow-inner"><p className="text-slate-400 text-[10px] font-bold tracking-widest">總預算額度: {formatCurrency(totalBudget)}</p></div>
                </div>
              );
            })()}
            <div className="flex-1 overflow-y-auto px-6 space-y-4 pt-2 pb-24 hide-scrollbar">
              {getProjectStats(view.projectId).subStats.map(sub => (
                <div key={sub.id} onClick={() => setView({ type: 'TRANSACTION_HISTORY', subCategoryId: sub.id, projectId: view.projectId })} className="glass-panel p-5 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-all overflow-hidden">
                   <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black/30 rounded-2xl flex items-center justify-center text-2xl">{sub.emoji}</div>
                    <div className="overflow-hidden"><p className="font-bold text-lg truncate">{sub.name}</p><p className="text-[10px] text-slate-500">已用: {formatCurrency(sub.spent)}</p></div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div><p className={`font-black text-lg ${sub.remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(sub.remaining)}</p><p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">剩餘</p></div>
                    {!(sub as any).isFreeMoney && (<button onClick={(e) => { e.stopPropagation(); setActiveSubCategoryModal({ type: 'EDIT', sub, projectId: view.projectId }); }} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:accent-text"><Settings2 size={16} /></button>)}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveSubCategoryModal({ type: 'ADD', projectId: view.projectId })} className="fixed bottom-10 right-8 w-16 h-16 accent-bg rounded-2xl flex items-center justify-center shadow-2xl neo-shadow z-50 active:scale-90 transition-all"><Plus color={currentTheme.bgColor} size={36} strokeWidth={3} /></button>
          </div>
        )}

        {view.type === 'TRANSACTION_HISTORY' && (
           <div className="flex flex-col h-full animate-in">
            <header className="sticky top-0 z-40 glass-panel border-b border-white/5 px-6 pt-12 pb-5 flex items-center gap-4 shrink-0">
              <button onClick={() => setView({ type: 'PROJECT_DETAIL', projectId: view.projectId })} className="p-2 glass-panel rounded-xl"><ChevronLeft /></button>
              <h2 className="text-xl font-bold">交易記錄</h2>
            </header>
            <div className="flex-1 overflow-y-auto px-6 space-y-4 pt-6 pb-24 hide-scrollbar">
              {data.transactions.filter(t => t.subCategoryId === view.subCategoryId).length === 0 && (<div className="text-center py-20 opacity-30 font-black tech-font">NO TRANSACTIONS</div>)}
              {data.transactions.filter(t => t.subCategoryId === view.subCategoryId).map(t => (
                <div key={t.id} className="glass-panel p-5 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-all">
                  <div className="flex-1 overflow-hidden" onClick={() => setActiveTransactionModal({ type: 'EDIT', subId: view.subCategoryId, tx: t })}>
                    <p className="font-bold truncate">{t.name}</p>
                    <div className="flex items-center gap-2 mt-1"><span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full text-slate-400 font-bold">{data.paymentMethods.find(p=>p.id===t.paymentMethodId)?.emoji} {data.paymentMethods.find(p=>p.id===t.paymentMethodId)?.name}</span></div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <p className="font-black text-red-400 tech-font">{formatCurrency(t.amount)}</p>
                    <button onClick={() => confirmDeleteTransaction(t)} className="p-2 text-red-500/50 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveTransactionModal({ type: 'ADD', subId: view.subCategoryId })} className="fixed bottom-10 right-8 w-16 h-16 accent-bg rounded-2xl flex items-center justify-center shadow-2xl neo-shadow z-50 active:scale-90 transition-all"><Plus color={currentTheme.bgColor} size={36} strokeWidth={3} /></button>
           </div>
        )}

        {view.type === 'THEME_SETTINGS' && (
          <div className="flex flex-col h-full animate-in">
            <header className="px-6 pt-12 pb-6 flex items-center gap-4 shrink-0">
              <button onClick={() => setView({ type: 'PROJECT_LIST', tab: 'BUDGET' })} className="p-3 glass-panel rounded-2xl"><ChevronLeft /></button>
              <h2 className="text-2xl font-black tech-font">視覺主題</h2>
            </header>
            <div className="flex-1 overflow-y-auto px-6 grid grid-cols-2 gap-5 pb-24 hide-scrollbar">
              {THEMES.map(t => (<button key={t.id} onClick={() => setCurrentTheme(t)} className={`p-6 rounded-[2rem] glass-panel border-2 ${currentTheme.id === t.id ? 'accent-border ring-4 ring-[var(--accent-glow)]' : 'border-white/5 opacity-60'}`} style={{ background: t.bgImage }}><span className="text-[10px] font-black uppercase tracking-widest">{t.name}</span></button>))}
            </div>
          </div>
        )}
      </div>

      {isManagingPayments && <PaymentManager />}
      {activePaymentModal && <PaymentMethodModal method={activePaymentModal.method} onClose={() => setActivePaymentModal(null)} />}
      {activeSubCategoryModal && <SubCategoryModal type={activeSubCategoryModal.type} sub={activeSubCategoryModal.sub} projectId={activeSubCategoryModal.projectId} onClose={() => setActiveSubCategoryModal(null)} />}
      {activeTransactionModal && <TransactionModal subId={activeTransactionModal.subId} tx={activeTransactionModal.tx} onClose={() => setActiveTransactionModal(null)} />}
      
      {isEditProjectModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="bg-[var(--bg-color)] w-full max-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
            <h3 className="text-2xl font-black mb-8 accent-text">月份總預算設定</h3>
            <div className="space-y-6">
              <div className="relative">
                <input type="number" className="w-full bg-black/50 rounded-2xl p-5 border border-white/10 tech-font text-3xl font-black" value={isEditProjectModal.totalBudget} onChange={e => setIsEditProjectModal({...isEditProjectModal, totalBudget: Number(e.target.value)})} />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-black">TWD</span>
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsEditProjectModal(null)} className="flex-1 py-5 text-slate-500 font-black">取消</button>
              <button onClick={() => updateBudgetAndPropagate(isEditProjectModal.id, '', '', isEditProjectModal.totalBudget, false)} className="flex-[2] py-5 accent-bg text-[var(--bg-color)] rounded-2xl font-black">確認同步</button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in">
          <div className="bg-[var(--bg-color)] w-full max-w-xs rounded-[2rem] p-6 border border-white/10 shadow-2xl">
            <h3 className="text-xl font-black mb-4 accent-text text-center">{confirmModal.title}</h3>
            <p className="text-slate-300 mb-8 text-center text-sm leading-relaxed whitespace-pre-wrap">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 text-slate-500 font-bold bg-white/5 rounded-xl">取消</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20">確認刪除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
