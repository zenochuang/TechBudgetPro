
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, 
  ChevronLeft, 
  Trash2, 
  Edit3, 
  BarChart2, 
  List, 
  Settings2,
  Calendar,
  Wallet,
  Palette,
  Check
} from 'lucide-react';
import { Project, SubCategory, Transaction, ViewState, EMOJIS, Theme } from './types';
import { COLORS, THEMES, formatCurrency } from './constants';
import { loadData, saveData } from './utils/storage';

const App = () => {
  const [data, setData] = useState(loadData());
  const [view, setView] = useState<ViewState>({ type: 'PROJECT_LIST' });
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [activeSubCategoryModal, setActiveSubCategoryModal] = useState<{ type: 'ADD' | 'EDIT', sub?: SubCategory } | null>(null);
  const [activeTransactionModal, setActiveTransactionModal] = useState<{ type: 'ADD' | 'EDIT', subId: string, tx?: Transaction } | null>(null);
  
  const [currentTheme, setCurrentTheme] = useState<Theme>(
    THEMES.find(t => t.id === (data as any).themeId) || THEMES[0]
  );

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
    
    // 主題圖騰邏輯：一半幾何，一半漸層
    let pattern = 'none';
    
    switch (currentTheme.id) {
      case 'cyber': // 方形
        pattern = `linear-gradient(rgba(0, 242, 255, 0.05) 1px, transparent 1px), 
                   linear-gradient(90deg, rgba(0, 242, 255, 0.05) 1px, transparent 1px)`;
        root.style.setProperty('--pattern-size', '40px 40px');
        break;
      case 'emerald': // 三角形 (利用線性漸層模擬)
        pattern = `linear-gradient(45deg, rgba(16, 185, 129, 0.03) 25%, transparent 25%), 
                   linear-gradient(-45deg, rgba(16, 185, 129, 0.03) 25%, transparent 25%)`;
        root.style.setProperty('--pattern-size', '60px 60px');
        break;
      case 'amethyst': // 圓形
        pattern = `radial-gradient(circle at 10px 10px, rgba(217, 70, 239, 0.08) 2px, transparent 0)`;
        root.style.setProperty('--pattern-size', '30px 30px');
        break;
      case 'carbon': // 複和方形
        pattern = `linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.02) 75%, rgba(255,255,255,0.02))`;
        root.style.setProperty('--pattern-size', '20px 20px');
        break;
      default: // 其餘純漸層
        pattern = 'none';
        break;
    }
    
    root.style.setProperty('--bg-pattern', pattern);
  }, [currentTheme]);

  const getProjectStats = (projectId: string) => {
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return { totalRemaining: 0, subStats: [], totalBudget: 0, totalSpent: 0 };

    const subs = data.subCategories.filter(s => s.projectId === projectId);
    const allocatedBudgetSum = subs.reduce((sum, s) => sum + s.budget, 0);
    const freeMoneyBudget = project.totalBudget - allocatedBudgetSum;

    const regularSubStats = subs.map(sub => {
      const spent = data.transactions
        .filter(t => t.subCategoryId === sub.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...sub, spent, remaining: sub.budget - spent };
    });

    const freeMoneyId = `free-money-${projectId}`;
    const freeMoneySpent = data.transactions
      .filter(t => t.subCategoryId === freeMoneyId)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const freeMoneyStat = {
      id: freeMoneyId,
      projectId,
      name: '閒錢',
      emoji: '✨',
      budget: freeMoneyBudget,
      spent: freeMoneySpent,
      remaining: freeMoneyBudget - freeMoneySpent,
      isFreeMoney: true
    };

    const subStats = [freeMoneyStat, ...regularSubStats];
    const totalSpent = data.transactions
      .filter(t => subStats.some(s => s.id === t.subCategoryId))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalRemaining = project.totalBudget - totalSpent;

    return { totalRemaining, subStats, totalSpent, totalBudget: project.totalBudget };
  };

  const addProject = (name: string, emoji: string, totalBudget: number) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      emoji,
      totalBudget,
      createdAt: Date.now()
    };
    setData(prev => ({ ...prev, projects: [...prev.projects, newProject] }));
    setIsAddingProject(false);
    setView({ type: 'PROJECT_DETAIL', projectId: newProject.id, tab: 'LIST' });
  };

  const updateProject = (id: string, name: string, emoji: string, totalBudget: number) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, name, emoji, totalBudget } : p)
    }));
    setEditingProject(null);
  };

  const deleteProject = (id: string) => {
    if (!confirm('確定要刪除此項目及所有相關資料嗎？')) return;
    setData(prev => {
      const subIds = prev.subCategories.filter(s => s.projectId === id).map(s => s.id);
      const freeMoneyId = `free-money-${id}`;
      return {
        ...prev,
        projects: prev.projects.filter(p => p.id !== id),
        subCategories: prev.subCategories.filter(s => s.projectId !== id),
        transactions: prev.transactions.filter(t => !subIds.includes(t.subCategoryId) && t.subCategoryId !== freeMoneyId)
      };
    });
    setView({ type: 'PROJECT_LIST' });
  };

  const saveSubCategory = (name: string, emoji: string, budget: number, projectId: string, id?: string) => {
    setData(prev => {
      if (id) {
        return {
          ...prev,
          subCategories: prev.subCategories.map(s => s.id === id ? { ...s, name, emoji, budget } : s)
        };
      } else {
        const newSub: SubCategory = { id: crypto.randomUUID(), projectId, name, emoji, budget };
        return { ...prev, subCategories: [...prev.subCategories, newSub] };
      }
    });
    setActiveSubCategoryModal(null);
  };

  const deleteSubCategory = (id: string) => {
    if (!confirm('確定要刪除此支項及其所有記錄嗎？')) return;
    setData(prev => ({
      ...prev,
      subCategories: prev.subCategories.filter(s => s.id !== id),
      transactions: prev.transactions.filter(t => t.subCategoryId !== id)
    }));
    setActiveSubCategoryModal(null);
  };

  const saveTransaction = (nameInput: string, amount: number, subCategoryId: string, id?: string) => {
    const finalName = nameInput.trim() || new Date().toLocaleDateString('zh-TW');
    setData(prev => {
      if (id) {
        return {
          ...prev,
          transactions: prev.transactions.map(t => t.id === id ? { ...t, name: finalName, amount, subCategoryId } : t)
        };
      } else {
        const newTx: Transaction = { id: crypto.randomUUID(), subCategoryId, name: finalName, amount, date: Date.now() };
        return { ...prev, transactions: [newTx, ...prev.transactions] };
      }
    });
    setActiveTransactionModal(null);
  };

  const deleteTransaction = (id: string) => {
    if (!confirm('確定要刪除此筆記錄嗎？')) return;
    setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  };

  const renderProjectList = () => (
    <div className="flex flex-col h-full animate-in">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between shrink-0">
        <h1 className="text-3xl font-black tech-font tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-[var(--accent-color)] accent-glow">
          項目總覽
        </h1>
        <button 
          onClick={() => setView({ type: 'THEME_SETTINGS' })}
          className="p-3 glass-panel rounded-2xl accent-text active:scale-90 transition-all neo-shadow"
        >
          <Palette size={22} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 space-y-5 pb-24 hide-scrollbar">
        {data.projects.length === 0 && (
          <div className="text-center py-24 text-slate-500 glass-panel rounded-3xl border-dashed">
            <Wallet className="mx-auto mb-4 opacity-20" size={64} />
            <p className="font-medium">歡迎使用，建立第一個預算項目</p>
          </div>
        )}
        {data.projects.sort((a,b) => b.createdAt - a.createdAt).map(p => {
          const { totalRemaining } = getProjectStats(p.id);
          return (
            <div 
              key={p.id}
              onClick={() => setView({ type: 'PROJECT_DETAIL', projectId: p.id, tab: 'LIST' })}
              className="glass-panel p-6 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-all group border-l-4"
              style={{ borderLeftColor: currentTheme.accentColor }}
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-black/40 flex items-center justify-center rounded-2xl shadow-inner text-3xl">
                  {p.emoji}
                </div>
                <div>
                  <h3 className="text-xl font-bold truncate max-w-[120px]">{p.name}</h3>
                  <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`tech-font font-black text-xl accent-glow ${totalRemaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(totalRemaining)}
                </p>
                <div className="flex gap-3 justify-end mt-3">
                  <button onClick={(e) => { e.stopPropagation(); setEditingProject(p); }} className="p-1 text-slate-400 hover:accent-text transition-colors"><Edit3 size={18} /></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="p-1 text-red-400/30 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <button 
        onClick={() => setIsAddingProject(true)}
        className="fixed bottom-10 right-8 w-16 h-16 accent-bg rounded-2xl flex items-center justify-center shadow-2xl neo-shadow active:scale-90 transition-all z-50"
      >
        <Plus color={currentTheme.bgColor} size={36} strokeWidth={3} />
      </button>
    </div>
  );

  const renderProjectDetail = (projectId: string, tab: 'LIST' | 'CHART') => {
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return null;
    const { totalRemaining, subStats, totalBudget } = getProjectStats(projectId);
    const maxValue = Math.max(1, ...subStats.map(s => Math.max(s.budget, s.spent)));

    return (
      <div className="flex flex-col h-full animate-in">
        <header className="sticky top-0 z-40 glass-panel border-b border-white/5 px-6 pt-12 pb-5 flex items-center gap-4 shrink-0">
          <button onClick={() => setView({ type: 'PROJECT_LIST' })} className="p-2 glass-panel rounded-xl"><ChevronLeft /></button>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{project.emoji}</span>
            <h2 className="text-xl font-bold truncate max-w-[200px]">{project.name}</h2>
          </div>
        </header>

        <div className="shrink-0 p-8 flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">剩餘預算</span>
          <div className={`text-5xl font-black tech-font ${totalRemaining >= 0 ? 'text-green-400' : 'text-red-400'} accent-glow`}>
            {formatCurrency(totalRemaining)}
          </div>
          <div className="mt-4 px-5 py-1.5 bg-black/50 rounded-full border border-white/5 shadow-inner">
            <p className="text-slate-400 text-[10px] font-bold tracking-widest">TOTAL: {formatCurrency(totalBudget)}</p>
          </div>
        </div>

        <div className="shrink-0 px-6 mb-6">
          <div className="bg-black/40 rounded-2xl p-1.5 flex w-full border border-white/5 backdrop-blur-xl">
            <button onClick={() => setView({ ...view, tab: 'LIST' } as ViewState)} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${tab === 'LIST' ? 'accent-bg text-[var(--bg-color)] font-black shadow-xl' : 'text-slate-500 font-bold'}`}>
              <List size={20} /> 清單
            </button>
            <button onClick={() => setView({ ...view, tab: 'CHART' } as ViewState)} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${tab === 'CHART' ? 'accent-bg text-[var(--bg-color)] font-black shadow-xl' : 'text-slate-500 font-bold'}`}>
              <BarChart2 size={20} /> 分析
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-24 hide-scrollbar">
          {tab === 'LIST' ? (
            subStats.map(sub => (
              <div 
                key={sub.id} 
                onClick={() => setView({ type: 'TRANSACTION_HISTORY', subCategoryId: sub.id, projectId })}
                className="glass-panel p-5 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-all group overflow-hidden"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black/30 rounded-2xl flex items-center justify-center text-2xl group-active:scale-110 transition-transform">
                    {sub.emoji}
                  </div>
                  <div>
                    <p className="font-bold text-lg flex items-center gap-2">
                      {sub.name}
                      {(sub as any).isFreeMoney && <span className="text-[9px] bg-[var(--accent-color)] text-[var(--bg-color)] px-1.5 py-0.5 rounded-md font-black">AUTO</span>}
                    </p>
                    <div className="w-24 h-1.5 bg-black/40 rounded-full mt-1 overflow-hidden border border-white/5">
                      <div 
                        className={`h-full transition-all duration-1000 ${sub.spent > sub.budget ? 'bg-red-500' : 'bg-[var(--accent-color)]'}`} 
                        style={{ width: `${Math.min(100, (sub.spent / (sub.budget || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`font-black text-lg ${sub.remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(sub.remaining)}</p>
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">REMAINING</p>
                  </div>
                  {!(sub as any).isFreeMoney && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveSubCategoryModal({ type: 'EDIT', sub }); }}
                      className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:accent-text active:scale-90 transition-all"
                    >
                      <Settings2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="animate-in slide-in-from-bottom-4">
               <div className="glass-panel rounded-[2.5rem] p-8 min-h-[300px] flex items-end justify-around gap-2 relative overflow-hidden">
                  <div className="absolute top-6 left-8">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">支出佔比分析</h3>
                  </div>
                  {subStats.map(sub => {
                    const spentHeight = (sub.spent / maxValue) * 100;
                    return (
                      <div key={sub.id} className="flex flex-col items-center group w-10 shrink-0">
                        <div className="relative flex flex-col items-center justify-end h-40 w-full">
                          <div 
                            className={`w-full rounded-2xl ${sub.spent > sub.budget ? 'bg-red-500' : 'accent-bg'} shadow-2xl transition-all duration-1000 ease-out`} 
                            style={{ height: `${Math.max(4, spentHeight)}%` }}
                          >
                          </div>
                        </div>
                        <div className="mt-4 text-center">
                          <span className="text-xl block mb-1">{sub.emoji}</span>
                          <span className="text-[8px] text-slate-400 font-black truncate w-10 block uppercase tracking-tighter">{sub.name}</span>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => setActiveSubCategoryModal({ type: 'ADD' })}
          className="fixed bottom-10 right-8 w-16 h-16 accent-bg rounded-2xl flex items-center justify-center shadow-2xl neo-shadow active:scale-90 transition-all z-50"
        >
          <Plus color={currentTheme.bgColor} size={36} strokeWidth={3} />
        </button>
      </div>
    );
  };

  const renderHistory = (subCategoryId: string, projectId: string) => {
    const { subStats } = getProjectStats(projectId);
    const sub = subStats.find(s => s.id === subCategoryId);
    const txs = data.transactions.filter(t => t.subCategoryId === subCategoryId);
    if (!sub) return null;

    return (
      <div className="flex flex-col h-full animate-in">
        <header className="sticky top-0 z-40 glass-panel border-b border-white/5 px-6 pt-12 pb-5 flex items-center gap-4 shrink-0">
          <button onClick={() => setView({ type: 'PROJECT_DETAIL', projectId, tab: 'LIST' })} className="p-2 glass-panel rounded-xl"><ChevronLeft /></button>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{sub.emoji}</span>
            <h2 className="text-xl font-bold">{sub.name} 記錄</h2>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-24 hide-scrollbar">
          {txs.length === 0 && (
            <div className="text-center py-32 glass-panel rounded-[2rem]">
              <Calendar className="mx-auto mb-4 opacity-10" size={64} />
              <p className="text-slate-500 font-bold">尚無任何支出資料</p>
            </div>
          )}
          {txs.map(t => (
            <div key={t.id} className="glass-panel p-5 rounded-3xl flex items-center justify-between group active:scale-[0.98] transition-all">
              <div className="flex-1" onClick={() => setActiveTransactionModal({ type: 'EDIT', subId: subCategoryId, tx: t })}>
                <p className="font-bold text-lg flex items-center gap-2">
                  {t.name} 
                  <Edit3 size={14} className="text-slate-600 group-hover:accent-text" />
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">{new Date(t.date).toLocaleString('zh-TW', { hour12: false })}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className={`font-black tech-font text-lg ${t.amount < 0 ? 'text-green-400' : 'text-red-400'}`}>
                   {formatCurrency(t.amount)}
                </p>
                <button onClick={() => deleteTransaction(t.id)} className="p-3 bg-red-500/5 text-red-400/50 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => setActiveTransactionModal({ type: 'ADD', subId: subCategoryId })}
          className="fixed bottom-10 right-8 w-16 h-16 accent-bg rounded-2xl flex items-center justify-center shadow-2xl neo-shadow active:scale-90 transition-all z-50"
        >
          <Plus color={currentTheme.bgColor} size={36} strokeWidth={3} />
        </button>
      </div>
    );
  };

  const SubCategoryFormModal = ({ sub, type, onClose, projectId }: { sub?: SubCategory, type: 'ADD' | 'EDIT', onClose: () => void, projectId: string }) => {
    const [name, setName] = useState(sub?.name || '');
    const [emoji, setEmoji] = useState(sub?.emoji || EMOJIS[0]);
    const [budget, setBudget] = useState(sub?.budget.toString() || '');

    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/80 backdrop-blur-xl">
        <div className="bg-[var(--bg-color)] w-full max-w-md rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black accent-text tracking-tight">{type === 'ADD' ? '新增預算支項' : '編輯支項設定'}</h3>
            {type === 'EDIT' && (
               <button onClick={() => deleteSubCategory(sub!.id)} className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 rounded-2xl active:scale-90 transition-transform"><Trash2 size={24}/></button>
            )}
          </div>
          <div className="space-y-6">
            <div className="flex gap-4">
              <button className="bg-black/50 w-20 h-20 rounded-3xl text-4xl border border-white/5 flex items-center justify-center shrink-0 shadow-inner">{emoji}</button>
              <div className="flex-1 space-y-4">
                <input 
                  className="w-full bg-black/50 rounded-2xl p-5 border border-white/5 focus:accent-border text-white text-lg font-bold placeholder:text-slate-700" 
                  placeholder="支項名稱 (例: 伙食)" value={name} onChange={e => setName(e.target.value)} 
                />
              </div>
            </div>
            <div className="relative">
              <input 
                type="number" inputMode="decimal" className="w-full bg-black/50 rounded-2xl p-5 tech-font border border-white/5 focus:accent-border text-white text-2xl font-black" 
                placeholder="預算金額" value={budget} onChange={e => setBudget(e.target.value)} 
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 font-black">TWD</span>
            </div>
            <div className="grid grid-cols-6 gap-3 max-h-48 overflow-y-auto p-4 bg-black/40 rounded-[2rem] border border-white/5 no-scrollbar">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} className={`text-2xl p-2 rounded-xl transition-all ${emoji === e ? 'accent-bg scale-110 shadow-lg' : 'hover:bg-white/5 active:scale-90'}`}>{e}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-4 mt-10">
            <button onClick={onClose} className="flex-1 py-5 text-slate-500 font-black tracking-widest uppercase active:scale-95 transition-all">Cancel</button>
            <button 
              disabled={!name || !budget}
              onClick={() => {
                saveSubCategory(name, emoji, Number(budget), projectId, sub?.id);
                onClose();
              }}
              className="flex-[2] py-5 accent-bg text-[var(--bg-color)] rounded-2xl font-black shadow-2xl disabled:opacity-20 active:scale-95 transition-all"
            >
              SAVE DATA
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TransactionFormModal = ({ subId, tx, type, onClose }: { subId: string, tx?: Transaction, type: 'ADD' | 'EDIT', onClose: () => void }) => {
    const [name, setName] = useState(tx?.name || '');
    const [amount, setAmount] = useState(tx?.amount.toString() || '');

    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/80 backdrop-blur-xl">
        <div className="bg-[var(--bg-color)] w-full max-w-md rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8">
          <h3 className="text-2xl font-black mb-8 accent-text tracking-tight">{type === 'ADD' ? '新增收支記錄' : '修正支出資訊'}</h3>
          <div className="space-y-6">
            <input className="w-full bg-black/50 rounded-2xl p-5 border border-white/5 focus:accent-border text-white text-lg font-bold" placeholder="消費描述 (預設日期)" value={name} onChange={e => setName(e.target.value)} />
            <div className="relative">
              <input type="number" inputMode="decimal" className="w-full bg-black/50 rounded-2xl p-5 tech-font border border-white/5 focus:accent-border text-white text-3xl font-black" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col items-end">
                <span className="text-[10px] text-slate-500 font-black uppercase">Amount</span>
                <span className="text-slate-400 font-black">TWD</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-bold px-2">提示：輸入正數為支出，負數為收入 (例如預算回補)</p>
          </div>
          <div className="flex gap-4 mt-10">
            <button onClick={onClose} className="flex-1 py-5 text-slate-500 font-black tracking-widest uppercase">Cancel</button>
            <button 
              disabled={!amount}
              onClick={() => {
                saveTransaction(name, Number(amount), subId, tx?.id);
                onClose();
              }}
              className="flex-[2] py-5 accent-bg text-[var(--bg-color)] rounded-2xl font-black shadow-2xl active:scale-95 transition-all"
            >
              CONFIRM
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ProjectFormModal = ({ project, onClose }: { project?: Project, onClose: () => void }) => {
    const [name, setName] = useState(project?.name || '');
    const [emoji, setEmoji] = useState(project?.emoji || EMOJIS[0]);
    const [budget, setBudget] = useState(project ? project.totalBudget.toString() : '');

    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/80 backdrop-blur-xl">
        <div className="bg-[var(--bg-color)] w-full max-w-md rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8">
          <h3 className="text-2xl font-black mb-8 flex items-center gap-3 accent-text tracking-tight"><Wallet size={28} /> {project ? '調整項目核心' : '啟動新預算項目'}</h3>
          <div className="space-y-6">
            <input className="w-full bg-black/50 border border-white/5 rounded-2xl p-5 text-white text-lg font-bold placeholder:text-slate-700 focus:accent-border" placeholder="項目標題" value={name} onChange={e => setName(e.target.value)} />
            <div className="relative">
              <input type="number" inputMode="decimal" className="w-full bg-black/50 border border-white/5 rounded-2xl p-5 tech-font focus:accent-border text-white text-3xl font-black" placeholder="0" value={budget} onChange={e => setBudget(e.target.value)} />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 font-black">TWD</span>
            </div>
            <div className="grid grid-cols-6 gap-3 max-h-40 overflow-y-auto p-4 bg-black/40 rounded-[2rem] border border-white/5 no-scrollbar">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} className={`text-3xl p-2 rounded-xl transition-all ${emoji === e ? 'accent-bg scale-110 shadow-2xl' : 'hover:bg-white/5 active:scale-90'}`}>{e}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-4 mt-10">
            <button onClick={onClose} className="flex-1 py-5 text-slate-500 font-black tracking-widest uppercase">Cancel</button>
            <button disabled={!name || !budget} onClick={() => { project ? updateProject(project.id, name, emoji, Number(budget)) : addProject(name, emoji, Number(budget)); onClose(); }} className="flex-[2] py-5 accent-bg text-[var(--bg-color)] rounded-2xl font-black shadow-2xl active:scale-95 transition-all">INITIALIZE</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto h-full relative shadow-2xl overflow-hidden selection:bg-[var(--accent-color)]/30">
      <div className="relative z-10 h-full">
        {view.type === 'PROJECT_LIST' && renderProjectList()}
        {view.type === 'THEME_SETTINGS' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right-8">
            <header className="px-6 pt-12 pb-6 flex items-center gap-4 shrink-0">
              <button onClick={() => setView({ type: 'PROJECT_LIST' })} className="p-3 glass-panel rounded-2xl active:scale-90 transition-all"><ChevronLeft /></button>
              <h2 className="text-2xl font-black tech-font accent-text tracking-tighter uppercase">Visual Interface</h2>
            </header>
            <div className="flex-1 overflow-y-auto px-6 grid grid-cols-2 gap-5 pb-24 hide-scrollbar">
              {THEMES.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setCurrentTheme(t)} 
                  className={`p-5 rounded-[2rem] glass-panel relative overflow-hidden transition-all group border-2 ${currentTheme.id === t.id ? 'accent-border ring-8 ring-[var(--accent-glow)] scale-105' : 'border-white/5 opacity-60 hover:opacity-100'}`} 
                  style={{ background: t.bgImage }}
                >
                  <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-2xl border-4 border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: t.accentColor }}>
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: t.textColor }}>{t.name}</span>
                  </div>
                  {currentTheme.id === t.id && (
                    <div className="absolute top-3 right-3 accent-text bg-[var(--bg-color)] rounded-full p-1 shadow-lg border border-white/10">
                      <Check size={14} strokeWidth={4} />
                    </div>
                  )}
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '8px 8px' }}></div>
                </button>
              ))}
              <div className="col-span-2 mt-4 p-6 glass-panel rounded-3xl border-dashed">
                <p className="text-center text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  System optimized for mobile interface<br/>Pure CSS Rendering Engine v2.0
                </p>
              </div>
            </div>
          </div>
        )}
        {view.type === 'PROJECT_DETAIL' && renderProjectDetail(view.projectId, view.tab)}
        {view.type === 'TRANSACTION_HISTORY' && renderHistory(view.subCategoryId, view.projectId)}
      </div>

      {isAddingProject && <ProjectFormModal onClose={() => setIsAddingProject(false)} />}
      {editingProject && <ProjectFormModal project={editingProject} onClose={() => setEditingProject(null)} />}
      
      {activeSubCategoryModal && (
        <SubCategoryFormModal 
          type={activeSubCategoryModal.type} 
          sub={activeSubCategoryModal.sub} 
          projectId={(view as any).projectId} 
          onClose={() => setActiveSubCategoryModal(null)} 
        />
      )}

      {activeTransactionModal && (
        <TransactionFormModal 
          type={activeTransactionModal.type} 
          subId={activeTransactionModal.subId} 
          tx={activeTransactionModal.tx} 
          onClose={() => setActiveTransactionModal(null)} 
        />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
