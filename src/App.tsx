import { useState, useEffect } from "react";
import { C, F, COURSES, POSTS, DIAL, TESTIMONIALS, STATS, fmt, btn, Tag } from "./data.tsx";
import { KalanAI, VideoPlayer, PaymentModal } from "./components";
import { CourseDetailModal, BlogModal } from "./modals";

/* ═══════════════════════════════════════════════════
   HEADER
═══════════════════════════════════════════════════ */
function Header({onNav}:{onNav:(id:string)=>void}){
  const [scrolled,setScrolled]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);

  useEffect(()=>{
    const onScroll=()=>setScrolled(window.scrollY>20);
    window.addEventListener("scroll",onScroll);
    return()=>window.removeEventListener("scroll",onScroll);
  },[]);

  const links=[
    {l:"Formations",id:"formations"},
    {l:"Méthode DIAL™",id:"methode"},
    {l:"Témoignages",id:"temoignages"},
    {l:"Blog",id:"blog"},
    {l:"À propos",id:"apropos"},
  ];

  return(
    <header style={{position:"fixed",top:0,left:0,right:0,zIndex:100,transition:"all .3s",background:scrolled?"rgba(8,17,30,.92)":"transparent",backdropFilter:scrolled?"blur(12px)":"none",borderBottom:scrolled?`1px solid ${C.bdr}`:"1px solid transparent"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div onClick={()=>onNav("hero")} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#C8971A,#E0A820)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:C.bg}}>B</div>
          <div>
            <div style={{fontFamily:F.serif,fontSize:18,fontWeight:600,color:"#fff",lineHeight:1}}>Beyrey</div>
            <div style={{fontFamily:F.mono,fontSize:9,color:C.gold,letterSpacing:".15em",textTransform:"uppercase"}}>Consulting</div>
          </div>
        </div>
        <nav style={{display:"flex",gap:28,alignItems:"center"}}>
          {links.map(x=>(
            <button key={x.id} onClick={()=>onNav(x.id)} style={btn({background:"none",color:C.t2,fontSize:13,fontWeight:600,padding:"6px 0",borderBottom:"2px solid transparent",transition:"all .2s"})}
              onMouseEnter={e=>{e.currentTarget.style.color=C.t;e.currentTarget.style.borderBottomColor=C.gold;}}
              onMouseLeave={e=>{e.currentTarget.style.color=C.t2;e.currentTarget.style.borderBottomColor="transparent";}}>
              {x.l}
            </button>
          ))}
        </nav>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={()=>onNav("contact")} style={btn({background:"linear-gradient(135deg,#C8971A,#E0A820)",color:C.bg,padding:"10px 18px",borderRadius:10,fontWeight:700,fontSize:13,boxShadow:"0 4px 16px rgba(200,151,26,.3)"})}>
            Nous contacter
          </button>
          <button onClick={()=>setMobileOpen(true)} style={btn({display:"none",background:C.s2,color:C.t,border:`1px solid ${C.bdr}`,width:38,height:38,borderRadius:10,fontSize:18})} className="mobile-only">☰</button>
        </div>
      </div>
      {mobileOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(4,8,16,.95)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24}}>
          <button onClick={()=>setMobileOpen(false)} style={btn({position:"absolute",top:20,right:20,background:C.s2,color:C.t,width:40,height:40,borderRadius:"50%",fontSize:18})}>✕</button>
          {links.map(x=>(
            <button key={x.id} onClick={()=>{onNav(x.id);setMobileOpen(false);}} style={btn({background:"none",color:C.t,fontSize:22,fontFamily:F.serif})}>{x.l}</button>
          ))}
          <button onClick={()=>{onNav("contact");setMobileOpen(false);}} style={btn({background:"linear-gradient(135deg,#C8971A,#E0A820)",color:C.bg,padding:"14px 32px",borderRadius:10,fontWeight:700,fontSize:15})}>Nous contacter</button>
        </div>
      )}
    </header>
  );
}

