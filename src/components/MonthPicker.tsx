import React from 'react';

function toISO(d:Date){ return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); }

export default function MonthPicker({ value, onChange }:{ value:string; onChange:(v:string)=>void }){
  const cur = new Date(value);
  const [year,setYear] = React.useState(cur.getFullYear());
  const [month,setMonth] = React.useState(cur.getMonth()); // 0-11

  const first = new Date(year, month, 1);
  const start = new Date(first); start.setDate(1 - ((first.getDay()+6)%7)); // start Sunday (ISO)
  const weeks:Date[][] = [];
  let d = new Date(start);
  for(let w=0; w<6; w++){
    const row:Date[]=[]; for(let i=0;i<7;i++){ row.push(new Date(d)); d.setDate(d.getDate()+1); }
    weeks.push(row);
  }

  const isSame = (a:Date,b:Date)=> a.toDateString()===b.toDateString();
  const selected = new Date(value);

  const changeMonth = (delta:number)=>{ let m = month+delta, y=year; if(m<0){m=11; y--;} if(m>11){m=0; y++;} setMonth(m); setYear(y); };

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
        <button className="btn" onClick={()=>changeMonth(-1)}>←</button>
        <div style={{fontWeight:700}}>{year}/{month+1}</div>
        <button className="btn" onClick={()=>changeMonth(1)}>→</button>
      </div>
      <div className="grid7" style={{gridTemplateColumns:'repeat(7,1fr)'}}>
        {['א','ב','ג','ד','ה','ו','ש'].map(h=> <div key={h} style={{textAlign:'center',fontWeight:700}}>{h}</div>)}
        {weeks.flat().map((day,idx)=>{
          const inMonth = day.getMonth()===month;
          const sel = isSame(day, selected);
          return (
            <button key={idx} className="input" onClick={()=>onChange(toISO(day))}
                    style={{opacity:inMonth?1:.5, background: sel? '#FFD1DC':'#fff'}}>
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
