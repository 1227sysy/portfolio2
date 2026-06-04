/* =========================================================
   Motion — scroll reveal, parallax, mouse glow, magnetic
   ========================================================= */
(function(){
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lerp = (a,b,t)=>a+(b-a)*t;

  /* ---------- nav background on scroll ---------- */
  const nav = document.querySelector(".nav");
  const onScroll = ()=>{ nav.classList.toggle("scrolled", window.scrollY > 24); };
  onScroll(); window.addEventListener("scroll", onScroll, {passive:true});

  /* ---------- scroll reveal (IO + synchronous in-viewport pass + failsafe) ---------- */
  const reveal = el => el.classList.add("in");
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ reveal(e.target); io.unobserve(e.target); }
    });
  },{threshold:.14, rootMargin:"0px 0px -7% 0px"});

  const revealEls = [...document.querySelectorAll("[data-reveal]")];
  const vh = () => window.innerHeight || document.documentElement.clientHeight;
  // anything already on/near screen reveals immediately (no rAF/IO dependency)
  const sweepInView = ()=>{
    revealEls.forEach(el=>{
      if(el.classList.contains("in")) return;
      const r = el.getBoundingClientRect();
      if(r.top < vh()*0.92 && r.bottom > 0) reveal(el);
      else io.observe(el);
    });
  };
  // hero intro reveals synchronously
  document.querySelector(".hero")?.classList.add("in");
  sweepInView();
  // failsafe: if IO is throttled (background tab / preview), force-reveal everything
  setTimeout(()=>revealEls.forEach(reveal), 1600);

  if(reduce) return; // skip continuous motion

  /* ---------- mouse-following glow + hero parallax ---------- */
  const hero = document.querySelector(".hero");
  const glow = document.querySelector(".glow");
  const floats = [...document.querySelectorAll(".stage .float")];
  let mx=.65, my=.30, tx=.65, ty=.30;        // normalized target/current
  let raf=null;
  let parallaxOn = document.documentElement.getAttribute("data-motion") !== "calm";

  function pointer(e){
    if(!parallaxOn) return;
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left)/r.width;
    ty = (e.clientY - r.top)/r.height;
    if(!raf) raf = requestAnimationFrame(tick);
  }
  function tick(){
    mx = lerp(mx,tx,.08); my = lerp(my,ty,.08);
    if(glow){ glow.style.setProperty("--gx",(mx*100)+"%"); glow.style.setProperty("--gy",(my*100)+"%"); }
    const dx = (mx-.5), dy=(my-.5);
    floats.forEach(f=>{
      const depth = parseFloat(f.dataset.depth||"1");
      f.style.transform = `translate(${dx*depth*-26}px, ${dy*depth*-22}px)`;
    });
    if(Math.abs(mx-tx)>.001 || Math.abs(my-ty)>.001){ raf=requestAnimationFrame(tick); }
    else raf=null;
  }
  hero.addEventListener("pointermove", pointer);
  hero.addEventListener("pointerleave", ()=>{ tx=.65; ty=.30; if(!raf) raf=requestAnimationFrame(tick); });

  /* idle float (independent of parallax) */
  const floatAnims = floats.map((f,i)=>
    f.animate(
      [{translate:"0 0"},{translate:`0 ${ (i%2?-1:1)*10 }px`}],
      {duration:3600+i*450, direction:"alternate", iterations:Infinity, easing:"cubic-bezier(.45,0,.55,1)"}
    )
  );

  /* expose a mode switch for the Tweaks panel */
  window.__motion = {
    setMode(m){
      parallaxOn = m !== "calm";
      floatAnims.forEach(a => m === "calm" ? a.pause() : a.play());
      if(m === "calm") floats.forEach(f => f.style.transform = "");
    }
  };

  /* ---------- magnetic buttons ---------- */
  document.querySelectorAll("[data-magnetic]").forEach(btn=>{
    let r=null;
    btn.addEventListener("pointerenter",()=>{ r=btn.getBoundingClientRect(); });
    btn.addEventListener("pointermove",(e)=>{
      if(!r) r=btn.getBoundingClientRect();
      const x=(e.clientX-r.left-r.width/2), y=(e.clientY-r.top-r.height/2);
      btn.style.transform=`translate(${x*.28}px, ${y*.4}px)`;
    });
    btn.addEventListener("pointerleave",()=>{ btn.style.transform=""; });
  });

  /* ---------- scroll indicator fade ---------- */
  const ind = document.querySelector(".scroll-ind");
  if(ind){
    window.addEventListener("scroll",()=>{
      const o = Math.max(0, 1 - window.scrollY/300);
      ind.style.opacity = o;
    },{passive:true});
  }

  /* ---------- play button (demo) ---------- */
  const play = document.querySelector(".playbtn");
  if(play){
    play.addEventListener("click",()=>{
      const box = play.closest(".stagebox");
      box.classList.add("playing");
      play.style.transition="opacity .4s, transform .4s";
      play.style.opacity="0"; play.style.transform="scale(.6)";
      setTimeout(()=>{ play.style.display="none"; },420);
    });
  }
})();
