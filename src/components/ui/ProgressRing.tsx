"use client";
interface ProgressRingProps { done: number; goal: number; color: string; size?: number; stroke?: number; showLabel?: boolean; label?: string; }
export default function ProgressRing({ done, goal, color, size=60, stroke=7, showLabel=true, label }: ProgressRingProps) {
  const cx=size/2, cy=size/2, r=(size-stroke)/2;
  const C=2*Math.PI*r, pct=goal>0?Math.min(done/goal,1):0;
  const fill=C*pct, gap=C-fill, offset=C*0.25;
  const fs=size<80?13:24;
  return (
    <div style={{position:"relative",width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${done} de ${goal}${label?` — ${label}`:""}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(122,104,78,0.22)" strokeWidth={stroke}/>
        {done>0&&<circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${fill.toFixed(2)} ${gap.toFixed(2)}`} strokeDashoffset={offset.toFixed(2)}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
          style={{filter:`drop-shadow(0 0 5px ${color}55)`,transition:"stroke-dasharray 0.7s cubic-bezier(.22,.61,.36,1)"}}/>}
      </svg>
      {showLabel&&(
        <div style={{position:"absolute",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center"}}>
          <span className="font-stat" style={{fontSize:fs,fontWeight:500,color:"var(--color-text-primary)",lineHeight:1,letterSpacing:"-0.5px"}}>{done}<span style={{color:"var(--color-text-secondary)",fontSize:fs*0.6}}>/{goal}</span></span>
          {label&&<span style={{fontSize:9,color:"var(--color-text-secondary)",marginTop:3,letterSpacing:"0.5px"}}>{label}</span>}
        </div>
      )}
    </div>
  );
}
