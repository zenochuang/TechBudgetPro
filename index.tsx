
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, 
  ChevronLeft, 
  Trash2, 
  Edit3, 
  BarChart2, 
  List, 
  Check, 
  X,
  PlusCircle,
  Calendar,
  Wallet,
  Settings2
} from 'lucide-react';
import { Project, SubCategory, Transaction, ViewState, EMOJIS } from './types';
import { COLORS, formatCurrency } from './constants';
import { loadData, saveData } from './utils/storage';

const App = () => {
  const [data, setData] = useState(loadData());
  const [view, setView] = useState<ViewState>({ type: 'PROJECT_LIST' });
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditingSubCategory, setIsEditingSubCategory] = useState(false);
  
  // Persistence
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Auto-redirect to sub-category setup for new projects
  useEffect(() => {
    if (view.type === 'PROJECT_DETAIL') {
      const subs = data.subCategories.filter(s => s.projectId === view.projectId);
      if (subs.length === 0 && !isEditingSubCategory) {
        setIsEditingSubCategory(true);
      }
    }
  }, [view, data.subCategories]);

  // Derived Values
  const getProjectStats = (projectId: string) => {
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return { totalRemaining: 0, subStats: [], totalBudget: 0, totalSpent: 0 };

    const subs = data.subCategories.filter(s => s.projectId === projectId);
    
    // Calculate allocated budget
    const allocatedBudgetSum = subs.reduce((sum, s) => sum + s.budget, 0);
    const freeMoneyBudget = project.totalBudget - allocatedBudgetSum;

    // Map regular sub-categories
    const regularSubStats = subs.map(sub => {
      const spent = data.transactions
        .filter(t => t.subCategoryId === sub.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...sub,
        spent,
        remaining: sub.budget - spent
      };
    });

    // Special "Free Money" (閒錢) sub-category
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

    // Prepend Free Money to the list as requested
    const subStats = [freeMoneyStat, ...regularSubStats];

    const totalSpent = subStats.reduce((sum, s) => sum + s.spent, 0);
    const totalRemaining = project.totalBudget - totalSpent;

    return { totalRemaining, subStats, totalSpent, totalBudget: project.totalBudget };
  };

  // Actions
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
        projects: prev.projects.filter(p => p.id !== id),
        subCategories: prev.subCategories.filter(s => s.projectId !== id),
        transactions: prev.transactions.filter(t => !subIds.includes(t.subCategoryId) && t.subCategoryId !== freeMoneyId)
      };
    });
    setView({ type: 'PROJECT_LIST' });
  };

  const manageSubCategory = (sub: Partial<SubCategory> & { id?: string }) => {
    setData(prev => {
      if (sub.id) {
        return {
          ...prev,
          subCategories: prev.subCategories.map(s => s.id === sub.id ? { ...s, ...sub } : s)
        };
      } else {
        const currentProjectId = view.type === 'PROJECT_DETAIL' ? view.projectId : '';
        const newSub: SubCategory = {
          id: crypto.randomUUID(),
          projectId: currentProjectId,
          name: sub.name || '新支項',
          emoji: sub.emoji || '💰',
          budget: sub.budget || 0
        };
        return { ...prev, subCategories: [...prev.subCategories, newSub] };
      }
    });
  };

  const deleteSubCategory = (id: string) => {
    if (!confirm('刪除支項將會刪除其下所有記錄，確定嗎？')) return;
    setData(prev => ({
      ...prev,
      subCategories: prev.subCategories.filter(s => s.id !== id),
      transactions: prev.transactions.filter(t => t.subCategoryId !== id)
    }));
  };

  const saveTransaction = (name: string, amount: number, subCategoryId: string, id?: string) => {
    setData(prev => {
      if (id) {
        return {
          ...prev,
          transactions: prev.transactions.map(t => t.id === id ? { ...t, name, amount, subCategoryId } : t)
        };
      } else {
        const newTx: Transaction = {
          id: crypto.randomUUID(),
          subCategoryId,
          name,
          amount,
          date: Date.now()
        };
        return { ...prev, transactions: [newTx, ...prev.transactions] };
      }
    });
    setIsAddingTransaction(false);
    setEditingTransaction(null);
  };

  const deleteTransaction = (id: string) => {
    if (!confirm('確定要刪除此筆記錄嗎？')) return;
    setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  };

  // Views
  const renderProjectList = () => (
    <div className="p-4 space-y-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tech-font tracking-wider mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#00f2ff] to-[#0066ff] accent-glow">
        項目總覽
      </h1>
      <div className="grid gap-4">
        {data.projects.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <PlusCircle className="mx-auto mb-4 opacity-10" size={64} />
            <p>點擊下方按鈕開始建立項目</p>
          </div>
        )}
        {data.projects.sort((a,b) => b.createdAt - a.createdAt).map(p => (
          <div 
            key={p.id}
            onClick={() => setView({ type: 'PROJECT_DETAIL', projectId: p.id, tab: 'LIST' })}
            className="glass-panel p-5 rounded-2xl flex items-center justify-between hover:border-[#00f2ff]/50 transition-all active:scale-[0.98] group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00f2ff] to-transparent opacity-50"></div>
            <div className="flex items-center gap-4">
              <span className="text-3xl bg-slate-800/50 w-12 h-12 flex items-center justify-center rounded-xl shadow-inner border border-white/5">{p.emoji}</span>
              <div>
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="text-slate-400 text-sm">{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="tech-font text-[#00f2ff] font-bold accent-glow">{formatCurrency(p.totalBudget)}</p>
              <div className="flex gap-2 justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); setEditingProject(p); }} className="p-1 text-slate-400"><Edit3 size={18} /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="p-1 text-red-400"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => setIsAddingProject(true)}
        className="fixed bottom-8 right-6 w-16 h-16 bg-[#00f2ff] rounded-full flex items-center justify-center shadow-lg shadow-[#00f2ff]/30 neo-shadow active:scale-90 transition-transform z-50"
      >
        <Plus color="#020617" size={32} strokeWidth={3} />
      </button>
    </div>
  );

  const renderProjectDetail = (projectId: string, tab: 'LIST' | 'CHART') => {
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return null;
    const { totalRemaining, subStats, totalBudget } = getProjectStats(projectId);

    // Max value for chart normalization
    const maxValue = Math.max(1, ...subStats.map(s => Math.max(s.budget, s.spent)));

    return (
      <div className="min-h-screen pb-24 animate-in fade-in duration-300">
        <header className="sticky top-0 z-40 glass-panel border-b border-white/10 px-4 py-4 flex items-center justify-between">
          <button onClick={() => setView({ type: 'PROJECT_LIST' })} className="p-2"><ChevronLeft /></button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{project.emoji}</span>
            <h2 className="text-lg font-bold truncate max-w-[120px]">{project.name}</h2>
          </div>
          <button 
            onClick={() => setIsEditingSubCategory(true)} 
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff] rounded-full active:scale-95 transition-all"
          >
            <Settings2 size={14} /> 編輯支項
          </button>
        </header>

        <div className="p-4 flex flex-col items-center py-8">
          <p className="text-slate-400 text-sm mb-1">總剩餘金額</p>
          <div className={`text-5xl font-bold tech-font ${totalRemaining >= 0 ? 'text-green-500' : 'text-red-500'} accent-glow transition-colors`}>
            {formatCurrency(totalRemaining)}
          </div>
          <div className="mt-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <p className="text-slate-500 text-xs">總預算: {formatCurrency(totalBudget)}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-4 mb-6">
          <div className="bg-slate-900/80 rounded-2xl p-1 flex w-full border border-white/5">
            <button 
              onClick={() => setView({ ...view, tab: 'LIST' } as ViewState)}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${tab === 'LIST' ? 'bg-[#00f2ff] text-[#020617] font-bold shadow-lg' : 'text-slate-400'}`}
            >
              <List size={18} /> 明細
            </button>
            <button 
              onClick={() => setView({ ...view, tab: 'CHART' } as ViewState)}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${tab === 'CHART' ? 'bg-[#00f2ff] text-[#020617] font-bold shadow-lg' : 'text-slate-400'}`}
            >
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
                className={`glass-panel p-4 rounded-xl flex items-center justify-between active:bg-white/5 transition-colors border-l-4 ${(sub as any).isFreeMoney ? 'border-l-amber-400 bg-amber-400/5' : 'border-l-[#00f2ff]/30'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sub.emoji}</span>
                  <div>
                    <p className="font-bold flex items-center gap-2">
                      {sub.name}
                      {(sub as any).isFreeMoney && <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.5 rounded-sm font-black">AUTO</span>}
                    </p>
                    <p className="text-xs text-slate-500">預算: {formatCurrency(sub.budget)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${sub.remaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(sub.remaining)}
                  </p>
                  <p className="text-[10px] text-slate-500">剩餘</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 pb-8">
             <div className="flex items-end gap-6 overflow-x-auto h-72 pb-12 pt-4 px-2 no-scrollbar border-b border-white/10">
                {subStats.map(sub => {
                  const budgetHeight = (sub.budget / maxValue) * 100;
                  const spentHeight = (sub.spent / maxValue) * 100;
                  const isOver = sub.spent > sub.budget;

                  return (
                    <div key={sub.id} className="flex flex-col items-center min-w-[70px] h-full justify-end group">
                      <div className="flex gap-1.5 h-full items-end w-full justify-center">
                        {/* Budget Bar */}
                        <div 
                          className="w-4 bg-slate-700/50 rounded-t-sm transition-all duration-500"
                          style={{ height: `${budgetHeight}%` }}
                        ></div>
                        {/* Spent Bar */}
                        <div 
                          className={`w-4 rounded-t-sm transition-all duration-700 delay-100 ${isOver ? 'bg-red-500' : 'bg-green-500'} shadow-lg`}
                          style={{ height: `${spentHeight}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 text-center">
                        <span className="text-lg block">{sub.emoji}</span>
                        <span className="text-[10px] text-slate-400 truncate w-[60px] block font-bold">{sub.name}</span>
                      </div>
                    </div>
                  );
                })}
             </div>
             <div className="flex gap-4 mt-6 justify-center text-[10px] uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-slate-700/50 rounded-sm"></div><span className="text-slate-500">預算</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-green-500 rounded-sm"></div><span className="text-slate-500">支出</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div><span className="text-slate-500">超支</span></div>
             </div>
          </div>
        )}

        <button 
          onClick={() => setIsAddingTransaction(true)}
          className="fixed bottom-8 right-6 w-16 h-16 bg-[#00f2ff] rounded-full flex items-center justify-center shadow-lg shadow-[#00f2ff]/30 neo-shadow active:scale-90 transition-transform z-50"
        >
          <Plus color="#020617" size={32} strokeWidth={3} />
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
            <div className="text-center py-20 text-slate-500">
              <Calendar className="mx-auto mb-4 opacity-20" size={48} />
              <p>尚無支出記錄</p>
            </div>
          )}
          {txs.map(t => (
            <div key={t.id} className="glass-panel p-4 rounded-xl flex items-center justify-between group">
              <div onClick={() => setEditingTransaction(t)}>
                <p className="font-bold flex items-center gap-2">{t.name} <Edit3 size={14} className="text-slate-600 group-hover:text-[#00f2ff]" /></p>
                <p className="text-xs text-slate-500">{new Date(t.date).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className={`font-bold tech-font ${t.amount < 0 ? 'text-green-500' : 'text-red-500'}`}>
                   {formatCurrency(t.amount)}
                </p>
                <button onClick={() => deleteTransaction(t.id)} className="text-slate-600 hover:text-red-400 p-2 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Modals / Forms
  const ProjectFormModal = ({ project, onClose }: { project?: Project, onClose: () => void }) => {
    const [name, setName] = useState(project?.name || '');
    const [emoji, setEmoji] = useState(project?.emoji || EMOJIS[0]);
    const [budget, setBudget] = useState(project ? project.totalBudget.toString() : '');

    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#00f2ff]">
            <PlusCircle size={24} /> {project ? '編輯項目' : '建立新項目'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">項目名稱</label>
              <input 
                autoFocus
                className="w-full bg-slate-800 border border-white/5 rounded-xl p-4 text-white placeholder-slate-600 focus:border-[#00f2ff]/50 transition-colors"
                placeholder="例如：2024 日本旅行"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">總預算金額</label>
              <input 
                type="number"
                inputMode="decimal"
                className="w-full bg-slate-800 border border-white/5 rounded-xl p-4 text-white tech-font focus:border-[#00f2ff]/50 transition-colors"
                placeholder="輸入金額"
                value={budget}
                onChange={e => setBudget(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-2 block">選擇識別圖示</label>
              <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1 bg-black/20 rounded-xl border border-white/5">
                {EMOJIS.map(e => (
                  <button 
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`text-2xl p-2 rounded-xl transition-all ${emoji === e ? 'bg-[#00f2ff] scale-110 shadow-lg' : 'hover:bg-white/5'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-bold active:opacity-50">取消</button>
            <button 
              disabled={!name || !budget}
              onClick={() => {
                if (!name.trim()) return;
                if (project) updateProject(project.id, name, emoji, Number(budget));
                else addProject(name, emoji, Number(budget));
                onClose();
              }}
              className="flex-1 py-4 bg-[#00f2ff] text-[#020617] rounded-xl font-bold shadow-lg shadow-[#00f2ff]/20 active:scale-95 disabled:opacity-30 transition-all"
            >
              確定
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TransactionFormModal = ({ projectId, transaction, onClose }: { projectId: string, transaction?: Transaction | null, onClose: () => void }) => {
    const [name, setName] = useState(transaction?.name || '');
    const [amount, setAmount] = useState(transaction?.amount.toString() || '');
    const [subId, setSubId] = useState(transaction?.subCategoryId || '');
    
    const { subStats } = getProjectStats(projectId);

    useEffect(() => {
        if (!subId && subStats.length > 0) setSubId(subStats[0].id);
    }, [subStats.length]);

    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 border border-white/10 animate-in slide-in-from-bottom-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#00f2ff]">
            {transaction ? '編輯記錄' : '新增支出 / 收入'}
          </h3>
          <div className="space-y-4">
            <input 
              autoFocus
              className="w-full bg-slate-800 border border-white/5 rounded-xl p-4 text-white focus:border-[#00f2ff]/50"
              placeholder="名稱 (例如：午餐)"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input 
              type="number"
              inputMode="decimal"
              className="w-full bg-slate-800 border border-white/5 rounded-xl p-4 text-white tech-font focus:border-[#00f2ff]/50"
              placeholder="金額 (負數代表收入)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <div>
              <label className="text-xs text-slate-500 mb-2 block">所屬支項</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {subStats.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setSubId(s.id)}
                    className={`p-3 rounded-xl border text-sm flex items-center gap-2 transition-all ${subId === s.id ? 'border-[#00f2ff] bg-[#00f2ff]/10 text-[#00f2ff]' : 'border-white/5 bg-slate-800 text-slate-400'}`}
                  >
                    <span>{s.emoji}</span> <span className="truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-bold">取消</button>
            <button 
              disabled={!name || !amount || !subId}
              onClick={() => {
                saveTransaction(name, Number(amount), subId, transaction?.id);
                onClose();
              }}
              className="flex-1 py-4 bg-[#00f2ff] text-[#020617] disabled:opacity-30 rounded-xl font-bold active:scale-95 transition-all"
            >
              確定
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SubCategoryManageModal = ({ projectId, onClose }: { projectId: string, onClose: () => void }) => {
    const subs = data.subCategories.filter(s => s.projectId === projectId);
    const [editingSub, setEditingSub] = useState<SubCategory | null>(null);
    
    const [name, setName] = useState('');
    const [budget, setBudget] = useState('');
    const [emoji, setEmoji] = useState(EMOJIS[0]);

    const resetForm = () => {
        setName('');
        setBudget('');
        setEmoji(EMOJIS[0]);
        setEditingSub(null);
    };

    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
        <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 py-4 flex items-center justify-between">
          <button onClick={onClose} className="p-2"><ChevronLeft /></button>
          <h2 className="text-lg font-bold">管理支項預算</h2>
          <div className="w-10"></div>
        </header>

        <div className="p-4 space-y-6">
          <div className="glass-panel p-5 rounded-2xl border-[#00f2ff]/30 border-l-4">
            <h4 className="text-[#00f2ff] font-bold mb-4">{editingSub ? '編輯支項' : '新增支項'}</h4>
            <div className="space-y-4">
               <div className="flex gap-2">
                 <button className="bg-slate-800 p-4 rounded-xl text-2xl border border-white/5">{emoji}</button>
                 <input 
                    className="flex-1 bg-slate-800 rounded-xl p-4 border border-white/5 focus:border-[#00f2ff]/30 transition-colors" 
                    placeholder="支項名稱 (如：飲食)" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                  />
               </div>
               <input 
                  type="number"
                  inputMode="decimal"
                  className="w-full bg-slate-800 rounded-xl p-4 tech-font border border-white/5 focus:border-[#00f2ff]/30 transition-colors" 
                  placeholder="支項預算金額" 
                  value={budget} 
                  onChange={e => setBudget(e.target.value)} 
                />
               <div className="grid grid-cols-8 gap-2 overflow-x-auto pb-2 px-1 bg-black/20 rounded-xl border border-white/5 p-2">
                 {EMOJIS.map(e => (
                   <button key={e} onClick={() => setEmoji(e)} className={`text-xl p-1.5 rounded-lg transition-all ${emoji === e ? 'bg-[#00f2ff] scale-110' : 'hover:bg-white/5'}`}>{e}</button>
                 ))}
               </div>
               <div className="flex gap-2">
                  {editingSub && <button onClick={resetForm} className="flex-1 py-3 text-slate-400 font-bold">取消</button>}
                  <button 
                    onClick={() => {
                        if (!name || !budget) return;
                        manageSubCategory({ ...editingSub, name, budget: Number(budget), emoji, projectId });
                        resetForm();
                    }}
                    className="flex-[2] py-3 bg-[#00f2ff] text-[#020617] rounded-xl font-bold shadow-lg shadow-[#00f2ff]/10"
                  >
                    {editingSub ? '更新支項' : '新增支項'}
                  </button>
               </div>
            </div>
          </div>

          <div className="space-y-3">
             <h4 className="text-slate-500 font-bold px-1 flex items-center justify-between">
                <span>已有支項</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full">{subs.length} 項目</span>
             </h4>
             {subs.map(s => (
               <div key={s.id} className="glass-panel p-4 rounded-xl flex items-center justify-between border border-white/5 group transition-all">
                 <div className="flex items-center gap-3">
                   <span className="text-2xl group-hover:scale-110 transition-transform">{s.emoji}</span>
                   <div>
                     <p className="font-bold">{s.name}</p>
                     <p className="text-xs text-slate-400">預算: {formatCurrency(s.budget)}</p>
                   </div>
                 </div>
                 <div className="flex gap-1">
                    <button onClick={() => {
                        setEditingSub(s);
                        setName(s.name);
                        setBudget(s.budget.toString());
                        setEmoji(s.emoji);
                    }} className="p-2 text-slate-400 hover:text-[#00f2ff] transition-colors"><Edit3 size={18} /></button>
                    <button onClick={() => deleteSubCategory(s.id)} className="p-2 text-red-400/50 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                 </div>
               </div>
             ))}
             {subs.length >= 0 && (
               <button 
                  onClick={onClose} 
                  className="w-full py-4 mt-4 bg-slate-900 border border-white/10 rounded-xl text-slate-300 font-bold active:bg-white/5 transition-all"
                >
                  完成設定
               </button>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#020617] relative shadow-2xl overflow-x-hidden selection:bg-[#00f2ff]/30">
      {view.type === 'PROJECT_LIST' && renderProjectList()}
      {view.type === 'PROJECT_DETAIL' && renderProjectDetail(view.projectId, view.tab)}
      {view.type === 'TRANSACTION_HISTORY' && renderHistory(view.subCategoryId, view.projectId)}

      {/* Modals */}
      {isAddingProject && <ProjectFormModal onClose={() => setIsAddingProject(false)} />}
      {editingProject && <ProjectFormModal project={editingProject} onClose={() => setEditingProject(null)} />}
      {(isAddingTransaction || editingTransaction) && (view.type === 'PROJECT_DETAIL' || view.type === 'TRANSACTION_HISTORY') && (
        <TransactionFormModal 
          projectId={view.projectId} 
          transaction={editingTransaction} 
          onClose={() => {
            setIsAddingTransaction(false);
            setEditingTransaction(null);
          }} 
        />
      )}
      {isEditingSubCategory && view.type === 'PROJECT_DETAIL' && (
        <SubCategoryManageModal projectId={view.projectId} onClose={() => setIsEditingSubCategory(false)} />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
