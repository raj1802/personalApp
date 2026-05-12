// @ts-nocheck
import * as FileSystem from 'expo-file-system/legacy';
import { getBudgetDirUri } from './vaultSystem';
import { Platform } from 'react-native';

// ─── Types ────────────────────────────────────────────────

export interface Wallet {
  id: string;
  name: string;
  icon: string;
  color: string;
  currency: string;
  initialBalance: number;
  excludeFromTotal: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
  parentId?: string;
  order: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  categoryId: string;
  walletId: string;
  toWalletId?: string;
  title: string;
  note?: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  isRecurring: boolean;
  recurringId?: string;
  tags?: string[];
}

export interface Budget {
  id: string;
  name: string;
  categoryIds: string[];
  walletIds: string[];
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  color: string;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  categoryId: string;
  walletId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  nextDueDate: string;
  endDate?: string;
  isActive: boolean;
  note?: string;
}

export interface Debt {
  id: string;
  personName: string;
  amount: number;
  type: 'owed_to_me' | 'i_owe';
  description?: string;
  dueDate?: string;
  isPaid: boolean;
  createdAt: string;
}

export interface BudgetMeta {
  version: string;
  defaultCurrency: string;
  defaultWalletId: string;
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  recurring: RecurringTransaction[];
  debts: Debt[];
}

// ─── Default seed data ────────────────────────────────────

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food',    name: 'Food & Dining',   icon: '🍔', color: '#E8634A', type: 'expense', order: 0 },
  { id: 'cat_trans',  name: 'Transport',         icon: '🚌', color: '#4A7FBD', type: 'expense', order: 1 },
  { id: 'cat_shop',   name: 'Shopping',          icon: '🛍️', color: '#9B59B6', type: 'expense', order: 2 },
  { id: 'cat_ent',    name: 'Entertainment',     icon: '🎬', color: '#E74C3C', type: 'expense', order: 3 },
  { id: 'cat_health', name: 'Health',            icon: '🏥', color: '#2ECC71', type: 'expense', order: 4 },
  { id: 'cat_house',  name: 'Housing & Bills',   icon: '🏠', color: '#1ABC9C', type: 'expense', order: 5 },
  { id: 'cat_edu',    name: 'Education',         icon: '📚', color: '#3498DB', type: 'expense', order: 6 },
  { id: 'cat_misc',   name: 'Miscellaneous',     icon: '📦', color: '#95A5A6', type: 'expense', order: 7 },
  { id: 'cat_salary', name: 'Salary',            icon: '💼', color: '#27AE60', type: 'income',  order: 8 },
  { id: 'cat_free',   name: 'Freelance',         icon: '💸', color: '#F39C12', type: 'income',  order: 9 },
  { id: 'cat_gift',   name: 'Gift',              icon: '🎁', color: '#E91E63', type: 'both',    order: 10 },
];

const DEFAULT_WALLETS: Wallet[] = [
  { id: 'wallet_cash', name: 'Cash',         icon: '💵', color: '#4DD9AC', currency: 'INR', initialBalance: 0, excludeFromTotal: false, createdAt: new Date().toISOString() },
  { id: 'wallet_bank', name: 'Bank Account', icon: '🏦', color: '#4A7FBD', currency: 'INR', initialBalance: 0, excludeFromTotal: false, createdAt: new Date().toISOString() },
];

const DEFAULT_META: BudgetMeta = {
  version: '1.0',
  defaultCurrency: 'INR',
  defaultWalletId: 'wallet_cash',
  wallets: DEFAULT_WALLETS,
  categories: DEFAULT_CATEGORIES,
  budgets: [],
  recurring: [],
  debts: [],
};

// ─── File URI helpers ─────────────────────────────────────

async function getOrCreateDir(parentUri: string, name: string): Promise<string> {
  if (Platform.OS === 'android') {
    const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(parentUri);
    const existing = files.find(f => {
      const d = decodeURIComponent(f);
      return d.endsWith(`/${name}`) || d.endsWith(`:${name}`);
    });
    if (existing) return existing;
    return await FileSystem.StorageAccessFramework.makeDirectoryAsync(parentUri, name);
  } else {
    const dir = `${parentUri}${name}/`;
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    return dir;
  }
}

