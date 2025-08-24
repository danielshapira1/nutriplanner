import React, { useEffect, useState } from 'react';
import type { Targets } from '../types';

export default function TargetEditor({ initial, totals, onSave }:{
  initial:Targets; totals?:{calories:number; protein:number}; onSave:(t:Targets)=>void
}){
  const [editing, setEditing] = useState(false);
  const [cal,setCal] = useState(String(initial.calories||0));
  const [pro,setPro] = useState(String(initial.protein||0));

  useEffect(()=>{ if(!editing){ setCal(String(initial.calories||0)); setPro(String(initial.protein||0)); }},[initial.calories,initial.protein,editing]);

  const calN = Math.max(0, Number(cal)||0);
  const proN = Math.max(0, Number(pro)||0);

  if (!editing) {
    return (
      <div style={{display:'grid',gap:8}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontWeight:800}}>יעדים יומיים</div>
          <button className="btn" onClick={()=>setEditing(true)}>עריכה</button>
        </div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <div>קלוריות – <b>{calN}</b></div>
          <div>חלבון – <b>{proN}</b></div>
        </div>
        {totals && (
          <div className="muted" style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            <div>סה״כ קלוריות {totals.calories} מתוך יעד {calN}</div>
            <div>סה״כ חלבון {totals.protein} מתוך יעד {proN}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{display:'grid',gap:8}}>
      <div style={{fontWeight:800}}>עריכת יעדים</div>
      <div className="grid2">
        <label style={{display:'grid',gap:6}}>
          <span>קלוריות</span>
          <input className="input" inputMode="numeric" value={cal} onChange={e=>setCal(e.target.value)} />
        </label>
        <label style={{display:'grid',gap:6}}>
          <span>חלבון (גרם)</span>
          <input className="input" inputMode="numeric" value={pro} onChange={e=>setPro(e.target.value)} />
        </label>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button className="btn" onClick={()=>{ onSave({ calories: calN, protein: proN }); setEditing(false); }}>שמור</button>
        <button className="btn-danger" onClick={()=>{ setEditing(false); }}>בטל</button>
      </div>
    </div>
  );
}
