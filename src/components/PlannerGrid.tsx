import React from 'react';
import type { WeeklyPlan, DayKey, MealType } from '../types';

const dayLabels:Record<DayKey,string> = { sun:'א׳', mon:'ב׳', tue:'ג׳', wed:'ד׳', thu:'ה׳', fri:'ו׳', sat:'ש׳' };
const dayKeys:DayKey[] = ['sun','mon','tue','wed','thu','fri','sat'];
const slots: { key:MealType; label:string }[] = [
  { key:'breakfast', label:'בוקר' },
  { key:'lunch', label:'צהריים' },
  { key:'snack1', label:'ביניים' },
  { key:'snack2', label:'ביניים 2' },
  { key:'dinner', label:'ערב' },
];

export type PlannerMode = 'view' | 'edit';

export default function PlannerGrid({
  plan, mode, onChange, onCellClick
}:{
  plan:WeeklyPlan;
  mode:PlannerMode;
  onChange:(d:DayKey, slot:MealType, text:string)=>void;
  onCellClick?:(d:DayKey, slot:MealType, text:string)=>void;
}){
  return (
    <div className="card" style={{overflowX:'auto'}}>
      <div className="grid7" style={{marginBottom:6, minWidth:720}}>
        <div />
        {dayKeys.map(d=> <div key={d} style={{textAlign:'center',fontWeight:700}}>{dayLabels[d]}</div>)}
      </div>
      {slots.map(slot=> (
        <div key={slot.key} className="grid7" style={{alignItems:'stretch',marginBottom:6, minWidth:720}}>
          <div style={{display:'flex',alignItems:'center',fontWeight:600}}>{slot.label}</div>
          {dayKeys.map(d=>{
            const value = plan.days[d]?.[slot.key] ?? '';
            if (mode === 'edit') {
              return (
                <input
                  key={d+slot.key}
                  className="input"
                  value={value}
                  placeholder="רשום..."
                  onChange={e=>onChange(d, slot.key, e.target.value)}
                />
              );
            }
            return (
              <button
                key={d+slot.key}
                className="input"
                style={{textAlign:'right', background:'#fff', cursor:'pointer', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}
                onClick={()=> onCellClick && onCellClick(d, slot.key, value)}
                title={value}
              >{value}</button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
