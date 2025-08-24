import React from 'react';


export default function Header({ onOpenSheet }:{ onOpenSheet: ()=>void }){
return (
<div className="header">
<div className="header-title">NutriPlanner</div>
<button className="btn" style={{ background:'var(--accent3)', padding:'6px 10px' }} onClick={onOpenSheet}>☰</button>
</div>
);
}