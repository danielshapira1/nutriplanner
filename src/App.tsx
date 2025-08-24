// src/App.tsx
import React, { useEffect, useMemo, useState } from 'react';
import type {
  PersistShape, MealEntry, Targets, DayKey, MealType, TabKey, WeeklyPlan, WeightEntry
} from './types';
import { toDateISO, sundayOfWeek } from './lib/dates';
import { loadState, saveState } from './lib/persist';
import { getOrCreatePlan, setPlanText } from './lib/planner';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import TargetEditor from './components/TargetEditor';
import MealLog from './components/MealLog';
import PlannerGrid from './components/PlannerGrid';
import SideSheet from './components/SideSheet';
import ConfirmModal from './components/ConfirmModal';
import WeightLog from './components/WeightLog';

const dayKeys: DayKey[] = ['sun','mon','tue','wed','thu','fri','sat'];

function getTotalsForDate(state:PersistShape, dateISO:string){
  const list = state.meals.filter(m=>m.dateISO===dateISO);
  const calories = list.reduce((s,m)=> s + (Number(m.calories)||0), 0);
  const protein  = list.reduce((s,m)=> s + (Number(m.protein)||0), 0);
  return { calories, protein };
}

export default function App(): JSX.Element {
  const [state,setState] = useState<PersistShape>(()=>loadState());
  useEffect(()=>saveState(state),[state]);

  const [tab,setTab] = useState<TabKey>('home');
  const todayISO = toDateISO(new Date());
  const weekStartISO = toDateISO(sundayOfWeek(new Date()));
  const [sheetOpen,setSheetOpen] = useState(false);

  const [editingWeek,setEditingWeek] = useState<string|null>(null);
  const [confirm,setConfirm] = useState<{open:boolean; week?:string; deleted?:boolean}>({open:false});

  const targetsToday = state.targetsByDate[todayISO] || { calories:0, protein:0 };
  const todayMeals = useMemo(()=> state.meals.filter(m=>m.dateISO===todayISO), [state.meals, todayISO]);
  const totals = useMemo(()=> getTotalsForDate(state, todayISO), [state, todayISO]);
  const plan = useMemo(()=> getOrCreatePlan(state, weekStartISO), [state, weekStartISO]);

  const saveTargets = (t:Targets)=>
    setState(prev=> ({ ...prev, targetsByDate: { ...prev.targetsByDate, [todayISO]: { ...t } } }));

  const addMeal = (m:MealEntry)=>
    setState(prev=> ({ ...prev, meals: [m, ...prev.meals] }));

  const delMeal = (id:string)=>
    setState(prev=> ({ ...prev, meals: prev.meals.filter(x=>x.id!==id) }));

  const onPlanChange = (d:DayKey, slot:MealType, text:string)=>
    setState(prev=>{ const next=structuredClone(prev); setPlanText(next, weekStartISO, d, slot, text); return next; });

  // 👉 מכאן התיקון: מחזירים JSX
  return (
    <div>
      <Header onOpenSheet={()=>setSheetOpen(true)} />

      <div className="content">
        {tab==='home' && (
          <>
            <div className="card" style={{display:'grid',gap:10}}>
              <TargetEditor initial={targetsToday} onSave={saveTargets}/>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div>היום {todayISO}</div>
                <div>
                  קל׳ {totals.calories}/{targetsToday.calories} • חלבון {totals.protein}/{targetsToday.protein}
                </div>
              </div>
              <MealLog
                dateISO={todayISO}
                meals={todayMeals}
                totals={totals}
                targets={targetsToday}
                onAdd={addMeal}
                onDelete={delMeal}
              />
            </div>

            <div style={{display:'grid',gap:8}}>
              <div style={{fontWeight:800,fontSize:16}}>
                פלנר שבועי (א׳–ש׳) – מתחיל ב-{weekStartISO}
              </div>
              <PlannerGrid plan={plan} onChange={onPlanChange}/>
              <div className="muted">טיפ: הזן תכנון לכל יום.</div>
            </div>
          </>
        )}

        {tab==='calendar' && (
          <div className="card">כאן תופיע היסטוריית השבועות (אם יש לך את הקומפוננטה/הלוגיקה המתאימה).</div>
        )}

        {tab==='weight' && (
          <WeightLog weights={state.weights} onAdd={(w)=>setState(prev=>({...prev, weights:[w, ...prev.weights]}))}/>
        )}
      </div>

      <SideSheet open={sheetOpen} onClose={()=>setSheetOpen(false)}>
        <div style={{fontWeight:800, marginBottom:8}}>רשימת קניות</div>
        <div className="muted">(ממשק רשימת קניות יכנס כאן)</div>
      </SideSheet>

      <ConfirmModal
        open={confirm.open}
        title="אישור מחיקה"
        message="למחוק את השבוע הזה?"
        onYes={()=>setConfirm(c=>({...c, deleted:true}))}
        onNo={()=>setConfirm({open:false})}
        showDeleted={!!confirm.deleted}
      />

      <BottomNav tab={tab} setTab={setTab}/>
    </div>
  );
}
