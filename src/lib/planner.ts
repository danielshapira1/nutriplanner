import type { PersistShape, WeeklyPlan, DayKey, MealType } from '../types';


export const getOrCreatePlan = (state: PersistShape, weekStartISO: string): WeeklyPlan => {
let plan = state.plans.find(p=>p.weekStartISO===weekStartISO);
if(!plan){ plan = { weekStartISO, days:{ sun:{}, mon:{}, tue:{}, wed:{}, thu:{}, fri:{}, sat:{} } }; state.plans.push(plan); }
return plan;
};


export const setPlanText = (state: PersistShape, weekStartISO:string, dayKey:DayKey, slot:MealType, text:string) => {
const plan = getOrCreatePlan(state, weekStartISO);
plan.days[dayKey] = { ...(plan.days[dayKey]||{}), [slot]: text };
};