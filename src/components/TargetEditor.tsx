import React, { useEffect, useState } from 'react';
import type { Targets } from '../types';


export default function TargetEditor({ initial, onSave }:{ initial:Targets; onSave:(t:Targets)=>void }){
const [cal,setCal] = useState(String(initial.calories||0));
const [pro,setPro] = useState(String(initial.protein||0));
useEffect(()=>{ setCal(String(initial.calories||0)); setPro(String(initial.protein||0)); },[initial.calories,initial.protein]);
return (
<div style={{display:'grid',gap:8}}>
<div style={{fontWeight:700}}>יעדים יומיים</div>
<div className="grid2">
<label style={{display:'grid',gap:6}}><span>קלוריות</span><input className="input" inputMode="numeric" value={cal} onChange={e=>setCal(e.target.value)}/></label>
<label style={{display:'grid',gap:6}}><span>חלבון (גרם)</span><input className="input" inputMode="numeric" value={pro} onChange={e=>setPro(e.target.value)}/></label>
</div>
<button className="btn" onClick={()=>onSave({ calories: Math.max(0, Number(cal)||0), protein: Math.max(0, Number(pro)||0) })}>שמור יעדים</button>
</div>
);
}