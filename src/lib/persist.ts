import type { PersistShape } from '../types';


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