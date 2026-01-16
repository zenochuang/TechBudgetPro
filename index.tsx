
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
  
  // Modals for SubCategories & Transactions
  const [activeSubCategoryModal, setActiveSubCategoryModal] = useState<{ type: 'ADD' | 'EDIT', sub?: SubCategory } | null>(null);
  const [activeTransactionModal, setActiveTransactionModal] = useState<{ type: 'ADD' | 'EDIT', subId: string, tx?: Transaction } | null>(null);
  
  // Current Theme State
  const [currentTheme, setCurrentTheme] = useState<Theme>(
    THEMES.find(t => t.id === (data as any).themeId) || THEMES[0]
  );

  // Persistence
  useEffect(() => {
    saveData({ ...data, themeId: currentTheme.id } as any);
  }, [data, currentTheme]);

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', currentTheme.bgColor);
    root.style.setProperty('--panel-bg', currentTheme.panelBg);
    root.style.setProperty('--accent-color', currentTheme.accentColor);
    root.style.setProperty('--accent-glow', currentTheme.accentGlow);
    root.style.setProperty('--text-color', currentTheme.textColor);
    root.style.setProperty('--border-style', currentTheme.borderStyle);
    root.style.setProperty('--bg-image', currentTheme.bgImage);
    root.style.fontFamily = currentTheme.fontFamily;
  }, [currentTheme]);

  // Stats Logic
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

  // Render Functions
  const renderProjectList = () => (
    <div className="p-4 space-y-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tech-font tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-color)] to-[var(--text-color)] accent-glow">
          項目總覽
        </h1>
        <button 
          onClick={() => setView({ type: 'THEME_SETTINGS' })}
          className="p-3 glass-panel rounded-full accent-text active:scale-90 transition-transform neo-shadow"
        >
          <Palette size={20} />
        </button>
      </div>

      <div className="grid gap-4">
        {data.projects.length === 0 && (
          <div className="text-center py-20 text-slate-500 bg-black/40 rounded-3xl backdrop-blur-md">
            <Wallet className="mx-auto mb-4 opacity-10" size={64} />
            <p>點擊下方按鈕開始建立項目</p>
          </div>
        )}
        {data.projects.sort((a,b) => b.createdAt - a.createdAt).map(p => {
          const { totalRemaining } = getProjectStats(p.id);
          return (
            <div 
              key={p.id}
              onClick={() => setView({ type: 'PROJECT_DETAIL', projectId: p.id, tab: 'LIST' })}
              className="glass-panel p-5 rounded-2xl flex items-center justify-between hover:scale-[1.02] transition-all active:scale-[0.98] group relative overflow-hidden"
              style={{ border: 'var(--border-style)' }}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl bg-black/40 w-12 h-12 flex items-center justify-center rounded-xl shadow-inner border border-white/5">{p.emoji}</span>
                <div>
                  <h3 className="text-xl font-bold truncate max-w-[120px]">{p.name}</h3>
                  <p className="text-slate-500 text-sm">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`tech-font font-bold accent-glow ${totalRemaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(totalRemaining)}
                </p>
                <div className="flex gap-2 justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setEditingProject(p); }} className="p-1 text-slate-400"><Edit3 size={18} /></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="p-1 text-red-400/50"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <button 
        onClick={() => setIsAddingProject(true)}
        className="fixed bottom-10 right-8 w-16 h-16 accent-bg rounded-full flex items-center justify-center shadow-lg neo-shadow active:scale-90 transition-transform z-50"
      >
        <Plus color={currentTheme.bgColor} size={32} strokeWidth={3} />
      </button>
    </div>
  );

  const renderProjectDetail = (projectId: string, tab: 'LIST' | 'CHART') => {
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return null;
    const { totalRemaining, subStats, totalBudget } = getProjectStats(projectId);
    const maxValue = Math.max(1, ...subStats.map(s => Math.max(s.budget, s.spent)));

    return (
      <div className="min-h-screen pb-24 animate-in fade-in duration-300">
        <header className="sticky top-0 z-40 glass-panel border-b border-white/10 px-4 py-4 flex items-center gap-3">
          <button onClick={() => setView({ type: 'PROJECT_LIST' })} className="p-2"><ChevronLeft /></button>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xl">{project.emoji}</span>
            <h2 className="text-lg font-bold truncate max-w-[180px]">{project.name}</h2>
          </div>
        </header>

        <div className="p-4 flex flex-col items-center py-8">
          <p className="text-slate-300 text-sm mb-1 uppercase tracking-widest bg-black/30 px-3 py-0.5 rounded-full">總剩餘金額</p>
          <div className={`text-5xl font-bold tech-font ${totalRemaining >= 0 ? 'text-green-500' : 'text-red-500'} accent-glow transition-colors`}>
            {formatCurrency(totalRemaining)}
          </div>
          <div className="mt-2 px-3 py-1 bg-black/40 rounded-full border border-white/10">
            <p className="text-slate-400 text-xs font-medium">預算: {formatCurrency(totalBudget)}</p>
          </div>
        </div>

        <div className="flex px-4 mb-6">
          <div className="bg-black/60 rounded-2xl p-1 flex w-full border border-white/10 backdrop-blur-md">
            <button onClick={() => setView({ ...view, tab: 'LIST' } as ViewState)} className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${tab === 'LIST' ? 'accent-bg text-[var(--bg-color)] font-bold shadow-lg' : 'text-slate-400'}`}>
              <List size={18} /> 明細
            </button>
            <button onClick={() => setView({ ...view, tab: 'CHART' } as ViewState)} className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${tab === 'CHART' ? 'accent-bg text-[var(--bg-color)] font-bold shadow-lg' : 'text-slate-400'}`}>
              <BarChart2 size={18} /> 分析
            </button>
          </div>
        </div>

        {tab === 'LIST' ? (
          <div className="px-4 space-y-3">
            {subStats.map(sub => (
              <div 
                key={sub.id} 
                onClick={() => setView({ type: 'TRANSACTION_HISTORY', subCategoryId: sub.id, projectId })}
                className="glass-panel p-4 rounded-xl flex items-center justify-between active:scale-[0.98] transition-all relative overflow-hidden group"
                style={{ border: 'var(--border-style)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-active:scale-125 transition-transform">{sub.emoji}</span>
                  <div>
                    <p className="font-bold flex items-center gap-2">
                      {sub.name}
                      {(sub as any).isFreeMoney && <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.5 rounded-sm font-black">AUTO</span>}
                    </p>
                    <p className="text-xs text-slate-400">預算: {formatCurrency(sub.budget)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-bold ${sub.remaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(sub.remaining)}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">剩餘</p>
                  </div>
                  {!(sub as any).isFreeMoney && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveSubCategoryModal({ type: 'EDIT', sub }); }}
                      className="p-2 text-slate-500 hover:accent-text"
                    >
                      <Settings2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 pb-8">
             <div className="flex items-end gap-6 overflow-x-auto h-72 pb-12 pt-4 px-2 no-scrollbar border-b border-white/10 bg-black/30 rounded-t-3xl backdrop-blur-sm">
                {subStats.map(sub => {
                  const budgetHeight = (sub.budget / maxValue) * 100;
                  const spentHeight = (sub.spent / maxValue) * 100;
                  return (
                    <div key={sub.id} className="flex flex-col items-center min-w-[70px] h-full justify-end">
                      <div className="flex gap-1.5 h-full items-end w-full justify-center">
                        <div className="w-4 bg-slate-700/50 rounded-t-sm" style={{ height: `${budgetHeight}%` }}></div>
                        <div className={`w-4 rounded-t-sm ${sub.spent > sub.budget ? 'bg-red-500' : 'bg-green-500'} shadow-lg`} style={{ height: `${spentHeight}%` }}></div>
                      </div>
                      <div className="mt-2 text-center">
                        <span className="text-lg block">{sub.emoji}</span>
                        <span className="text-[10px] text-slate-400 truncate w-[60px] block font-bold">{sub.name}</span>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        )}

        <button 
          onClick={() => setActiveSubCategoryModal({ type: 'ADD' })}
          className="fixed bottom-10 right-8 w-16 h-16 accent-bg rounded-full flex items-center justify-center shadow-lg neo-shadow active:scale-90 transition-transform z-50"
        >
          <Plus color={currentTheme.bgColor} size={32} strokeWidth={3} />
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
      <div className="min-h-screen pb-24 animate-in slide-in-from-right-4 duration-300">
        <header className="sticky top-0 z-40 glass-panel border-b border-white/10 px-4 py-4 flex items-center gap-4">
          <button onClick={() => setView({ type: 'PROJECT_DETAIL', projectId, tab: 'LIST' })} className="p-2"><ChevronLeft /></button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{sub.emoji}</span>
            <h2 className="text-lg font-bold">{sub.name} 記錄</h2>
          </div>
        </header>

        <div className="p-4 space-y-3">
          {txs.length === 0 && (
            <div className="text-center py-20 text-slate-500 bg-black/40 rounded-3xl backdrop-blur-md">
              <Calendar className="mx-auto mb-4 opacity-20" size={48} />
              <p>尚無支出記錄</p>
            </div>
          )}
          {txs.map(t => (
            <div key={t.id} className="glass-panel p-4 rounded-xl flex items-center justify-between group active:scale-[0.98] transition-all" style={{ border: 'var(--border-style)' }}>
              <div onClick={() => setActiveTransactionModal({ type: 'EDIT', subId: subCategoryId, tx: t })}>
                <p className="font-bold flex items-center gap-2">{t.name} <Edit3 size={14} className="text-slate-600 group-hover:accent-text" /></p>
                <p className="text-xs text-slate-500">{new Date(t.date).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className={`font-bold tech-font ${t.amount < 0 ? 'text-green-500' : 'text-red-500'}`}>
                   {formatCurrency(t.amount)}
                </p>
                <button onClick={() => deleteTransaction(t.id)} className="text-slate-500 hover:text-red-500 p-2"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => setActiveTransactionModal({ type: 'ADD', subId: subCategoryId })}
          className="fixed bottom-10 right-8 w-16 h-16 accent-bg rounded-full flex items-center justify-center shadow-lg neo-shadow active:scale-90 transition-transform z-50"
        >
          <Plus color={currentTheme.bgColor} size={32} strokeWidth={3} />
        </button>
      </div>
    );
  };

  const SubCategoryFormModal = ({ sub, type, onClose, projectId }: { sub?: SubCategory, type: 'ADD' | 'EDIT', onClose: () => void, projectId: string }) => {
    const [name, setName] = useState(sub?.name || '');
    const [emoji, setEmoji] = useState(sub?.emoji || EMOJIS[0]);
    const [budget, setBudget] = useState(sub?.budget.toString() || '');

    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-[var(--bg-color)] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold accent-text">{type === 'ADD' ? '新增支項' : '編輯支項'}</h3>
            {type === 'EDIT' && (
               <button onClick={() => deleteSubCategory(sub!.id)} className="text-red-500 p-2"><Trash2 size={20}/></button>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button className="bg-black/40 p-4 rounded-xl text-2xl border border-white/10 h-14 w-14 flex items-center justify-center shrink-0">{emoji}</button>
              <input 
                className="flex-1 min-w-0 bg-black/40 rounded-xl p-4 border border-white/10 focus:accent-border h-14 text-white" 
                placeholder="名稱" value={name} onChange={e => setName(e.target.value)} 
              />
            </div>
            <input 
              type="number" inputMode="decimal" className="w-full bg-black/40 rounded-xl p-4 tech-font border border-white/10 focus:accent-border h-14 text-white" 
              placeholder="支項預算" value={budget} onChange={e => setBudget(e.target.value)} 
            />
            <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 bg-black/40 rounded-xl border border-white/10">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} className={`text-xl p-1.5 rounded-lg transition-all ${emoji === e ? 'accent-bg scale-110' : 'hover:bg-white/5'}`}>{e}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-bold">取消</button>
            <button 
              disabled={!name || !budget}
              onClick={() => {
                saveSubCategory(name, emoji, Number(budget), projectId, sub?.id);
                onClose();
              }}
              className="flex-1 py-4 accent-bg text-[var(--bg-color)] rounded-xl font-bold shadow-lg disabled:opacity-30"
            >
              確定
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
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-[var(--bg-color)] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-8">
          <h3 className="text-xl font-bold mb-6 accent-text">{type === 'ADD' ? '新增支出/收入' : '編輯記錄'}</h3>
          <div className="space-y-4">
            <input className="w-full bg-black/40 rounded-xl p-4 border border-white/10 focus:accent-border text-white" placeholder="名稱 (預設今日日期)" value={name} onChange={e => setName(e.target.value)} />
            <input type="number" inputMode="decimal" className="w-full bg-black/40 rounded-xl p-4 tech-font border border-white/10 focus:accent-border text-white" placeholder="金額 (負數代表收入)" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-bold">取消</button>
            <button 
              disabled={!amount}
              onClick={() => {
                saveTransaction(name, Number(amount), subId, tx?.id);
                onClose();
              }}
              className="flex-1 py-4 accent-bg text-[var(--bg-color)] rounded-xl font-bold shadow-lg disabled:opacity-30"
            >
              確定
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
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-[var(--bg-color)] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 accent-text"><Wallet size={24} /> {project ? '編輯項目' : '建立新項目'}</h3>
          <div className="space-y-4">
            <input className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:accent-border" placeholder="項目名稱" value={name} onChange={e => setName(e.target.value)} />
            <input type="number" inputMode="decimal" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 tech-font focus:accent-border text-white" placeholder="總預算金額" value={budget} onChange={e => setBudget(e.target.value)} />
            <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1 bg-black/40 rounded-xl border border-white/10">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} className={`text-2xl p-2 rounded-xl transition-all ${emoji === e ? 'accent-bg scale-110 shadow-lg' : 'hover:bg-white/5'}`}>{e}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-bold">取消</button>
            <button disabled={!name || !budget} onClick={() => { project ? updateProject(project.id, name, emoji, Number(budget)) : addProject(name, emoji, Number(budget)); onClose(); }} className="flex-1 py-4 accent-bg text-[var(--bg-color)] rounded-xl font-bold shadow-lg">確定</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative shadow-2xl overflow-x-hidden selection:bg-[var(--accent-color)]/30 bg-fixed bg-center bg-cover" style={{ backgroundImage: 'var(--bg-image)' }}>
      {/* Background Overlay for better readability */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
      
      <div className="relative z-10">
        {view.type === 'PROJECT_LIST' && renderProjectList()}
        {view.type === 'THEME_SETTINGS' && (
          <div className="p-4 pb-12 animate-in slide-in-from-right-4 duration-300 min-h-screen">
            <header className="flex items-center gap-4 mb-8">
              <button onClick={() => setView({ type: 'PROJECT_LIST' })} className="p-2"><ChevronLeft /></button>
              <h2 className="text-2xl font-bold tech-font accent-text">主題選擇</h2>
            </header>
            <div className="grid grid-cols-2 gap-4">
              {THEMES.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setCurrentTheme(t)} 
                  className={`p-4 rounded-3xl glass-panel relative overflow-hidden transition-all group ${currentTheme.id === t.id ? 'accent-border ring-4 ring-[var(--accent-color)]/30 scale-105' : 'border-white/10 opacity-80 hover:opacity-100 hover:scale-[1.02]'}`} 
                  style={{ backgroundColor: t.panelBg, border: t.borderStyle }}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl border-2 border-white/20 shadow-2xl flex items-center justify-center text-xl overflow-hidden" style={{ backgroundColor: t.accentColor }}>
                      <div className="w-full h-full opacity-30 bg-black/20 animate-pulse"></div>
                    </div>
                    <span className="text-sm font-black tracking-widest uppercase" style={{ color: t.textColor }}>{t.name}</span>
                  </div>
                  {currentTheme.id === t.id && (
                    <div className="absolute top-2 right-2 accent-text bg-[var(--bg-color)] rounded-full p-0.5 shadow-md">
                      <Check size={16} strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-8 text-center text-slate-400 text-xs px-4">
              提示：請確保根目錄已有 <code className="bg-black/40 px-1 rounded">bg-1.jpg</code> 至 <code className="bg-black/40 px-1 rounded">bg-8.jpg</code> 對應圖片。
            </p>
          </div>
        )}
        {view.type === 'PROJECT_DETAIL' && renderProjectDetail(view.projectId, view.tab)}
        {view.type === 'TRANSACTION_HISTORY' && renderHistory(view.subCategoryId, view.projectId)}
      </div>

      {/* Global Modals */}
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