async function readJsonFile(uri: string): Promise<any | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return null;
    const content = await FileSystem.readAsStringAsync(uri, { encoding: 'utf8' });
    return content ? JSON.parse(content) : null;
  } catch {
    return null;
  }
}

async function writeJsonFile(parentUri: string, filename: string, data: any): Promise<string> {
  const content = JSON.stringify(data, null, 2);
  if (Platform.OS === 'android') {
    const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(parentUri);
    const existing = files.find(f => {
      const d = decodeURIComponent(f);
      return d.endsWith(`/${filename}`) || d.endsWith(`:${filename}`);
    });
    if (existing) {
      await FileSystem.writeAsStringAsync(existing, content, { encoding: 'utf8' });
      return existing;
    }
    const newUri = await FileSystem.StorageAccessFramework.createFileAsync(parentUri, filename, 'application/json');
    await FileSystem.writeAsStringAsync(newUri, content, { encoding: 'utf8' });
    return newUri;
  } else {
    const path = `${parentUri}${filename}`;
    await FileSystem.writeAsStringAsync(path, content, { encoding: 'utf8' });
    return path;
  }
}

async function getMetaFileUri(): Promise<{ dirUri: string; fileUri: string | null }> {
  const budgetDirUri = await getBudgetDirUri();
  if (Platform.OS === 'android') {
    const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(budgetDirUri);
    const existing = files.find(f => {
      const d = decodeURIComponent(f);
      return d.endsWith('/budget_meta.json') || d.endsWith(':budget_meta.json');
    });
    return { dirUri: budgetDirUri, fileUri: existing || null };
  } else {
    const path = `${budgetDirUri}budget_meta.json`;
    const info = await FileSystem.getInfoAsync(path);
    return { dirUri: budgetDirUri, fileUri: info.exists ? path : null };
  }
}

// ─── Hierarchical transaction file: budget/YYYY/MM/transactions.json ──

async function getTransactionFileUri(year: number, month: number, create = false): Promise<{ dirUri: string; fileUri: string | null }> {
  const budgetDirUri = await getBudgetDirUri();
  const yearDir = await getOrCreateDir(budgetDirUri, String(year));
  const mm = String(month).padStart(2, '0');
  const monthDir = await getOrCreateDir(yearDir, mm);

  if (Platform.OS === 'android') {
    const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(monthDir);
    const existing = files.find(f => {
      const d = decodeURIComponent(f);
      return d.endsWith('/transactions.json') || d.endsWith(':transactions.json');
    });
    return { dirUri: monthDir, fileUri: existing || null };
  } else {
    const path = `${monthDir}transactions.json`;
    const info = await FileSystem.getInfoAsync(path);
    return { dirUri: monthDir, fileUri: info.exists ? path : null };
  }
}

// ─── Meta CRUD ────────────────────────────────────────────

export const loadBudgetMeta = async (): Promise<BudgetMeta> => {
  const { fileUri } = await getMetaFileUri();
  if (!fileUri) return DEFAULT_META;
  const data = await readJsonFile(fileUri);
  return data || DEFAULT_META;
};

export const saveBudgetMeta = async (meta: BudgetMeta): Promise<void> => {
  const { dirUri } = await getMetaFileUri();
  await writeJsonFile(dirUri, 'budget_meta.json', meta);
};

export const initBudgetIfNeeded = async (): Promise<BudgetMeta> => {
  const { fileUri } = await getMetaFileUri();
  if (!fileUri) {
    await saveBudgetMeta(DEFAULT_META);
    return DEFAULT_META;
  }
  return loadBudgetMeta();
};

// ─── Wallet helpers ───────────────────────────────────────

export const getWallets = async (): Promise<Wallet[]> => {
  const meta = await loadBudgetMeta();
  return meta.wallets;
};

export const createWallet = async (data: Omit<Wallet, 'id' | 'createdAt'>): Promise<Wallet> => {
  const meta = await loadBudgetMeta();
  const wallet: Wallet = { ...data, id: `wallet_${Date.now()}`, createdAt: new Date().toISOString() };
  meta.wallets.push(wallet);
  await saveBudgetMeta(meta);
  return wallet;
};

