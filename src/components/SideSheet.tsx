import React from 'react';


export default function SideSheet({ open, onClose, children }:{ open:boolean; onClose:()=>void; children:React.ReactNode }){
if(!open) return null;
return (
<>
<div className="sheet-dim" onClick={onClose} />
<div className="sheet">{children}</div>
</>
);
}