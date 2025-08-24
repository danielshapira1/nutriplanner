import React from 'react';

export default function Bubble({
  open, title, text, onClose, onSave
}:{ open:boolean; title:string; text:string; onClose:()=>void; onSave:(t:string)=>void }){
  const [value,setValue] = React.useState(text);
  React.useEffect(()=> setValue(text), [text]);
  if(!open) return null;
  return (
    <>
      <div className="popover-dim" onClick={onClose} />
      <div className="popover">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontWeight:800}}>{title}</div>
          <button className="btn-danger" onClick={onClose}>סגור</button>
        </div>
        <textarea className="input" rows={6} value={value} onChange={e=>setValue(e.target.value)} />
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
          <button className="btn" onClick={()=>onSave(value)}>שמור</button>
        </div>
      </div>
    </>
  );
}