export const updateWallet = async (id: string, data: Partial<Wallet>): Promise<void> => {
  const meta = await loadBudgetMeta();
  const idx = meta.wallets.findIndex(w => w.id === id);
  if (idx > -1) { meta.wallets[idx] = { ...meta.wallets[idx], ...data }; await saveBudgetMeta(meta); }
};

export const deleteWallet = async (id: string): Promise<void> => {
  const meta = await loadBudgetMeta();
  meta.wallets = meta.wallets.filter(w => w.id !== id);
  await saveBudgetMeta(meta);
};

// ─── Category helpers ─────────────────────────────────────

export const getCategories = async (): Promise<Category[]> => {
  const meta = await loadBudgetMeta();
  return meta.categories.sort((a, b) => a.order - b.order);
};

export const createCategory = async (data: Omit<Category, 'id'>): Promise<Category> => {
  const meta = await loadBudgetMeta();
  const cat: Category = { ...data, id: `cat_${Date.now()}` };
  meta.categories.push(cat);
  await saveBudgetMeta(meta);
  return cat;
};

export const updateCategory = async (id: string, data: Partial<Category>): Promise<void> => {
  const meta = await loadBudgetMeta();
  const idx = meta.categories.findIndex(c => c.id === id);
  if (idx > -1) { meta.categories[idx] = { ...meta.categories[idx], ...data }; await saveBudgetMeta(meta); }
};

export const deleteCategory = async (id: string): Promise<void> => {
  const meta = await loadBudgetMeta();
  meta.categories = meta.categories.filter(c => c.id !== id);
  await saveBudgetMeta(meta);
};

// ─── Transaction helpers ──────────────────────────────────

interface MonthlyTransactions { month: string; transactions: Transaction[]; }

const loadMonthlyFile = async (year: number, month: number): Promise<MonthlyTransactions> => {
  const { fileUri } = await getTransactionFileUri(year, month);
  if (!fileUri) return { month: `${year}-${String(month).padStart(2, '0')}`, transactions: [] };
  const data = await readJsonFile(fileUri);
  return data || { month: `${year}-${String(month).padStart(2, '0')}`, transactions: [] };
};

const saveMonthlyFile = async (year: number, month: number, data: MonthlyTransactions): Promise<void> => {
  const { dirUri } = await getTransactionFileUri(year, month, true);
  await writeJsonFile(dirUri, 'transactions.json', data);
};

export const getTransactions = async (year: number, month: number): Promise<Transaction[]> => {
  const data = await loadMonthlyFile(year, month);
  return data.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getTransactionsRange = async (fromDate: string, toDate: string): Promise<Transaction[]> => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const all: Transaction[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), 1);
  while (d <= to) {
    const txns = await getTransactions(d.getFullYear(), d.getMonth() + 1);
    all.push(...txns.filter(t => t.date >= fromDate && t.date <= toDate));
    d.setMonth(d.getMonth() + 1);
  }
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
  const txn: Transaction = { ...data, id: `txn_${Date.now()}`, createdAt: new Date().toISOString() };
  const [year, month] = txn.date.split('-').map(Number);
  const monthly = await loadMonthlyFile(year, month);
  monthly.transactions.push(txn);
  await saveMonthlyFile(year, month, monthly);
  return txn;
};

export const deleteTransaction = async (id: string, date: string): Promise<void> => {
  const [year, month] = date.split('-').map(Number);
  const monthly = await loadMonthlyFile(year, month);
  monthly.transactions = monthly.transactions.filter(t => t.id !== id);
  await saveMonthlyFile(year, month, monthly);
};

// ─── Budget helpers ───────────────────────────────────────

export const getBudgets = async (): Promise<Budget[]> => {
  const meta = await loadBudgetMeta();
  return meta.budgets;
};

