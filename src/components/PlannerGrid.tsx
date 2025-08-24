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


export default function PlannerGrid({ plan, onChange }:{ plan:WeeklyPlan; onChange:(d:DayKey, slot:MealType, text:string)=>void }){
return (
<div className="card">
<div className="grid7" style={{marginBottom:6}}>
<div />
{dayKeys.map(d=> <div key={d} style={{textAlign:'center',fontWeight:700}}>{dayLabels[d]}</div>)}
</div>
{slots.map(slot=> (
<div key={slot.key} className="grid7" style={{alignItems:'stretch',marginBottom:6}}>
<div style={{display:'flex',alignItems:'center',fontWeight:600}}>{slot.label}</div>
{dayKeys.map(d=> (
<input key={d+slot.key} className="input" value={plan.days[d]?.[slot.key]??''} placeholder="רשום..." onChange={e=>onChange(d, slot.key, e.target.value)} />
))}
</div>
))}
</div>
);
}