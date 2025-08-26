import type { PersistShape } from '../types';
import QUOTES from './quotes';


const KEY = 'NUTRIPLANNER/V2/STATE';


const migrate = (raw:any):PersistShape => {
const base: PersistShape = { targetsByDate:{}, meals:[], plans:[], shopping:[], weights:[] };
if(!raw || typeof raw!=='object') return base;
return {
targetsByDate: raw.targetsByDate ?? {},
meals: Array.isArray(raw.meals)? raw.meals: [],
plans: Array.isArray(raw.plans)? raw.plans: [],
shopping: Array.isArray(raw.shopping)? raw.shopping: [],
weights: Array.isArray(raw.weights)? raw.weights: [],
};
};


export const loadState = ():PersistShape => {
try{ const raw=localStorage.getItem(KEY); if(raw) return migrate(JSON.parse(raw)); }catch{}
try{ const raw1=localStorage.getItem('NUTRIPLANNER/V1/STATE'); if(raw1) return migrate(JSON.parse(raw1)); }catch{}
return migrate({});
};


export const saveState = (s:PersistShape) => localStorage.setItem(KEY, JSON.stringify(s));

export type MealTemplate = {
  name: string;
  calories: number;
  protein: number;
  uses: number;
  updatedAt: number;
};

const TEMPLATES_KEY = 'nutri_templates_v1';

function readTemplates(): MealTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
    return [];
  } catch {
    return [];
  }
}

function writeTemplates(list: MealTemplate[]) {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(list));
  } catch {}
}

function normName(s: string): string {
  return (s || '').trim().toLowerCase();
}

/** שמירה/עדכון תבנית לפי שם (case-insensitive). */
export function upsertMealTemplate(name: string, calories: number, protein: number) {
  const list = readTemplates();
  const key = normName(name);
  const now = Date.now();
  const idx = list.findIndex(t => normName(t.name) === key);
  if (idx >= 0) {
    // מעדכן ערכים, מעלה counter, מעדכן זמן
    const ex = list[idx];
    list[idx] = {
      ...ex,
      name: name.trim(),
      calories: Math.max(0, Number(calories) || 0),
      protein: Math.max(0, Number(protein) || 0),
      uses: (ex.uses || 0) + 1,
      updatedAt: now,
    };
  } else {
    list.push({
      name: name.trim(),
      calories: Math.max(0, Number(calories) || 0),
      protein: Math.max(0, Number(protein) || 0),
      uses: 1,
      updatedAt: now,
    });
  }
  writeTemplates(list);
}

/** חיפוש לפי תחילת שם (prefix), מחזיר עד limit תוצאות, ממויין אלפביתית (עברית/אנגלית). */
export function searchMealTemplates(prefix: string, limit = 10): MealTemplate[] {
  const list = readTemplates();
  const p = normName(prefix);
  if (!p) return [];
  const startsWith = (name: string) => normName(name).startsWith(p);
  const filtered = list.filter(t => startsWith(t.name));
  // מיון אלפביתי; אם שוויון – לפי עדכניות או כמות שימושים
  filtered.sort((a, b) => {
    const byName = a.name.localeCompare(b.name, 'he', { sensitivity: 'base' });
    if (byName !== 0) return byName;
    // שובר שוויון: עדכניות ואז מספר שימושים
    if ((b.updatedAt || 0) !== (a.updatedAt || 0)) return (b.updatedAt || 0) - (a.updatedAt || 0);
    return (b.uses || 0) - (a.uses || 0);
  });
  return filtered.slice(0, Math.max(1, limit));
}

type QuotesState = {
  order: number[];      // shuffled indices of QUOTES
  idx: number;          // current index in order
  lastDateISO: string;  // last date we showed a quote (YYYY-MM-DD)
};

const QUOTES_KEY = 'nutri_quotes_v1';

function lsRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function lsWrite<T>(key: string, val: T) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function shuffledIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** החזרת ציטוט של היום: לא חוזר על עצמו עד שכל הרשימה מוצגת; אז נערבב מחדש. */
export function getDailyQuote(todayISO: string): string {
  let st = lsRead<QuotesState>(QUOTES_KEY, {
    order: [],
    idx: -1,
    lastDateISO: '',
  });

  if (!st.order || st.order.length !== QUOTES.length) {
    st.order = shuffledIndices(QUOTES.length);
    st.idx = -1;
    st.lastDateISO = '';
  }

  if (st.lastDateISO !== todayISO) {
    // יום חדש → להתקדם
    if (st.idx + 1 >= QUOTES.length) {
      st.order = shuffledIndices(QUOTES.length); // סיבוב חדש
      st.idx = 0;
    } else {
      st.idx += 1;
    }
    st.lastDateISO = todayISO;
    lsWrite(QUOTES_KEY, st);
  }

  const safeIdx = Math.max(0, Math.min(st.idx, QUOTES.length - 1));
  return QUOTES[st.order[safeIdx]];
}