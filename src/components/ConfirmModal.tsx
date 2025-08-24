import React from 'react';


export default function ConfirmModal({ open, title, message, onYes, onNo, showDeleted }:{ open:boolean; title:string; message:string; onYes:()=>void; onNo:()=>void; showDeleted?:boolean }){
if(!open) return null;
return (
<>
<div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.25)', zIndex:1200 }} />
<div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#fff', borderRadius:16, padding:16, width:320, zIndex:1201, boxShadow:'0 8px 24px rgba(0,0,0,.2)' }}>
<div style={{ fontWeight:800, marginBottom:8 }}>{title}</div>
<div style={{ marginBottom:12 }}>{message}</div>
{showDeleted && <div style={{ marginBottom:8, color:'#065f46', fontWeight:700 }}>הושלם: השבוע נמחק.</div>}
<div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
<button className="btn" onClick={onYes}>כן</button>
<button className="btn-danger" onClick={onNo}>לא</button>
</div>
</div>
</>
);
}