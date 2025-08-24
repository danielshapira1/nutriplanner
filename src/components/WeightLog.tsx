import React, { useState } from 'react';
import type { WeightEntry } from '../types';


const toDateISO = (d:Date)=> new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);


export default function WeightLog({ weights, onAdd }:{ weights:WeightEntry[]; onAdd:(w:WeightEntry)=>void }){
const [dateISO,setDateISO]=useState<string>(toDateISO(new Date()));
const [w,setW]=useState('');
const sorted=[...weights].sort((a,b)=> a.dateISO<b.dateISO?1:-1);
const add=()=>{ const x=Number(w); if(!dateISO || !isFinite(x) || x<=0) return; onAdd({ id: crypto.randomUUID?.()||Math.random().toString(36).slice(2), dateISO, weightKg: Math.round(x*10)/10 }); setW(''); };
return (
<div style={{display:'grid',gap:12}}>
<div className="card" style={{display:'grid',gap:8}}>
<div style={{fontWeight:700}}>הוספת שקילה</div>
<div className="grid2">
<label style={{display:'grid',gap:6}}><span>תאריך</span><input className="input" type="date" value={dateISO} onChange={e=>setDateISO(e.target.value)} /></label>
<label style={{display:'grid',gap:6}}><span>משקל (ק"ג)</span><input className="input" inputMode="decimal" placeholder="לדוג׳ 72.5" value={w} onChange={e=>setW(e.target.value)} /></label>
</div>
<button className="btn" onClick={add}>שמור שקילה</button>
</div>
<div className="card">
<div style={{fontWeight:700, marginBottom:8}}>היסטוריית שקילות</div>
{sorted.length===0 && <div className="muted">אין נתונים עדיין.</div>}
<div style={{display:'grid',gap:6}}>
{sorted.map(it=> (
<div key={it.id} style={{display:'flex',justifyContent:'space-between'}}>
<div>{it.dateISO}</div><div>{it.weightKg} ק"ג</div>
</div>
))}
</div>
</div>
</div>
);
}