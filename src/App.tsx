import React, { useEffect, useMemo, useState } from 'react';
import type { PersistShape, MealEntry, Targets, DayKey, MealType, TabKey, WeeklyPlan } from './types';
import { toDateISO, sundayOfWeek } from './lib/dates';
import { loadState, saveState } from './lib/persist';
import { getOrCreatePlan, setPlanText } from './lib/planner';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import TargetEditor from './components/TargetEditor';
import PlannerGrid, { PlannerMode } from './components/PlannerGrid';
import SideSheet from './components/SideSheet';
import ConfirmModal from './components/ConfirmModal';
import WeightLog from './components/WeightLog';
import DayMeals from './components/DayMeals';
import Bubble from './components/Bubble';

const dayKeys:DayKey[] = ['sun','mon','tue','wed','thu','fri','sat'];

function getTotalsForDate(state:PersistShape, dateISO:string){
  const list = state.meals.filter(m=>m.dateISO===dateISO);
  const calories = list.reduce((s,m)=> s + (Number(m.calories)||0), 0);
  const protein  = list.reduce((s,m)=> s + (Number(m.protein)||0), 0);
  return { calories, protein };
}

export default function App(): JSX.Element{
  const [state,setState] = useState<PersistShape>(()=>loadState());
  useEffect(()=>saveState(state),[state]);

  const [tab,setTab] = useState<TabKey>('home');
  const [dateISO,setDateISO] = useState<string>(toDateISO(new Date()));
  const weekStartISO = toDateISO(sundayOfWeek(new Date(dateISO)));
  const [sheetOpen,setSheetOpen] = useState(false);

  const [confirm,setConfirm] = useState<{open:boolean; week?:string; deleted?:boolean}>({open:false});
  const [plannerMode,setPlannerMode] = useState<PlannerMode>('view');
  const [bubble,setBubble] = useState<null | {d:DayKey; slot:MealType; text:string}>(null);
  const [editingWeek,setEditingWeek] = useState<string|null>(null);

  const targets = state.targetsByDate[dateISO] || { calories:0, protein:0 };
  const dayMeals = useMemo(()=> state.meals.filter(m=>m.dateISO===dateISO), [state.meals, dateISO]);
  const totals = useMemo(()=> getTotalsForDate(state, dateISO), [state, dateISO]);
  const plan = useMemo(()=> getOrCreatePlan(state, weekStartISO), [state, weekStartISO]);

  // meals
  const saveTargets = (t:Targets)=> setState(prev=> ({ ...prev, targetsByDate: { ...prev.targetsByDate, [dateISO]: { ...t } } }));
  const addMeal = (m:MealEntry)=> setState(prev=> ({ ...prev, meals: [m, ...prev.meals] }));
  const delMeal = (id:string)=> setState(prev=> ({ ...prev, meals: prev.meals.filter(x=>x.id!==id) }));

  // planner
  const onPlanChange = (d:DayKey, slot:MealType, text:string)=> setState(prev=>{
    const next=structuredClone(prev);
    setPlanText(next, weekStartISO, d, slot, text);
    return next;
  });
  const openDeleteWeek = (week:string)=> setConfirm({ open:true, week, deleted:false });
  const confirmYes = ()=> { if(!confirm.week) return;
    setState(prev=> ({ ...prev, plans: prev.plans.filter(p=>p.weekStartISO!==confirm.week) }));
    setConfirm(c=>({ ...c, deleted:true }));
  };
  const confirmNo = ()=> setConfirm({ open:false, week:undefined, deleted:false });

  // bubble
  const onCellClick = (d:DayKey, slot:MealType, text:string)=> setBubble({ d, slot, text });
  const saveBubble = (text:string)=>{ if(!bubble) return; onPlanChange(bubble.d, bubble.slot, text); setBubble(null); };

  // history (weeks before current)
  const historyWeeks = [...state.plans]
    .filter(p=> p.weekStartISO < weekStartISO)
    .sort((a,b)=> a.weekStartISO < b.weekStartISO ? 1 : -1);

  return (
    <div>
      <Header onOpenSheet={()=>setSheetOpen(true)} />

      <div className="content">
        {/* בית: ארוחות יומיות + ניווט ימים */}
        {tab==='home' && (
          <div className="card" style={{display:'grid',gap:10}}>
            <TargetEditor initial={targets} onSave={saveTargets}/>
            <DayMeals
              dateISO={dateISO}
              meals={dayMeals}
              totals={totals}
              targets={targets}
              onChangeDate={setDateISO}
              onAdd={addMeal}
              onDelete={delMeal}
            />
          </div>
        )}

        {/* לוח שנה: הפלנר השבועי + היסטוריה */}
        {tab==='calendar' && (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:800,fontSize:16}}>פלנר שבועי (א׳–ש׳) – מתחיל ב-{weekStartISO}</div>
              <div style={{display:'flex',gap:8}}>
                {plannerMode==='view'
                  ? <button className="btn" onClick={()=>setPlannerMode('edit')}>ערוך את כל הארוחות</button>
                  : <button className="btn" onClick={()=>setPlannerMode('view')}>שמור</button>}
              </div>
            </div>

            <PlannerGrid plan={plan} mode={plannerMode} onChange={onPlanChange} onCellClick={onCellClick} />

            <div className="card" style={{marginTop:8}}>
              <div style={{fontWeight:800, marginBottom:8}}>היסטוריית תכנון ארוחות</div>
              {historyWeeks.length===0 && <div className="muted">אין היסטוריה עדיין.</div>}
              <div style={{display:'grid', gap:8}}>
                {historyWeeks.map(p=> (
                  <div key={p.weekStartISO} className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div><b>שבוע שמתחיל ב-</b>{p.weekStartISO}</div>
                    <div style={{display:'flex',gap:8}}>
                      <button className="btn" onClick={()=> setEditingWeek(p.weekStartISO)}>פתח</button>
                      <button className="btn-danger" onClick={()=> openDeleteWeek(p.weekStartISO)}>מחק</button>
                    </div>
                  </div>
                ))}
              </div>

              {editingWeek && (
                <div style={{marginTop:8}}>
                  <div style={{fontWeight:800}}>עריכת שבוע: {editingWeek}</div>
                  <PlannerGrid
                    plan={state.plans.find(w=>w.weekStartISO===editingWeek)!}
                    mode="edit"
                    onChange={(d,s,text)=> setState(prev=>{
                      const next=structuredClone(prev);
                      setPlanText(next, editingWeek, d, s, text);
                      return next;
                    })}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {tab==='weight' && (
          <WeightLog
            weights={state.weights}
            onAdd={(w)=>setState(prev=> ({...prev, weights:[w, ...prev.weights]}))}
          />
        )}
      </div>

      <SideSheet open={sheetOpen} onClose={()=>setSheetOpen(false)}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontSize:18,fontWeight:800}}>רשימת קניות</div>
          <button
            className="btn"
            onClick={()=> setState(prev=> ({
              ...prev,
              shopping: [{ id: crypto.randomUUID?.()||Math.random().toString(36).slice(2), text:'', done:false }, ...prev.shopping]
            }))}>
            הוסף פריט
          </button>
        </div>
        {state.shopping.length===0 && <div className="muted">התחל להוסיף פריטים…</div>}
        <div style={{display:'grid',gap:8}}>
          {state.shopping.map(item=> (
            <div key={item.id} style={{display:'flex',alignItems:'center',gap:8}}>
              <button
                onClick={()=> setState(prev=> ({...prev, shopping: prev.shopping.map(it=> it.id===item.id? {...it, done:!it.done}: it)}))}
                style={{ width:22, height:22, borderRadius:11, border:'1px solid #888', background:item.done?'#111827':'transparent', color:item.done?'#fff':'#111', cursor:'pointer' }}>
                {item.done?'✓':''}
              </button>
              <input
                className="input" style={{borderRadius:0,borderLeft:0,borderRight:0}} placeholder="פריט לקנייה"
                value={item.text}
                onChange={e=> setState(prev=> ({...prev, shopping: prev.shopping.map(it=> it.id===item.id? {...it, text:e.target.value}: it)}))}
              />
              <button className="btn-danger" onClick={()=> setState(prev=> ({...prev, shopping: prev.shopping.filter(it=> it.id!==item.id)}))}>מחק</button>
            </div>
          ))}
        </div>
      </SideSheet>

      <ConfirmModal
        open={confirm.open}
        title="אישור מחיקה"
        message="למחוק את השבוע הזה?"
        onYes={confirmYes}
        onNo={confirmNo}
        showDeleted={!!confirm.deleted}
      />

      <Bubble
        open={!!bubble}
        title="פרטי ארוחה"
        text={bubble?.text||''}
        onClose={()=>setBubble(null)}
        onSave={saveBubble}
      />

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
