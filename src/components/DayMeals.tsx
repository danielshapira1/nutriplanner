import React from 'react';
import type { MealEntry, Targets } from '../types';
import { upsertMealTemplate, searchMealTemplates } from '../lib/persist';

const OPTIONS = ['', 'ארוחת בוקר','צהריים','ביניים','ביניים 2','ערב'];

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
  const [title,setTitle] = React.useState('');
  const [slot,setSlot] = React.useState<string>('');
  const [cal,setCal] = React.useState('');
  const [pro,setPro] = React.useState('');
  const [openList, setOpenList] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<{name:string; calories:number; protein:number}[]>([]);

  const inputRef = React.useRef<HTMLInputElement|null>(null);
  const boxRef = React.useRef<HTMLDivElement|null>(null);

  React.useEffect(()=> {
    // סגירה בלחיצה מחוץ לרשימה
    function onDocClick(e: MouseEvent){
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpenList(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return ()=> document.removeEventListener('mousedown', onDocClick);
  }, []);

  const refreshSuggestions = (val: string) => {
    if (!val.trim()) {
      setSuggestions([]);
      setOpenList(false);
      return;
    }
    const list = searchMealTemplates(val, 10);
    setSuggestions(list.map(t => ({ name: t.name, calories: t.calories, protein: t.protein })));
    setOpenList(list.length > 0);
  };

  const add=()=>{
    const c=Number(cal)||0, p=Number(pro)||0;
    if(!slot && !title && c===0 && p===0) return;

    // שמירת תבנית לשימוש עתידי (שם + ערכים)
    if (title.trim()) {
      upsertMealTemplate(title.trim(), Math.max(0,c), Math.max(0,p));
    }

    onAdd({
      id: crypto.randomUUID?.()||Math.random().toString(36).slice(2),
      dateISO,
      name: title ? `${slot ? slot+' – ' : ''}${title}` : (slot || 'ללא שם'),
      calories:Math.max(0,c),
      protein:Math.max(0,p)
    });

    // לאפס הכל
    setTitle('');
    setSlot('');
    setCal('');
    setPro('');
    setSuggestions([]);
    setOpenList(false);
    // להשיב פוקוס לשם הארוחה
    inputRef.current?.focus();
  };

  const move = (days:number)=>{
    const d = new Date(dateISO); d.setDate(d.getDate()+days);
    const iso = new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
    onChangeDate(iso);
  };

  const pickSuggestion = (name:string, calories:number, protein:number)=>{
    setTitle(name);
    setCal(String(calories||''));
    setPro(String(protein||''));
    setOpenList(false);
    // השארת סוג הארוחה כפי שנבחר / נשאר
  };

  return (
    <div style={{display:'grid',gap:10}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <button className="btn" onClick={()=>move(1)} aria-label="יום הבא">→</button>
        <div style={{fontWeight:800}}>ארוחות ל-{dateISO}</div>
        <button className="btn" onClick={()=>move(-1)} aria-label="יום קודם">←</button>
      </div>

      {/* שורת שם + סוג עם אוטוקאמליט */}
      <div ref={boxRef} style={{position:'relative'}}>
        <div className="grid2">
          <input
            ref={inputRef}
            className="input"
            placeholder="שם הארוחה (למשל: חטיף חלבון)"
            value={title}
            onChange={e=>{ setTitle(e.target.value); refreshSuggestions(e.target.value); }}
            onFocus={()=> refreshSuggestions(title)}
            autoComplete="off"
          />
          <select className="input" value={slot} onChange={e=>setSlot(e.target.value)}>
            {OPTIONS.map(o=> <option key={o || 'placeholder'} value={o}>{o || 'בחר סוג ארוחה'}</option>)}
          </select>
        </div>

        {/* רשימת ההצעות */}
        {openList && suggestions.length>0 && (
          <div className="autocomplete-list">
            {suggestions.map((s, idx)=>(
              <button
                key={s.name + idx}
                className="autocomplete-item"
                onClick={()=>pickSuggestion(s.name, s.calories, s.protein)}
                title={`${s.name} · קל׳ ${s.calories} · חלבון ${s.protein}g`}
              >
                <div className="auto-name">{s.name}</div>
                <div className="auto-info">קל׳ {s.calories} · חלבון {s.protein}g</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* קלוריות/חלבון */}
      <div className="grid2">
        <input className="input" placeholder="קלוריות" inputMode="numeric" value={cal} onChange={e=>setCal(e.target.value)} />
        <input className="input" placeholder="חלבון (גרם)" inputMode="numeric" value={pro} onChange={e=>setPro(e.target.value)} />
      </div>

      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button className="btn" onClick={add}>הוסף ארוחה</button>
      </div>

      <div style={{display:'grid',gap:8}}>
        {meals.length===0 && <div className="muted" style={{textAlign:'center'}}>אין ארוחות ביום זה</div>}
        {meals.map(item=> (
          <div key={item.id} className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700}}>{item.name}</div>
              <div className="muted">קל׳ {item.calories} · חלבון {item.protein}g</div>
            </div>
            <button className="btn-danger" onClick={()=>onDelete(item.id)}>מחק</button>
          </div>
        ))}
      </div>
    </div>
  );
}