/* ═══════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════ */
function Hero({onNav,onExplore}:{onNav:(id:string)=>void,onExplore:()=>void}){
  return(
    <section id="hero" style={{position:"relative",padding:"140px 24px 80px",overflow:"hidden"}}>
      {/* Background constellation */}
      <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        {[...Array(40)].map((_,i)=>(
          <div key={i} style={{position:"absolute",width:Math.random()*2+1,height:Math.random()*2+1,borderRadius:"50%",background:C.gold,opacity:Math.random()*.5+.1,left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,animation:`twinkle ${3+Math.random()*4}s ease-in-out ${Math.random()*3}s infinite alternate`}}/>
        ))}
        <div style={{position:"absolute",top:"-20%",right:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(200,151,26,.08),transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:"-30%",left:"-10%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,200,150,.06),transparent 70%)"}}/>
      </div>
      <style>{`@keyframes twinkle{to{opacity:.9;transform:scale(1.4)}}`}</style>

      <div style={{maxWidth:1200,margin:"0 auto",position:"relative",display:"grid",gridTemplateColumns:"1.1fr .9fr",gap:60,alignItems:"center"}}>
        <div>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${C.gold}12`,border:`1px solid ${C.gold}28`,borderRadius:20,padding:"6px 14px",marginBottom:24}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:C.grn,animation:"pulse 2s infinite"}}/>
            <span style={{fontFamily:F.mono,fontSize:11,color:C.gold,letterSpacing:".08em"}}>CABINAT DATA & BI · BAMAKO</span>
          </div>
          <h1 style={{fontFamily:F.serif,fontSize:64,fontWeight:600,color:"#fff",lineHeight:1.05,margin:"0 0 20px",letterSpacing:"-0.02em"}}>
            La data au service<br/>
            <span style={{color:C.gold,fontStyle:"italic"}}>des PME maliennes.</span>
          </h1>
          <p style={{fontSize:17,color:C.t2,lineHeight:1.7,maxWidth:520,margin:"0 0 32px"}}>
            Beyrey Consulting est le cabinet de référence Data & BI au Mali. Formations, audits et accompagnement basés sur la méthode <strong style={{color:C.gold}}>DIAL™</strong> — conçue pour la réalité africaine.
          </p>
          <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
            <button onClick={onExplore} style={btn({background:"linear-gradient(135deg,#C8971A,#E0A820)",color:C.bg,padding:"15px 30px",borderRadius:12,fontWeight:800,fontSize:15,boxShadow:"0 8px 32px rgba(200,151,26,.4)"})}>
              Explorer les formations →
            </button>
            <button onClick={()=>onNav("methode")} style={btn({background:C.s2,color:C.t,border:`1px solid ${C.bdr2}`,padding:"15px 30px",borderRadius:12,fontWeight:700,fontSize:15})}>
              Découvrir DIAL™
            </button>
          </div>
          <div style={{display:"flex",gap:32,marginTop:40,flexWrap:"wrap"}}>
            {STATS.map((s,i)=>(
              <div key={i}>
                <div style={{fontFamily:F.serif,fontSize:32,fontWeight:600,color:C.gold,lineHeight:1}}>{s.n}</div>
                <div style={{fontSize:11,color:C.t2,fontFamily:F.mono,letterSpacing:".08em",textTransform:"uppercase",marginTop:4}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero card — featured course preview */}
        <div style={{position:"relative"}}>
          <div style={{background:"linear-gradient(160deg,#0E1A2C,#162438)",border:`1px solid ${C.bdr}`,borderRadius:24,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,.5)"}}>
            <div style={{padding:20,paddingBottom:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <Tag c={C.gold}>⭐ Formation phare</Tag>
                <span style={{fontFamily:F.mono,fontSize:10,color:C.t2}}>★ 4.9 · 147 étudiants</span>
              </div>
              <div style={{fontFamily:F.serif,fontSize:22,fontWeight:600,color:"#fff",marginBottom:6}}>Power BI pour PME Maliennes</div>
              <div style={{fontSize:12,color:C.t2,marginBottom:16}}>De zéro à votre premier dashboard professionnel</div>
            </div>
            <div style={{padding:"0 20px 20px"}}>
              <VideoPlayer course={COURSES[0]} enrolled={false} />
            </div>
          </div>
          <div style={{position:"absolute",right:-20,top:-20,background:C.gold,color:C.bg,padding:"8px 14px",borderRadius:12,fontSize:11,fontWeight:800,fontFamily:F.mono,transform:"rotate(8deg)",boxShadow:"0 8px 24px rgba(200,151,26,.4)"}}>
            -25% LANCEMENT
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION TITLE
═══════════════════════════════════════════════════ */
function SectionTitle({tag,title,sub,center}:{tag:string,title:React.ReactNode,sub?:string,center?:boolean}){
  return(
    <div style={{maxWidth:680,margin:center?"0 auto 48px":"0 0 40px",textAlign:center?"center":"left"}}>
      <div style={{fontFamily:F.mono,fontSize:11,color:C.gold,letterSpacing:".15em",textTransform:"uppercase",marginBottom:12}}>{tag}</div>
      <h2 style={{fontFamily:F.serif,fontSize:42,fontWeight:600,color:"#fff",lineHeight:1.15,margin:"0 0 14px",letterSpacing:"-0.01em"}}>{title}</h2>
      {sub&&<p style={{fontSize:15,color:C.t2,lineHeight:1.7,margin:0}}>{sub}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   COURSES SECTION
═══════════════════════════════════════════════════ */
function CoursesSection({onOpenCourse,onBuy}:{onOpenCourse:(c:any)=>void,onBuy:(c:any)=>void}){
  const [filter,setFilter]=useState<string>("Tous");
  const cats=["Tous",...Array.from(new Set(COURSES.map(c=>c.cat)))];
  const list=filter==="Tous"?COURSES:COURSES.filter(c=>c.cat===filter);

  return(
    <section id="formations" style={{padding:"80px 24px",maxWidth:1200,margin:"0 auto"}}>
      <SectionTitle tag="Catalogue · 6 formations" title={<>Choisissez votre <span style={{color:C.gold,fontStyle:"italic"}}>prochaine compétence</span></>} sub="Des formations conçues pour le contexte malien. 80% de pratique, 100% de terrain." center/>

      <div style={{display:"flex",gap:8,marginBottom:32,flexWrap:"wrap",justifyContent:"center"}}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setFilter(c)} style={btn({background:filter===c?C.gold:C.s2,color:filter===c?C.bg:C.t2,border:`1px solid ${filter===c?C.gold:C.bdr}`,padding:"9px 18px",borderRadius:20,fontSize:12,fontWeight:700,transition:"all .2s"})}>
            {c}
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:20}}>
        {list.map(course=>{
          const discount=Math.round((1-course.price/course.orig)*100);
          return(
            <div key={course.id} style={{background:C.s1,border:`1px solid ${C.bdr}`,borderRadius:18,overflow:"hidden",transition:"all .3s",display:"flex",flexDirection:"column"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=course.color;e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 20px 48px rgba(0,0,0,.4)`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.bdr;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
              <div style={{padding:20,background:`linear-gradient(135deg,${course.color}10,transparent)`,borderBottom:`1px solid ${C.bdr}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div style={{width:48,height:48,borderRadius:12,background:`${course.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{course.icon}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                    <Tag c={course.color}>{course.cat}</Tag>
                    <Tag c={C.t2}>{course.lvl}</Tag>
                  </div>
                </div>
                <h3 style={{fontFamily:F.serif,fontSize:20,fontWeight:600,color:"#fff",margin:"0 0 6px",lineHeight:1.25}}>{course.title}</h3>
                <div style={{fontSize:12,color:C.t2,lineHeight:1.5}}>{course.sub}</div>
              </div>
              <div style={{padding:18,flex:1,display:"flex",flexDirection:"column"}}>
                <div style={{display:"flex",gap:14,marginBottom:14,fontSize:11,color:C.t2,fontFamily:F.mono}}>
                  <span>⏱️ {course.dur}</span><span>🎬 {course.vids}</span><span>👥 {course.students}</span><span>⭐ {course.rating}</span>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:18}}>
                  {course.skills.slice(0,3).map((s:string,i:number)=>(
                    <span key={i} style={{fontSize:10,color:C.t2,background:C.s2,padding:"3px 8px",borderRadius:6,border:`1px solid ${C.bdr}`}}>{s}</span>
                  ))}
                  {course.skills.length>3&&<span style={{fontSize:10,color:C.t3,padding:"3px 4px"}}>+{course.skills.length-3}</span>}
                </div>
                <div style={{flex:1}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontFamily:F.serif,fontSize:22,fontWeight:600,color:C.gold}}>{fmt(course.price)}</span>
                      <span style={{fontSize:12,color:C.t3,textDecoration:"line-through"}}>{fmt(course.orig)}</span>
                    </div>
                    {course.preview&&<div style={{fontSize:10,color:C.grn,fontFamily:F.mono,marginTop:2}}>▶ Aperçu gratuit</div>}
                  </div>
                  <Tag c={C.red}>-{discount}%</Tag>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>onOpenCourse(course)} style={btn({flex:1,background:C.s2,color:C.t,border:`1px solid ${C.bdr2}`,padding:"11px",borderRadius:10,fontWeight:700,fontSize:12})}>Détails</button>
                  <button onClick={()=>onBuy(course)} style={btn({flex:1,background:course.color,color:"#fff",padding:"11px",borderRadius:10,fontWeight:800,fontSize:12})}>Acheter</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   DIAL METHOD SECTION
═══════════════════════════════════════════════════ */
function DialSection(){
  return(
    <section id="methode" style={{padding:"80px 24px",background:"linear-gradient(180deg,transparent,rgba(14,26,44,.4),transparent)"}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <SectionTitle tag="Méthode propriétaire" title={<>DIAL™ — <span style={{color:C.gold,fontStyle:"italic"}}>la gouvernance frugale</span></>} sub="Diagnostiquer, Implémenter, Automatiser, Livrer. Une méthode conçue pour la réalité africaine, pas pour les éditeurs occidentaux." center/>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:20,marginBottom:40}}>
          {DIAL.map((d,i)=>(
            <div key={i} style={{position:"relative",background:C.s1,border:`1px solid ${C.bdr}`,borderRadius:18,padding:24,overflow:"hidden",transition:"all .3s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=d.color;e.currentTarget.style.transform="translateY(-4px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.bdr;e.currentTarget.style.transform="none";}}>
              <div style={{position:"absolute",top:-20,right:-10,fontFamily:F.serif,fontSize:120,fontWeight:600,color:`${d.color}08`,lineHeight:1}}>{d.letter}</div>
              <div style={{position:"relative",zIndex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                  <div style={{width:44,height:44,borderRadius:12,background:`${d.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{d.icon}</div>
                  <div>
                    <div style={{fontFamily:F.mono,fontSize:10,color:d.color,letterSpacing:".15em"}}>ÉTAPE {i+1}</div>
                    <div style={{fontFamily:F.serif,fontSize:22,fontWeight:600,color:"#fff"}}>{d.title}</div>
                  </div>
                </div>
                <p style={{fontSize:13,color:C.t2,lineHeight:1.7,margin:0}}>{d.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:"linear-gradient(135deg,#0E1A2C,#162438)",border:`1px solid ${C.bdr}`,borderRadius:20,padding:32,display:"grid",gridTemplateColumns:"1fr 1fr",gap:32,alignItems:"center"}}>
          <div>
            <Tag c={C.gold}>📚 LIVRE BLANC</Tag>
            <h3 style={{fontFamily:F.serif,fontSize:28,fontWeight:600,color:"#fff",margin:"14px 0 12px",lineHeight:1.2}}>L'Art de la Rigueur</h3>
            <p style={{fontSize:14,color:C.t2,lineHeight:1.7,margin:"0 0 20px"}}>
              Manifeste pour une gouvernance frugale de la data en Afrique. Écrit par Ibrahim Seydou après 5 ans de terrain à Bamako. Disponible en téléchargement gratuit.
            </p>
            <button style={btn({background:"linear-gradient(135deg,#C8971A,#E0A820)",color:C.bg,padding:"12px 24px",borderRadius:10,fontWeight:700,fontSize:13})}>
              📖 Télécharger gratuitement
            </button>
          </div>
          <div style={{position:"relative",height:200,background:C.s2,borderRadius:14,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontFamily:F.serif,fontSize:80,fontWeight:600,fontStyle:"italic",color:`${C.gold}30`}}>L'Art</div>
            <div style={{position:"absolute",bottom:20,left:20,fontFamily:F.mono,fontSize:10,color:C.t2,letterSpacing:".1em"}}>IBRAHIM SEYDOU · 2024</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   TESTIMONIALS SECTION
═══════════════════════════════════════════════════ */
function TestimonialsSection(){
  return(
    <section id="temoignages" style={{padding:"80px 24px",maxWidth:1200,margin:"0 auto"}}>
      <SectionTitle tag="Ils nous font confiance" title={<>Ce que disent <span style={{color:C.gold,fontStyle:"italic"}}>nos clients</span></>} sub="PME, ONG, institutions financières. 465+ professionnels formés au Mali." center/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
        {TESTIMONIALS.map((t,i)=>(
          <div key={i} style={{background:C.s1,border:`1px solid ${C.bdr}`,borderRadius:18,padding:24,position:"relative",transition:"all .3s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=t.color;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.bdr;}}>
            <div style={{fontFamily:F.serif,fontSize:60,color:`${t.color}30`,lineHeight:.5,position:"absolute",top:24,right:20}}>"</div>
            <p style={{fontSize:14,color:C.t,lineHeight:1.7,margin:"0 0 20px",position:"relative",zIndex:1}}>{t.text}</p>
            <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:16,borderTop:`1px solid ${C.bdr}`}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:`${t.color}20`,color:t.color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14}}>{t.avatar}</div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{t.name}</div>
                <div style={{fontSize:11,color:C.t2,fontFamily:F.mono}}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   BLOG SECTION
═══════════════════════════════════════════════════ */
function BlogSection({onOpenPost}:{onOpenPost:(p:any)=>void}){
  const [filter,setFilter]=useState<string>("Tous");
  const cats=["Tous",...Array.from(new Set(POSTS.map(p=>p.cat)))];
  const list=filter==="Tous"?POSTS:POSTS.filter(p=>p.cat===filter);

  return(
    <section id="blog" style={{padding:"80px 24px",maxWidth:1200,margin:"0 auto"}}>
      <SectionTitle tag="Le journal · Beyrey" title={<>Carnet de <span style={{color:C.gold,fontStyle:"italic"}}>terrain</span></>} sub="Stratégie, méthodes, études de cas. 5 ans de terrain malien racontés sans filtre." center/>

      <div style={{display:"flex",gap:8,marginBottom:32,flexWrap:"wrap",justifyContent:"center"}}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setFilter(c)} style={btn({background:filter===c?C.gold:C.s2,color:filter===c?C.bg:C.t2,border:`1px solid ${filter===c?C.gold:C.bdr}`,padding:"8px 16px",borderRadius:20,fontSize:12,fontWeight:700})}>{c}</button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:20}}>
        {list.map(p=>(
          <div key={p.id} onClick={()=>onOpenPost(p)} style={{background:C.s1,border:`1px solid ${C.bdr}`,borderRadius:18,overflow:"hidden",cursor:"pointer",transition:"all .3s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.transform="translateY(-4px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.bdr;e.currentTarget.style.transform="none";}}>
            <div style={{height:140,background:`linear-gradient(135deg,${C.s2},${C.s3})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,position:"relative"}}>
              {p.icon}
              <div style={{position:"absolute",top:14,left:14}}><Tag c={C.gold}>{p.cat}</Tag></div>
              <div style={{position:"absolute",bottom:14,right:14,fontFamily:F.mono,fontSize:10,color:C.t2}}>{p.date}</div>
            </div>
            <div style={{padding:20}}>
              <h3 style={{fontFamily:F.serif,fontSize:18,fontWeight:600,color:"#fff",margin:"0 0 10px",lineHeight:1.3}}>{p.title}</h3>
              <p style={{fontSize:13,color:C.t2,lineHeight:1.6,margin:"0 0 14px"}}>{p.excerpt}</p>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,color:C.t3,fontFamily:F.mono}}>
                <span>{p.time} de lecture</span>
                <span style={{color:C.gold}}>Lire →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   ABOUT SECTION
═══════════════════════════════════════════════════ */
function AboutSection(){
  return(
    <section id="apropos" style={{padding:"80px 24px",background:"linear-gradient(180deg,transparent,rgba(14,26,44,.4),transparent)"}}>
      <div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"center"}}>
        <div>
          <SectionTitle tag="Le cabinet" title={<>Beyrey <span style={{color:C.gold,fontStyle:"italic"}}>Consulting</span></>}/>
          <p style={{fontSize:15,color:C.t,lineHeight:1.8,margin:"0 0 20px"}}>
            Fondé par <strong style={{color:C.gold}}>Ibrahim Seydou</strong> après 5 ans de terrain à Bamako, Beyrey Consulting est devenu le cabinet de référence Data & BI au Mali. Notre conviction : les meilleures solutions data pour l'Afrique ne viendront pas des éditeurs occidentaux, mais de praticiens qui connaissent le terrain.
          </p>
          <p style={{fontSize:15,color:C.t2,lineHeight:1.8,margin:"0 0 28px"}}>
            Nous croyons en la <strong style={{color:C.t}}>gouvernance frugale</strong> : maximiser la valeur par franc CFA investi. Préférer un outil installé localement à un cloud instable. Investir davantage en formation qu'en licences.
          </p>
          <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
            {STATS.map((s,i)=>(
              <div key={i} style={{padding:"14px 18px",background:C.s1,border:`1px solid ${C.bdr}`,borderRadius:12}}>
                <div style={{fontFamily:F.serif,fontSize:24,fontWeight:600,color:C.gold}}>{s.n}</div>
                <div style={{fontSize:10,color:C.t2,fontFamily:F.mono,letterSpacing:".08em",textTransform:"uppercase"}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{position:"relative"}}>
          <div style={{background:"linear-gradient(160deg,#0E1A2C,#162438)",border:`1px solid ${C.bdr}`,borderRadius:20,padding:28}}>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#C8971A,#E0A820)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>👨‍🏫</div>
              <div>
                <div style={{fontFamily:F.serif,fontSize:22,fontWeight:600,color:"#fff"}}>Ibrahim Seydou</div>
                <div style={{fontSize:12,color:C.gold,fontFamily:F.mono}}>Fondateur · Consultant Principal</div>
              </div>
            </div>
            <p style={{color:C.t2,lineHeight:1.7,margin:"0 0 18px",fontStyle:"italic",fontFamily:F.serif,fontSize:15}}>
              "J'ai visité plus de 40 entreprises à Bamako. Dans 9 cas sur 10, les données existent — mais elles dorment dans des fichiers Excel que personne n'analyse. Mon métier : les réveiller."
            </p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["Power BI","Python","DIAL™","Gouvernance","Audit","Formation"].map((s,i)=>(
                <span key={i} style={{fontSize:10,color:C.t2,background:C.s2,padding:"5px 10px",borderRadius:6,border:`1px solid ${C.bdr}`}}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   CONTACT / CTA SECTION
═══════════════════════════════════════════════════ */
function ContactSection(){
  const [form,setForm]=useState({name:"",email:"",msg:""});
  const [sent,setSent]=useState(false);

  const submit=()=>{
    if(!form.name||!form.email||!form.msg)return;
    setSent(true);
    setTimeout(()=>{setSent(false);setForm({name:"",email:"",msg:""});},3000);
  };

  return(
    <section id="contact" style={{padding:"80px 24px",maxWidth:1200,margin:"0 auto"}}>
      <div style={{background:"linear-gradient(135deg,#0E1A2C,#162438)",border:`1px solid ${C.bdr}`,borderRadius:24,overflow:"hidden",display:"grid",gridTemplateColumns:"1fr 1fr"}}>
        <div style={{padding:40}}>
          <SectionTitle tag="Travaillons ensemble" title={<>Un projet data ?<br/><span style={{color:C.gold,fontStyle:"italic"}}>Parlons-en.</span></>}/>
          <p style={{fontSize:14,color:C.t2,lineHeight:1.7,margin:"0 0 24px"}}>
            Audit, formation sur mesure, accompagnement DIAL™. Réponse sous 24h ouvrées.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",alignItems:"center",gap:12,color:C.t2,fontSize:13}}>
              <span style={{width:36,height:36,borderRadius:10,background:`${C.gold}18`,color:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>📍</span>
              Bamako, Mali · ACI 2000
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,color:C.t2,fontSize:13}}>
              <span style={{width:36,height:36,borderRadius:10,background:`${C.grn}18`,color:C.grn,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>✉️</span>
              contact@beyrey.consulting
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,color:C.t2,fontSize:13}}>
              <span style={{width:36,height:36,borderRadius:10,background:`${C.wa}18`,color:C.wa,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>💬</span>
              +223 76 00 00 00
            </div>
          </div>
        </div>
        <div style={{padding:40,background:C.s1}}>
          {sent?(
            <div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,textAlign:"center"}}>
              <div style={{width:60,height:60,borderRadius:"50%",background:C.grn,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,color:"#fff"}}>✓</div>
              <div style={{fontSize:18,fontWeight:800,color:"#fff"}}>Message envoyé !</div>
              <div style={{fontSize:13,color:C.t2}}>Nous vous répondrons sous 24h.</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <div style={{fontFamily:F.mono,fontSize:10,color:C.t2,letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Nom complet</div>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Votre nom"
                  style={{width:"100%",background:C.s2,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"12px 14px",color:C.t,fontSize:14,fontFamily:F.sans,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <div style={{fontFamily:F.mono,fontSize:10,color:C.t2,letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Email</div>
                <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="vous@exemple.com"
                  style={{width:"100%",background:C.s2,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"12px 14px",color:C.t,fontSize:14,fontFamily:F.sans,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <div style={{fontFamily:F.mono,fontSize:10,color:C.t2,letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Votre projet</div>
                <textarea value={form.msg} onChange={e=>setForm({...form,msg:e.target.value})} placeholder="Décrivez votre besoin..." rows={4}
                  style={{width:"100%",background:C.s2,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"12px 14px",color:C.t,fontSize:14,fontFamily:F.sans,outline:"none",boxSizing:"border-box",resize:"vertical"}}/>
              </div>
              <button onClick={submit} style={btn({background:"linear-gradient(135deg,#C8971A,#E0A820)",color:C.bg,padding:"14px",borderRadius:10,fontWeight:800,fontSize:14,boxShadow:"0 6px 24px rgba(200,151,26,.3)"})}>
                Envoyer le message →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════ */
function Footer({onNav}:{onNav:(id:string)=>void}){
  return(
    <footer style={{background:C.s1,borderTop:`1px solid ${C.bdr}`,padding:"48px 24px 24px"}}>
      <div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:40,marginBottom:32}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#C8971A,#E0A820)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:C.bg}}>B</div>
            <div>
              <div style={{fontFamily:F.serif,fontSize:18,fontWeight:600,color:"#fff",lineHeight:1}}>Beyrey</div>
              <div style={{fontFamily:F.mono,fontSize:9,color:C.gold,letterSpacing:".15em",textTransform:"uppercase"}}>Consulting</div>
            </div>
          </div>
          <p style={{fontSize:13,color:C.t2,lineHeight:1.7,maxWidth:320,margin:"0 0 18px"}}>
            Le cabinet de référence Data & BI au Mali. Méthode DIAL™ — gouvernance frugale pour l'Afrique.
          </p>
          <div style={{display:"flex",gap:10}}>
            {["𝕏","in","f","✉"].map((s,i)=>(
              <button key={i} style={btn({width:36,height:36,borderRadius:10,background:C.s2,border:`1px solid ${C.bdr}`,color:C.t2,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"})}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontFamily:F.mono,fontSize:10,color:C.gold,letterSpacing:".1em",textTransform:"uppercase",marginBottom:14}}>Navigation</div>
          {[{l:"Formations",id:"formations"},{l:"Méthode DIAL™",id:"methode"},{l:"Témoignages",id:"temoignages"},{l:"Blog",id:"blog"},{l:"À propos",id:"apropos"}].map(x=>(
            <button key={x.id} onClick={()=>onNav(x.id)} style={btn({display:"block",background:"none",color:C.t2,fontSize:13,padding:"4px 0",textAlign:"left"})}>{x.l}</button>
          ))}
        </div>
        <div>
          <div style={{fontFamily:F.mono,fontSize:10,color:C.gold,letterSpacing:".1em",textTransform:"uppercase",marginBottom:14}}>Formations</div>
          {COURSES.slice(0,5).map(c=>(
            <div key={c.id} style={{fontSize:13,color:C.t2,padding:"4px 0"}}>{c.icon} {c.title.length>22?c.title.substring(0,22)+"…":c.title}</div>
          ))}
        </div>
        <div>
          <div style={{fontFamily:F.mono,fontSize:10,color:C.gold,letterSpacing:".1em",textTransform:"uppercase",marginBottom:14}}>Contact</div>
          <div style={{fontSize:13,color:C.t2,lineHeight:1.8}}>
            📍 Bamako, Mali<br/>✉️ contact@beyrey.consulting<br/>💬 +223 76 00 00 00
          </div>
        </div>
      </div>
      <div style={{maxWidth:1200,margin:"0 auto",paddingTop:24,borderTop:`1px solid ${C.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div style={{fontSize:11,color:C.t3,fontFamily:F.mono}}>© 2025 BEYREY CONSULTING · TOUS DROITS RÉSERVÉS</div>
        <div style={{display:"flex",gap:20,fontSize:11,color:C.t3,fontFamily:F.mono}}>
          <span>Mentions légales</span><span>·</span><span>Confidentialité</span><span>·</span><span>CGV</span>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════ */
export default function App() {
  const [showPayment,setShowPayment]=useState(false);
  const [payCourse,setPayCourse]=useState<any>(null);
  const [detailCourse,setDetailCourse]=useState<any>(null);
  const [blogPost,setBlogPost]=useState<any>(null);
  const [enrolled,setEnrolled]=useState<number[]>([]);

  const nav=(id:string)=>{
    const el=document.getElementById(id);
    if(el)el.scrollIntoView({behavior:"smooth"});
  };

  const openBuy=(c:any)=>{setPayCourse(c);setShowPayment(true);};
  const openCourse=(c:any)=>setDetailCourse(c);
  const onEnroll=(id:number)=>{
    if(!enrolled.includes(id))setEnrolled([...enrolled,id]);
    setDetailCourse(null);
    nav("formations");
  };
  const onPaySuccess=()=>{
    if(payCourse&&!enrolled.includes(payCourse.id))setEnrolled([...enrolled,payCourse.id]);
  };

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.t,fontFamily:F.sans,overflowX:"hidden"}}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @media(max-width:768px){
          .mobile-only{display:flex !important;}
          nav{display:none !important;}
        }
      `}</style>

      <Header onNav={nav}/>
      <Hero onNav={nav} onExplore={()=>nav("formations")}/>
      <CoursesSection onOpenCourse={openCourse} onBuy={openBuy}/>
      <DialSection/>
      <TestimonialsSection/>
      <BlogSection onOpenPost={setBlogPost}/>
      <AboutSection/>
      <ContactSection/>
      <Footer onNav={nav}/>

      <KalanAI/>

      {showPayment&&payCourse&&(
        <PaymentModal course={payCourse} onClose={()=>{setShowPayment(false);setPayCourse(null);}} onSuccess={onPaySuccess}/>
      )}
      {detailCourse&&(
        <CourseDetailModal course={detailCourse} enrolled={enrolled.includes(detailCourse.id)} onClose={()=>setDetailCourse(null)} onBuy={()=>{setDetailCourse(null);openBuy(detailCourse);}} onEnroll={onEnroll}/>
      )}
      {blogPost&&(
        <BlogModal post={blogPost} onClose={()=>setBlogPost(null)}/>
      )}
    </div>
  );
}
