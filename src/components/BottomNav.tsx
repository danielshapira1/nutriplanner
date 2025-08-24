import React from 'react';
import type { TabKey } from '../types';

export default function BottomNav({ tab, setTab }:{ tab:TabKey; setTab:(t:TabKey)=>void }){
  return (
    <nav className="bottom">
      <div className="bottom-grid">
        <button className={`navbtn${tab==='calendar'?' navbtn-primary':''}`} onClick={()=>setTab('calendar')} title="תכנון ארוחות">
          📅<div style={{fontSize:12}}>תכנון ארוחות</div>
        </button>
        <button className={`navbtn${tab==='home'?' navbtn-primary':''}`} onClick={()=>setTab('home')} title="בית">
          🏠<div style={{fontSize:12}}>בית</div>
        </button>
        <button className={`navbtn${tab==='weight'?' navbtn-primary':''}`} onClick={()=>setTab('weight')} title="משקל">
          ⚖️<div style={{fontSize:12}}>משקל</div>
        </button>
      </div>
    </nav>
  );
}
