import { useState, useEffect } from "react";
import { C, F, fmt, btn, Tag, alpha } from "./data.tsx";
import { VideoPlayer, RichText } from "./components";
import { useDialog } from "./a11y";

/* ═══════════════════════════════════════════════════
   COURSE DETAIL MODAL
═══════════════════════════════════════════════════ */
export function CourseDetailModal({course,enrolled,onClose,onBuy,onEnroll}:{course:any,enrolled:boolean,onClose:()=>void,onBuy:()=>void,onEnroll:(id:number)=>void}){
  const [tab,setTab]=useState<"apercu"|"programme"|"formateur">("apercu");
  const dialogRef=useDialog(onClose);

  useEffect(()=>{
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow="";};
  },[]);

  return(
    <div style={{position:"fixed",inset:0,zIndex:280,background:"rgba(4,8,16,.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={course.title} tabIndex={-1} style={{background:C.s1,border:`1px solid ${C.bdr}`,borderRadius:22,width:"100%",maxWidth:880,maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,.7)"}}>
        <style>{`@media(max-width:680px){.cd-apercu{grid-template-columns:1fr !important;}.cd-stats{grid-template-columns:repeat(2,1fr) !important;}}`}</style>

        {/* Header */}
        <div style={{background:`linear-gradient(135deg,${C.s1},${C.s2})`,padding:"20px 24px",borderBottom:`1px solid ${C.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
              <Tag c={course.color}>{course.icon} {course.cat}</Tag>
              <Tag c={C.t2}>{course.lvl}</Tag>
              {course.preview&&<Tag c={C.grn}>▶ Aperçu gratuit</Tag>}
            </div>
            <h2 style={{fontFamily:F.serif,fontSize:26,fontWeight:600,color:C.tf,margin:0,lineHeight:1.2}}>{course.title}</h2>
            <div style={{fontSize:13,color:C.t2,marginTop:6}}>{course.sub}</div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={btn({background:C.bdr,color:C.t2,width:32,height:32,borderRadius:"50%",fontSize:14,flexShrink:0})}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:0,borderBottom:`1px solid ${C.bdr}`,background:C.s2}}>
          {(["apercu","programme","formateur"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={btn({flex:1,background:tab===t?`${alpha(C.gold, 6.3)}`:"transparent",color:tab===t?C.gold:C.t2,padding:"13px 8px",fontSize:12,fontWeight:700,borderBottom:tab===t?`2px solid ${C.gold}`:"2px solid transparent",transition:"background-color .2s ease, border-color .2s ease, color .2s ease, box-shadow .2s ease, transform .2s cubic-bezier(.23,1,.32,1)",textTransform:"capitalize"})}>
              {t==="apercu"?"Aperçu":t==="programme"?"Programme":"Formateur"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:24}}>
          {tab==="apercu"&&<>
            <div className="cd-apercu" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 280px",gap:24,alignItems:"start"}}>
              <div>
                <p style={{fontSize:14,color:C.t,lineHeight:1.7,marginBottom:18}}>{course.desc}</p>
                <div style={{fontFamily:F.mono,fontSize:10,color:C.t2,letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>Compétences acquises</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
                  {course.skills.map((s:string,i:number)=>(
                    <span key={i} style={{background:`${course.color}12`,color:course.color,fontSize:11,fontWeight:600,padding:"6px 12px",borderRadius:8,border:`1px solid ${course.color}28`}}>{s}</span>
                  ))}
                </div>
                <div className="cd-stats" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
                  {[
                    {l:"Durée",v:course.dur,icon:"⏱️"},
                    {l:"Vidéos",v:course.vids,icon:"🎬"},
                    {l:"Étudiants",v:course.students,icon:"👥"},
                    {l:"Note",v:`${course.rating}★`,icon:"⭐"},
                  ].map((x,i)=>(
                    <div key={i} style={{background:C.s2,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
                      <div style={{fontSize:18,marginBottom:4}}>{x.icon}</div>
                      <div style={{fontSize:14,fontWeight:800,color:C.tf}}>{x.v}</div>
                      <div style={{fontSize:9,color:C.t2,textTransform:"uppercase",letterSpacing:".08em",fontFamily:F.mono}}>{x.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <VideoPlayer course={course} enrolled={enrolled} />
              </div>
            </div>
          </>}

          {tab==="programme"&&<>
            <div style={{fontFamily:F.mono,fontSize:10,color:C.t2,letterSpacing:".1em",textTransform:"uppercase",marginBottom:14}}>
              Programme complet · {course.curriculum.reduce((a:number,c:any)=>a+c.n,0)} vidéos · {course.dur}
            </div>
            {course.curriculum.map((s:any,si:number)=>(
              <div key={si} style={{marginBottom:14,padding:14,background:C.s2,border:`1px solid ${C.bdr}`,borderRadius:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:28,height:28,borderRadius:8,background:`${course.color}18`,color:course.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800}}>{si+1}</div>
                    <div style={{fontSize:13,fontWeight:700,color:C.t}}>{s.t}</div>
                  </div>
                  <div style={{display:"flex",gap:12,fontSize:11,color:C.t2,fontFamily:F.mono}}>
                    <span>{s.n} vidéos</span><span>·</span><span>{s.d}</span>
                  </div>
                </div>
              </div>
            ))}
          </>}

          {tab==="formateur"&&<>
            <div style={{display:"flex",gap:20,alignItems:"flex-start",marginBottom:20}}>
              <div style={{width:80,height:80,borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},${C.gl})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,flexShrink:0}}>👨‍🏫</div>
              <div>
                <div style={{fontFamily:F.serif,fontSize:22,fontWeight:600,color:C.tf,marginBottom:4}}>Ibrahim Seydou</div>
                <div style={{fontSize:12,color:C.gold,marginBottom:8}}>Fondateur · Beyrey Consulting</div>
                <div style={{fontSize:13,color:C.t2,lineHeight:1.6}}>Consultant Data & BI avec 5 ans de terrain au Mali. A audité plus de 40 PME maliennes et formé 465+ étudiants. Auteur de "L'Art de la Rigueur".</div>
              </div>
            </div>
            <div style={{background:C.s2,border:`1px solid ${C.bdr}`,borderRadius:12,padding:16}}>
              <div style={{fontFamily:F.mono,fontSize:10,color:C.t2,letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>Approche pédagogique</div>
              <p style={{fontSize:13,color:C.t,lineHeight:1.7,margin:0}}>
                Chaque formation suit la méthode DIAL™ : diagnostiquer votre niveau, implémenter les bons outils, automatiser le travail manuel, livrer des compétences durables. 80% de pratique, 20% de théorie. Tous les exercices sont tirés du contexte malien.
              </p>
            </div>
          </>}
        </div>

        {/* Footer CTA */}
        <div style={{borderTop:`1px solid ${C.bdr}`,padding:"16px 24px",background:C.s2,display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <span style={{fontFamily:F.serif,fontSize:24,fontWeight:600,color:C.gold}}>{fmt(course.price)}</span>
              <span style={{fontSize:13,color:C.t3,textDecoration:"line-through"}}>{fmt(course.orig)}</span>
              <Tag c={C.red}>-{Math.round((1-course.price/course.orig)*100)}%</Tag>
            </div>
            <div style={{fontSize:10,color:C.t2,fontFamily:F.mono,marginTop:2}}>Accès à vie · Certification incluse</div>
          </div>
          {enrolled?(
            <button onClick={()=>onEnroll(course.id)} style={btn({background:C.grn,color:C.surGrn,padding:"13px 28px",borderRadius:10,fontWeight:800,fontSize:14,boxShadow:"0 6px 24px rgba(0,200,150,.3)"})}>
              ✓ Vous êtes inscrit · Accéder
            </button>
          ):(
            <button onClick={onBuy} style={btn({background:`linear-gradient(135deg,${C.gold},${C.gl})`,color:C.bg,padding:"13px 28px",borderRadius:10,fontWeight:800,fontSize:14,boxShadow:"0 6px 24px rgba(200,151,26,.4)"})}>
              Acheter cette formation →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BLOG POST MODAL
═══════════════════════════════════════════════════ */
export function BlogModal({post,onClose}:{post:any,onClose:()=>void}){
  const dialogRef=useDialog(onClose);
  useEffect(()=>{
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow="";};
  },[]);

  return(
    <div style={{position:"fixed",inset:0,zIndex:280,background:"rgba(4,8,16,.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={post.title} tabIndex={-1} style={{background:C.s1,border:`1px solid ${C.bdr}`,borderRadius:22,width:"100%",maxWidth:720,maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,.7)"}}>

        <div style={{background:`linear-gradient(135deg,${C.s1},${C.s2})`,padding:"24px 28px",borderBottom:`1px solid ${C.bdr}`,position:"relative"}}>
          <button onClick={onClose} aria-label="Fermer" style={btn({position:"absolute",top:18,right:18,background:C.bdr,color:C.t2,width:32,height:32,borderRadius:"50%",fontSize:14})}>✕</button>
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <Tag c={C.gold}>{post.icon} {post.cat}</Tag>
            <Tag c={C.t2}>{post.time} de lecture</Tag>
            <Tag c={C.t3}>{post.date}</Tag>
          </div>
          <h2 style={{fontFamily:F.serif,fontSize:28,fontWeight:600,color:C.tf,margin:0,lineHeight:1.25,paddingRight:40}}>{post.title}</h2>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:18,borderBottom:`1px solid ${C.bdr}`}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},${C.gl})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:C.bg,fontWeight:800}}>IS</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:C.tf}}>Ibrahim Seydou</div>
              <div style={{fontSize:11,color:C.t2,fontFamily:F.mono}}>Fondateur · Beyrey Consulting</div>
            </div>
          </div>
          <div style={{fontSize:15,color:C.t,lineHeight:1.8,fontFamily:F.serif}}><RichText text={post.body}/></div>
        </div>

        <div style={{borderTop:`1px solid ${C.bdr}`,padding:"16px 28px",background:C.s2,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:11,color:C.t2,fontFamily:F.mono}}>Partagez cet article</div>
          <div style={{display:"flex",gap:8}}>
            {[{s:"𝕏",l:"Partager sur X"},{s:"in",l:"Partager sur LinkedIn"},{s:"f",l:"Partager sur Facebook"},{s:"✉",l:"Partager par email"}].map((x)=>(
              <button key={x.l} aria-label={x.l} style={btn({width:34,height:34,borderRadius:"50%",background:C.bdr,color:C.t2,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"})}>{x.s}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