export const createBudget = async (data: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget> => {
  const meta = await loadBudgetMeta();
  const budget: Budget = { ...data, id: `budget_${Date.now()}`, createdAt: new Date().toISOString() };
  meta.budgets.push(budget);
  await saveBudgetMeta(meta);
  return budget;
};

export const deleteBudget = async (id: string): Promise<void> => {
  const meta = await loadBudgetMeta();
  meta.budgets = meta.budgets.filter(b => b.id !== id);
  await saveBudgetMeta(meta);
};

export const getBudgetSpend = async (budget: Budget): Promise<number> => {
  const now = new Date();
  const txns = await getTransactions(now.getFullYear(), now.getMonth() + 1);
  return txns
    .filter(t => t.type === 'expense' && budget.categoryIds.includes(t.categoryId) && (budget.walletIds.length === 0 || budget.walletIds.includes(t.walletId)))
    .reduce((sum, t) => sum + t.amount, 0);
};

// ─── Recurring helpers ────────────────────────────────────

export const getRecurring = async (): Promise<RecurringTransaction[]> => {
  const meta = await loadBudgetMeta();
  return meta.recurring;
};

export const createRecurring = async (data: Omit<RecurringTransaction, 'id'>): Promise<RecurringTransaction> => {
  const meta = await loadBudgetMeta();
  const rec: RecurringTransaction = { ...data, id: `rec_${Date.now()}` };
  meta.recurring.push(rec);
  await saveBudgetMeta(meta);
  return rec;
};

export const getDueRecurring = async (): Promise<RecurringTransaction[]> => {
  const meta = await loadBudgetMeta();
  const today = new Date().toISOString().split('T')[0];
  return meta.recurring.filter(r => r.isActive && r.nextDueDate <= today);
};

// ─── Debt helpers ─────────────────────────────────────────

export const getDebts = async (): Promise<Debt[]> => {
  const meta = await loadBudgetMeta();
  return meta.debts;
};

export const createDebt = async (data: Omit<Debt, 'id' | 'createdAt'>): Promise<Debt> => {
  const meta = await loadBudgetMeta();
  const debt: Debt = { ...data, id: `debt_${Date.now()}`, createdAt: new Date().toISOString() };
  meta.debts.push(debt);
  await saveBudgetMeta(meta);
  return debt;
};

export const markDebtPaid = async (id: string): Promise<void> => {
  const meta = await loadBudgetMeta();
  const idx = meta.debts.findIndex(d => d.id === id);
  if (idx > -1) { meta.debts[idx].isPaid = true; await saveBudgetMeta(meta); }
};

export const deleteDebt = async (id: string): Promise<void> => {
  const meta = await loadBudgetMeta();
  meta.debts = meta.debts.filter(d => d.id !== id);
  await saveBudgetMeta(meta);
};

// ─── Analytics helpers ────────────────────────────────────

export const getSpendByCategory = async (year: number, month: number): Promise<Record<string, number>> => {
  const txns = await getTransactions(year, month);
  const result: Record<string, number> = {};
  txns.filter(t => t.type === 'expense').forEach(t => {
    result[t.categoryId] = (result[t.categoryId] || 0) + t.amount;
  });
  return result;
};

export const getMonthlyTotals = async (monthsBack: number): Promise<{ month: string; income: number; expense: number }[]> => {
  const results = [];
  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const txns = await getTransactions(d.getFullYear(), d.getMonth() + 1);
    const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    results.push({ month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, income, expense });
  }
  return results;
};

export const getWalletBalance = async (walletId: string): Promise<number> => {
  const meta = await loadBudgetMeta();
  const wallet = meta.wallets.find(w => w.id === walletId);
  if (!wallet) return 0;
  // Sum all transactions ever
  const now = new Date();
  let balance = wallet.initialBalance;
  // Go back 5 years
  for (let y = now.getFullYear() - 5; y <= now.getFullYear(); y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === now.getFullYear() && m > now.getMonth() + 1) break;
      const txns = await getTransactions(y, m);
      txns.filter(t => t.walletId === walletId || t.toWalletId === walletId).forEach(t => {
        if (t.walletId === walletId) {
          balance += t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : -t.amount;
        }
        if (t.toWalletId === walletId) balance += t.amount; // transfer in
      });
    }
  }
  return balance;
};

export const getNetWorth = async (): Promise<number> => {
  const wallets = await getWallets();
  let total = 0;
  for (const w of wallets.filter(w => !w.excludeFromTotal)) {
    total += await getWalletBalance(w.id);
  }
  return total;
};
