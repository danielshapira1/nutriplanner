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