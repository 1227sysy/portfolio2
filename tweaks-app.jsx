/* Tweaks app — applies live tweaks to the vanilla page + renders the panel */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#FF7E5F",
  "heroScale": 1,
  "motion": "full",
  "grid": true
}/*EDITMODE-END*/;

/* hex helpers */
function clamp255(n){ return Math.max(0, Math.min(255, Math.round(n))); }
function hexToRgb(h){
  h = h.replace("#","");
  if(h.length===3) h = h.split("").map(c=>c+c).join("");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function darken(hex, dl){
  let [r,g,b] = hexToRgb(hex).map(v=>v/255);
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h, s, l=(max+min)/2;
  if(max===min){ h=0; s=0; }
  else{
    const d=max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    if(max===r) h=(g-b)/d+(g<b?6:0);
    else if(max===g) h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h/=6;
  }
  l = Math.max(0, l-dl);
  s = Math.min(1, s*1.06);
  const hue2rgb=(p,q,t)=>{ if(t<0)t+=1; if(t>1)t-=1;
    if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
  let R,G,B;
  if(s===0){ R=G=B=l; }
  else{ const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
    R=hue2rgb(p,q,h+1/3); G=hue2rgb(p,q,h); B=hue2rgb(p,q,h-1/3); }
  return "#" + [R,G,B].map(v=>clamp255(v*255).toString(16).padStart(2,"0")).join("");
}
function rgba(hex, a){
  const [r,g,b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function applyTweaks(t){
  const r = document.documentElement;
  r.style.setProperty("--accent", t.accent);
  r.style.setProperty("--accent-deep", darken(t.accent, 0.1));
  r.style.setProperty("--accent-soft", rgba(t.accent, 0.12));
  r.style.setProperty("--hero-scale", t.heroScale);
  r.setAttribute("data-motion", t.motion);
  r.setAttribute("data-grid", t.grid ? "on" : "off");
  if(window.__motion) window.__motion.setMode(t.motion);
}

function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(()=>{ applyTweaks(t); }, [t]);
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Brand" />
      <TweakColor label="Accent" value={t.accent}
        options={["#FF7E5F","#2A6FDB","#1F8A5B","#7A5AE0"]}
        onChange={(v)=>setTweak("accent", v)} />
      <TweakSection label="Hero" />
      <TweakSlider label="Headline size" value={t.heroScale} min={0.8} max={1.25} step={0.05} unit="×"
        onChange={(v)=>setTweak("heroScale", v)} />
      <TweakToggle label="Background grid" value={t.grid}
        onChange={(v)=>setTweak("grid", v)} />
      <TweakSection label="Motion" />
      <TweakRadio label="Animation" value={t.motion} options={["full","calm"]}
        onChange={(v)=>setTweak("motion", v)} />
    </TweaksPanel>
  );
}

/* apply persisted tweaks immediately (before edit mode is ever opened) */
try{
  const saved = JSON.parse(localStorage.getItem("__tweaks__") || "null");
  applyTweaks(Object.assign({}, TWEAK_DEFAULTS, saved || {}));
}catch(e){ applyTweaks(TWEAK_DEFAULTS); }

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<App />);
