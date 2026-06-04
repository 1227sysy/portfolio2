/* =========================================================
   Motion v2 — reveal, parallax, mouse glow, count-up, magnetic
   ========================================================= */
(function(){
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lerp = (a,b,t)=>a+(b-a)*t;

  /* ---------- nav background ---------- */
  const nav = document.querySelector(".nav");
  const onScroll = ()=>{ nav && nav.classList.toggle("scrolled", window.scrollY > 24); };
  onScroll(); window.addEventListener("scroll", onScroll, {passive:true});

  /* ---------- count-up ---------- */
  function fmt(v, el){
    const dec = el.dataset.dec ? parseInt(el.dataset.dec,10) : 0;
    const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const num = dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US");
    return pre + num + suf;
  }
  function countUp(el){
    if(el.dataset.counted) return; el.dataset.counted = "1";
    const target = parseFloat(el.dataset.count); const dur = 1400; const start = performance.now();
    let finished = false;
    function step(now){
      const p = Math.min(1,(now-start)/dur), e = 1-Math.pow(1-p,3);
      el.textContent = fmt(target*e, el);
      if(p<1 && !finished) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    setTimeout(()=>{ finished=true; el.textContent = fmt(target, el); }, dur+450);
  }

  /* ---------- reveal (IO + sweep + failsafe) ---------- */
  const reveal = el => {
    el.classList.add("in");
    el.querySelectorAll("[data-count]").forEach(countUp);
    if(el.matches && el.matches("[data-count]")) countUp(el);
  };
  const io = new IntersectionObserver((es)=>{
    es.forEach(e=>{ if(e.isIntersecting){ reveal(e.target); io.unobserve(e.target); } });
  },{threshold:.12, rootMargin:"0px 0px -6% 0px"});
  const revealEls = [...document.querySelectorAll("[data-reveal]")];
  const vh = ()=> window.innerHeight || document.documentElement.clientHeight;
  document.querySelector(".hero") && document.querySelector(".hero").classList.add("in");
  revealEls.forEach(el=>{
    const r = el.getBoundingClientRect();
    if(r.top < vh()*0.92 && r.bottom > 0) reveal(el); else io.observe(el);
  });
  setTimeout(()=>revealEls.forEach(reveal), 1700);

  if(reduce) return;

  /* ---------- mouse glow + parallax ---------- */
  const hero = document.querySelector(".hero");
  const glow = document.querySelector(".glow");
  const floats = [...document.querySelectorAll(".stage .float")];
  let mx=.68, my=.32, tx=.68, ty=.32, raf=null;
  let parallaxOn = document.documentElement.getAttribute("data-motion") !== "calm";

  function pointer(e){
    if(!parallaxOn || !hero) return;
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left)/r.width; ty = (e.clientY - r.top)/r.height;
    if(!raf) raf = requestAnimationFrame(tick);
  }
  function tick(){
    mx = lerp(mx,tx,.08); my = lerp(my,ty,.08);
    if(glow){ glow.style.setProperty("--gx",(mx*100)+"%"); glow.style.setProperty("--gy",(my*100)+"%"); }
    const dx=(mx-.5), dy=(my-.5);
    floats.forEach(f=>{ const d=parseFloat(f.dataset.depth||"1"); f.style.transform=`translate(${dx*d*-28}px,${dy*d*-24}px)`; });
    if(Math.abs(mx-tx)>.001 || Math.abs(my-ty)>.001) raf=requestAnimationFrame(tick); else raf=null;
  }
  if(hero){
    hero.addEventListener("pointermove", pointer);
    hero.addEventListener("pointerleave", ()=>{ tx=.68; ty=.32; if(!raf) raf=requestAnimationFrame(tick); });
  }

  /* idle bob (uses `translate` so it composes with parallax `transform`) */
  const floatAnims = floats.map((f,i)=>
    f.animate([{translate:"0 0"},{translate:`0 ${(i%2?-1:1)*9}px`}],
      {duration:3800+i*420, direction:"alternate", iterations:Infinity, easing:"cubic-bezier(.45,0,.55,1)"})
  );

  window.__motion = {
    setMode(m){
      parallaxOn = m !== "calm";
      floatAnims.forEach(a => m==="calm" ? a.pause() : a.play());
      if(m==="calm") floats.forEach(f => f.style.transform = "");
    }
  };

  /* ---------- magnetic buttons ---------- */
  document.querySelectorAll("[data-magnetic]").forEach(btn=>{
    let r=null;
    btn.addEventListener("pointerenter",()=>{ r=btn.getBoundingClientRect(); });
    btn.addEventListener("pointermove",(e)=>{ if(!r) r=btn.getBoundingClientRect();
      const x=(e.clientX-r.left-r.width/2), y=(e.clientY-r.top-r.height/2);
      btn.style.transform=`translate(${x*.28}px,${y*.4}px)`; });
    btn.addEventListener("pointerleave",()=>{ btn.style.transform=""; });
  });

  /* ---------- scroll indicator fade ---------- */
  const ind = document.querySelector(".scroll-ind");
  if(ind) window.addEventListener("scroll",()=>{ ind.style.opacity = Math.max(0, 1 - window.scrollY/300); },{passive:true});

  /* ---------- play button ---------- */
  const play = document.querySelector(".playbtn");
  if(play) play.addEventListener("click",()=> play.closest(".stagebox").classList.add("playing"));
})();
