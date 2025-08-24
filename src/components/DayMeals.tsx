import React from 'react';
import type { MealEntry, Targets } from '../types';

const OPTIONS = ['ארוחת בוקר','צהריים','ביניים','ביניים 2','ערב'];

export default function DayMeals({
  dateISO, meals, totals, targets, onChangeDate, onAdd, onDelete
}:{
  dateISO:string;
  meals:MealEntry[];
  totals:{calories:number; protein:number};
  targets:Targets;
  onChangeDate:(d:string)=>void;
  onAdd:(m:MealEntry)=>void;
  onDelete:(id:string)=>void;
}){
  const [slot,setSlot] = React.useState<string>('ארוחת בוקר');
  const [cal,setCal] = React.useState('');
  const [pro,setPro] = React.useState('');

  const add=()=>{
    const c=Number(cal)||0, p=Number(pro)||0; if(!slot && c===0 && p===0) return;
    onAdd({ id: crypto.randomUUID?.()||Math.random().toString(36).slice(2), dateISO, name: slot, calories:Math.max(0,c), protein:Math.max(0,p) });
    setCal(''); setPro('');
  };

  const move = (days:number)=>{
    const d = new Date(dateISO); d.setDate(d.getDate()+days);
    const iso = new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
    onChangeDate(iso);
  };

  return (
    <div style={{display:'grid',gap:10}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <button className="btn" onClick={()=>move(-1)} aria-label="יום קודם">←</button>
        <div style={{fontWeight:800}}>ארוחות ל-{dateISO}</div>
        <button className="btn" onClick={()=>move(1)} aria-label="יום הבא">→</button>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
        <div>סה״כ קלוריות {totals.calories} מתוך יעד {targets.calories}</div>
        <div>סה״כ חלבון {totals.protein} מתוך יעד {targets.protein}</div>
      </div>

      <div className="grid2">
        <select className="input" value={slot} onChange={e=>setSlot(e.target.value)}>
          {OPTIONS.map(o=> <option key={o} value={o}>{o}</option>)}
        </select>
        <input className="input" placeholder="קלוריות" inputMode="numeric" value={cal} onChange={e=>setCal(e.target.value)} />
      </div>
      <div className="grid2">
        <input className="input" placeholder="חלבון (גרם)" inputMode="numeric" value={pro} onChange={e=>setPro(e.target.value)} />
        <button className="btn" onClick={add}>הוסף ארוחה</button>
      </div>

      <div style={{display:'grid',gap:8}}>
        {meals.length===0 && <div className="muted" style={{textAlign:'center'}}>אין ארוחות ביום זה</div>}
        {meals.map(item=> (
          <div key={item.id} className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700}}>{item.name}</div>
              <div className="muted">קל׳ {item.calories} • חלבון {item.protein}g</div>
            </div>
            <button className="btn-danger" onClick={()=>onDelete(item.id)}>מחק</button>
          </div>
        ))}
      </div>
    </div>
  );
}
