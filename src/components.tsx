import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C, F, PAY, fmt, btn, Tag } from "./data.tsx";
import { supabase, askKalan, track } from "./supabase";
import { useDialog } from "./a11y";

/* ═══════════════════════════════════════════════════
   SAFE MARKDOWN-LITE RENDERER (no innerHTML → no XSS)
   Supports **bold** and line breaks only.
═══════════════════════════════════════════════════ */
function renderBold(s:string, keyBase:number){
  return s.split(/(\*\*[^*]+\*\*)/g).map((part,i)=>
    part.startsWith("**")&&part.endsWith("**")
      ? <strong key={`${keyBase}-${i}`}>{part.slice(2,-2)}</strong>
      : <span key={`${keyBase}-${i}`}>{part}</span>
  );
}
export function RichText({text}:{text:string}){
  const lines=text.split("\n");
  return <>{lines.map((line,i)=>(
    <span key={i}>{renderBold(line,i)}{i<lines.length-1?<br/>:null}</span>
  ))}</>;
}

/* ═══════════════════════════════════════════════════
   KALAN AI ASSISTANT
═══════════════════════════════════════════════════ */
export function KalanAI(){
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState([{r:"a",t:"Bonjour ! Je suis **Kalan**, votre guide data chez Beyrey Consulting. Comment puis-je vous aider ? Je peux vous recommander une formation, répondre à vos questions sur Power BI, Excel, Python ou la méthode DIAL™. 😊"}]);
  const [input,setInput]=useState("");
  const [busy,setBusy]=useState(false);
  const endRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if(!open)return;
    const el=endRef.current;
    if(el&&typeof el.scrollIntoView==="function"){
      try{el.scrollIntoView({behavior:"smooth"});}catch{}
    }
  },[msgs,open]);

  const send=async()=>{
    const txt=input.trim();if(!txt||busy)return;
    const next=[...msgs,{r:"u",t:txt}];
    setMsgs(next);setInput("");setBusy(true);
    try{
      const apiMsgs=next.filter((m,i)=>!(i===0&&m.r==="a")).map(m=>({role:(m.r==="u"?"user":"assistant") as "user"|"assistant",content:m.t}));
      const text=await askKalan(apiMsgs);
      setMsgs([...next,{r:"a",t:text||"Désolé, une erreur s'est produite."}]);
    }catch{setMsgs([...next,{r:"a",t:"Une erreur s'est produite. Réessayez dans un instant."}]);}
    finally{setBusy(false);}
  };

  return(
    <>
      <button onClick={()=>setOpen(o=>!o)} style={{position:"fixed",bottom:24,right:20,zIndex:200,width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#C8971A,#E0A820)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 28px rgba(200,151,26,.45)",fontSize:open?18:22,color:C.bg,fontWeight:open?800:400,transition:"all .25s",transform:open?"rotate(5deg)":"none"}} aria-label="Ouvrir Kalan">
        {open?"✕":"🤖"}
      </button>
      {open&&(
        <div style={{position:"fixed",bottom:88,right:16,zIndex:200,width:Math.min(360,window.innerWidth-24),height:Math.min(480,window.innerHeight-120),maxHeight:"calc(100vh - 120px)",background:C.s1,border:`1px solid ${C.bdr}`,borderRadius:20,display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 64px rgba(0,0,0,.7)"}}>
          <div style={{background:C.s2,borderBottom:`1px solid ${C.bdr}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#C8971A,#E0A820)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🤖</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:14,color:"#fff"}}>Kalan</div>
              <div style={{fontSize:10,color:C.grn,fontFamily:F.mono}}>● Assistant IA · Beyrey Consulting</div>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:10}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.r==="u"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"85%",padding:"9px 13px",borderRadius:m.r==="u"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.r==="u"?C.gold:C.s2,color:m.r==="u"?C.bg:C.t,fontSize:12,lineHeight:1.65,border:m.r==="a"?`1px solid ${C.bdr}`:"none"}}>
                  <RichText text={m.t}/>
                </div>
              </div>
            ))}
            {busy&&<div style={{display:"flex",gap:5,padding:"10px 14px",background:C.s2,borderRadius:"16px 16px 16px 4px",width:"fit-content",border:`1px solid ${C.bdr}`}}>
              {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.gold,animation:`kd 1.2s ease-in-out ${i*.2}s infinite`}}/>)}
            </div>}
            <div ref={endRef}/>
          </div>
          <div style={{borderTop:`1px solid ${C.bdr}`,padding:"10px 12px",display:"flex",gap:8,background:C.s2}}>
            <input aria-label="Votre question à Kalan" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Posez votre question…"
              style={{flex:1,background:C.bg,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"9px 12px",color:C.t,fontSize:12,fontFamily:F.sans,outline:"none"}}/>
            <button onClick={send} disabled={busy||!input.trim()}
              style={btn({background:input.trim()&&!busy?C.gold:C.bdr,color:input.trim()&&!busy?C.bg:C.t2,width:36,height:36,borderRadius:10,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"})}>→</button>
          </div>
        </div>
      )}
      <style>{`@keyframes kd{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   VIDEO PLAYER - OPTIMIZED WITH LAZY LOADING
═══════════════════════════════════════════════════ */
export function VideoPlayer({course,enrolled}:{course:any,enrolled:boolean}){
  const [playing,setPlaying]=useState(false);
  const [prog,setProg]=useState(0);
  const [sel,setSel]=useState(0);
  const [done,setDone]=useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const iv=useRef<any>(null);
  const playerRef=useRef<HTMLDivElement>(null);

  // Lazy load simulation - load video only when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (playerRef.current) observer.observe(playerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(()=>{
    if(playing){iv.current=setInterval(()=>{setProg(p=>{if(p>=100){clearInterval(iv.current);setPlaying(false);return 100;}return p+.25;});},80);}
    else clearInterval(iv.current);
    return()=>clearInterval(iv.current);
  },[playing]);

  const totalVids=course.curriculum.reduce((a:number,c:any)=>a+c.n,0);
  const sec=course.curriculum[sel];
  const secs=parseInt(String(prog/100*2880));
  const timeStr=`${Math.floor(secs/60).toString().padStart(2,"0")}:${(secs%60).toString().padStart(2,"0")}`;
  const canPlay=enrolled||course.preview;

  // Course resources (mock data - in real app would come from DB)
  const resources = [
    { name: "Template Power BI - Dashboard Executif", type: "pbix", size: "2.4 MB", icon: "📊" },
    { name: "Dataset Formation - Ventes 2024.xlsx", type: "xlsx", size: "1.1 MB", icon: "📈" },
    { name: "Guide Methodologie DIAL.pdf", type: "pdf", size: "856 KB", icon: "📄" },
  ];

  if(!canPlay) return(
    <motion.div
      ref={playerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{background:C.s2,border:`1px solid ${C.bdr}`,borderRadius:16,overflow:"hidden"}}
    >
      <div style={{position:"relative",paddingBottom:"56.25%",background:"linear-gradient(135deg,#08111E,#0E1A2C)"}}>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
          <div style={{position:"absolute",inset:0,overflow:"hidden",opacity:.3}}>
            {[...Array(6)].map((_,i)=>(
              <motion.div
                key={i}
                animate={{ y: [0, -10, 0], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
                style={{position:"absolute",width:3,height:3,borderRadius:"50%",background:C.gold,left:`${20+i*12}%`,top:`${30+Math.sin(i)*20}%`}}
              />
            ))}
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{width:60,height:60,borderRadius:"50%",background:`${C.bdr}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,border:`2px solid ${C.bdr2}`}}
          >🔒</motion.div>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{textAlign:"center",position:"relative",zIndex:1}}
          >
            <div style={{fontFamily:F.serif,fontSize:17,fontWeight:600,color:"#fff",marginBottom:6}}>Contenu verrouillé</div>
            <div style={{fontSize:12,color:C.t2}}>Inscrivez-vous pour accéder aux {totalVids} leçons</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  return(
    <motion.div
      ref={playerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{background:C.s2,border:`1px solid ${C.bdr}`,borderRadius:16,overflow:"hidden"}}
    >
      {/* Video Area */}
      <div style={{position:"relative",paddingBottom:"56.25%",background:"#000"}}>
        <AnimatePresence>
          {!isLoaded && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#070F1C,#0C1828)",display:"flex",alignItems:"center",justifyContent:"center"}}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{width:40,height:40,border:`3px solid ${C.bdr}`,borderTopColor:C.gold,borderRadius:"50%"}}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#070F1C,#0C1828)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{position:"absolute",top:14,left:14,background:"rgba(0,0,0,.6)",borderRadius:6,padding:"3px 10px",fontFamily:F.mono,fontSize:10,color:C.t2}}>
            {course.preview&&!enrolled?"▶ APERÇU GRATUIT":`📖 ${sec?.t}`}
          </div>
          <motion.button
            onClick={()=>{setPlaying(p=>!p);if(prog>=100)setProg(0);}}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{width:60,height:60,borderRadius:"50%",background:playing?"rgba(200,151,26,.2)":"linear-gradient(135deg,#C8971A,#E0A820)",border:playing?`2px solid ${C.gold}`:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:playing?C.gold:C.bg,boxShadow:playing?"none":"0 8px 32px rgba(200,151,26,.4)",cursor:"pointer"}}
          >
            {playing?"⏸":"▶"}
          </motion.button>
        </div>

        {/* Progress bar */}
        <div style={{position:"absolute",bottom:0,left:0,right:0}}>
          <div onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setProg(((e.clientX-r.left)/r.width)*100);}} style={{height:4,background:"rgba(255,255,255,.15)",cursor:"pointer"}}>
            <motion.div
              style={{height:"100%",background:C.gold}}
              initial={{ width: 0 }}
              animate={{ width: `${prog}%` }}
              transition={{ duration: 0.08 }}
            />
          </div>
          <div style={{background:"rgba(0,0,0,.85)",padding:"7px 14px",display:"flex",alignItems:"center",gap:12}}>
            <motion.button
              onClick={()=>{setPlaying(p=>!p);if(prog>=100)setProg(0);}}
              whileTap={{ scale: 0.9 }}
              style={{background:"none",border:"none",color:"#fff",fontSize:15,cursor:"pointer"}}
            >{playing?"⏸":"▶"}</motion.button>
            <span style={{fontFamily:F.mono,fontSize:10,color:C.t2}}>{timeStr} / 48:00</span>
            <div style={{flex:1}}/>
            <span style={{fontSize:12,color:C.t2}}>⛶</span>
          </div>
        </div>
      </div>

      {/* Course Curriculum */}
      <div style={{padding:16,maxHeight:300,overflowY:"auto"}}>
        <div style={{fontFamily:F.mono,fontSize:10,color:C.t2,letterSpacing:".1em",textTransform:"uppercase",marginBottom:12}}>Programme · {totalVids} vidéos</div>
        {course.curriculum.map((s:any,si:number)=>{
          const base=course.curriculum.slice(0,si).reduce((a:number,c:any)=>a+c.n,0);
          return(
            <motion.div
              key={si}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: si * 0.05 }}
              style={{marginBottom:12}}
            >
              <div style={{fontSize:12,fontWeight:700,color:C.t,marginBottom:6,display:"flex",justifyContent:"space-between"}}>
                <span>{s.t}</span><span style={{fontFamily:F.mono,fontSize:10,color:C.t2}}>{s.d}</span>
              </div>
              {Array.from({length:s.n},(_,li)=>{
                const idx=base+li;
                const isDone=done.includes(idx);
                return(
                  <motion.div
                    key={li}
                    onClick={()=>{setSel(si);setProg(0);setPlaying(false);setDone(d=>d.includes(idx)?d.filter(x=>x!==idx):[...d,idx]);}}
                    whileHover={{ backgroundColor: `${C.gold}20` }}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:8,cursor:"pointer",marginBottom:3,background:sel===si&&li===0?`${C.gold}15`:isDone?`${C.grn}08`:"transparent"}}
                  >
                    <motion.div
                      animate={{ scale: isDone ? [1, 1.2, 1] : 1 }}
                      transition={{ duration: 0.3 }}
                      style={{width:18,height:18,borderRadius:4,background:isDone?C.grn:C.bdr,border:`1px solid ${isDone?C.grn:C.bdr2}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:isDone?"#fff":C.t3,flexShrink:0}}
                    >
                      {isDone?"✓":li+1}
                    </motion.div>
                    <span style={{fontSize:11,color:isDone?C.grn:C.t2}}>Leçon {li+1}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          );
        })}
      </div>

      {/* Resources Section */}
      {enrolled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{borderTop:`1px solid ${C.bdr}`,padding:16}}
        >
          <button
            onClick={() => setShowResources(r => !r)}
            style={btn({width:"100%",background:C.s1,border:`1px solid ${C.bdr}`,color:C.t,padding:"12px 16px",borderRadius:10,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"})}
          >
            <span style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18}}>📎</span>
              Ressources de la formation ({resources.length})
            </span>
            <motion.span
              animate={{ rotate: showResources ? 180 : 0 }}
              style={{display:"inline-block"}}
            >▾</motion.span>
          </button>

          <AnimatePresence>
            {showResources && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{overflow:"hidden"}}
              >
                <div style={{paddingTop:12,display:"flex",flexDirection:"column",gap:8}}>
                  {resources.map((res, i) => (
                    <motion.a
                      key={i}
                      href="#"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ backgroundColor: `${C.gold}15`, x: 4 }}
                      style={{
                        display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:C.s1,border:`1px solid ${C.bdr}`,borderRadius:10,textDecoration:"none",cursor:"pointer"
                      }}
                    >
                      <div style={{width:40,height:40,borderRadius:8,background:`${C.gold}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                        {res.icon}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{res.name}</div>
                        <div style={{fontSize:10,color:C.t2,fontFamily:F.mono,marginTop:2}}>{res.type.toUpperCase()} · {res.size}</div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{width:32,height:32,borderRadius:8,background:C.gold,color:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,flexShrink:0}}
                      >
                        ⬇
                      </motion.div>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   PAYMENT MODAL
═══════════════════════════════════════════════════ */
export function PaymentModal({course,onClose,onSuccess}:{course:any,onClose:()=>void,onSuccess:()=>void}){
  const [step,setStep]=useState(1);
  const [method,setMethod]=useState<any>(null);
  const [phone,setPhone]=useState("");
  const [card,setCard]=useState({n:"",e:"",c:"",nm:""});
  const [err,setErr]=useState("");

  const validate=()=>{
    setErr("");
    if(method?.id!=="card"){const p=phone.replace(/\D/g,"");if(p.length<8){setErr("Numéro invalide (8 chiffres minimum)");return false;}}
    else{if(card.n.replace(/\D/g,"").length<16){setErr("Numéro de carte incomplet (16 chiffres)");return false;}}
    return true;
  };
  const pay=()=>{if(!validate())return;setStep(3);setTimeout(()=>setStep(4),2800);};

  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(4,8,16,.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.s1,border:`1px solid ${C.bdr}`,borderRadius:22,width:"100%",maxWidth:420,maxHeight:"92vh",overflowY:"auto",overflowX:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,.7)"}}>

        {step===1&&<>
          <div style={{background:C.s2,padding:"18px 20px",borderBottom:`1px solid ${C.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>Choisir le paiement</div>
              <div style={{fontFamily:F.mono,fontSize:11,color:C.gold}}>{fmt(course.price)} · {course.title.substring(0,30)}{course.title.length>30?"…":""}</div>
            </div>
            <button onClick={onClose} style={btn({background:C.bdr,color:C.t2,width:30,height:30,borderRadius:"50%",fontSize:14})}>✕</button>
          </div>
          <div style={{padding:20}}>
            <div style={{fontSize:12,fontWeight:700,color:C.t,marginBottom:14}}>Sélectionnez votre mode de paiement</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
              {PAY.map(m=>(
                <button key={m.id} onClick={()=>setMethod(m)}
                  style={btn({background:method?.id===m.id?`${m.color}18`:C.s2,border:`1px solid ${method?.id===m.id?m.color:C.bdr}`,borderRadius:12,padding:"14px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all .2s"})}>
                  <span style={{fontSize:26}}>{m.icon}</span>
                  <span style={{fontSize:11,fontWeight:700,color:method?.id===m.id?m.color:C.t}}>{m.name}</span>
                </button>
              ))}
            </div>
            <div style={{background:`${C.gold}10`,border:`1px solid ${C.gold}25`,borderRadius:10,padding:"9px 14px",fontSize:11,color:C.t,marginBottom:16}}>
              🔒 Paiement sécurisé · Accès immédiat après confirmation
            </div>
            <button onClick={()=>{if(method)setStep(2);}} style={btn({width:"100%",background:method?C.gold:C.bdr,color:method?C.bg:C.t3,fontWeight:800,fontSize:14,padding:14,borderRadius:10,transition:"all .2s"})}>Continuer →</button>
          </div>
        </>}

        {step===2&&<>
          <div style={{background:C.s2,padding:"14px 18px",borderBottom:`1px solid ${C.bdr}`,display:"flex",gap:10,alignItems:"center"}}>
            <button onClick={()=>setStep(1)} style={btn({background:C.bdr,color:C.t2,width:30,height:30,borderRadius:"50%",fontSize:14})}>←</button>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{method?.icon} {method?.name}</div>
              <div style={{fontFamily:F.mono,fontSize:10,color:C.gold}}>{fmt(course.price)}</div>
            </div>
          </div>
          <div style={{padding:20}}>
            {method?.id!=="card"?<>
              <div style={{fontSize:12,color:C.t2,marginBottom:14,lineHeight:1.6}}>Entrez votre numéro {method?.name}. Vous recevrez un message USSD pour confirmer.</div>
              <div style={{marginBottom:14}}>
                <div style={{fontFamily:F.mono,fontSize:10,color:C.t2,letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Numéro de téléphone</div>
                <div style={{display:"flex",gap:8}}>
                  <div style={{background:C.s2,border:`1px solid ${C.bdr}`,borderRadius:8,padding:"11px 12px",fontFamily:F.mono,fontSize:12,color:C.t2,flexShrink:0}}>+223</div>
                  <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,"").substring(0,8))} placeholder="76 00 00 00" maxLength={8}
                    style={{flex:1,background:C.s2,border:`1px solid ${err?C.red:C.bdr}`,borderRadius:8,padding:"11px 14px",color:C.t,fontFamily:F.mono,fontSize:14,outline:"none"}}/>
                </div>
              </div>
              <div style={{background:`${method?.color}10`,border:`1px solid ${method?.color}30`,borderRadius:10,padding:"9px 14px",fontSize:11,color:C.t,marginBottom:14}}>
                {method?.icon} Vous recevrez un code USSD pour valider le paiement de {fmt(course.price)}
              </div>
            </>:<>
              <div style={{marginBottom:14}}>
                <div style={{fontFamily:F.mono,fontSize:10,color:C.t2,letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Numéro de carte</div>
                <input value={card.n} onChange={e=>setCard({...card, n:e.target.value.replace(/\D/g,"")})} placeholder="0000 0000 0000 0000" maxLength={16}
                  style={{width:"100%",background:C.s2,border:`1px solid ${err?C.red:C.bdr}`,borderRadius:8,padding:"11px 14px",color:C.t,fontFamily:F.mono,fontSize:14,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                 <div>
                   <div style={{fontFamily:F.mono,fontSize:10,color:C.t2,letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Expiration</div>
                   <input value={card.e} onChange={e=>setCard({...card, e:e.target.value})} placeholder="MM/AA" maxLength={5} style={{width:"100%",background:C.s2,border:`1px solid ${C.bdr}`,borderRadius:8,padding:"11px 14px",color:C.t,fontFamily:F.mono,fontSize:14,outline:"none",boxSizing:"border-box"}}/>
                 </div>
                 <div>
                   <div style={{fontFamily:F.mono,fontSize:10,color:C.t2,letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>CVC</div>
                   <input value={card.c} onChange={e=>setCard({...card, c:e.target.value.replace(/\D/g,"")})} placeholder="123" maxLength={3} style={{width:"100%",background:C.s2,border:`1px solid ${C.bdr}`,borderRadius:8,padding:"11px 14px",color:C.t,fontFamily:F.mono,fontSize:14,outline:"none",boxSizing:"border-box"}}/>
                 </div>
              </div>
            </>}
            {err && <div style={{color:C.red, fontSize:11, marginBottom:14}}>{err}</div>}
            <button onClick={pay} style={btn({width:"100%",background:C.gold,color:C.bg,fontWeight:800,fontSize:14,padding:14,borderRadius:10,transition:"all .2s"})}>
               Payer {fmt(course.price)}
            </button>
          </div>
        </>}

        {step===3&&<div style={{padding:40,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
           <div style={{width:40,height:40,border:`3px solid ${C.bdr}`,borderTopColor:C.gold,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
           <div style={{fontSize:14,color:C.t}}>Traitement du paiement en cours...</div>
           <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>}

        {step===4&&<div style={{padding:40,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,textAlign:"center"}}>
           <div style={{width:60,height:60,borderRadius:"50%",background:C.grn,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,color:"#fff"}}>✓</div>
           <div>
             <div style={{fontSize:18,fontWeight:800,color:"#fff",marginBottom:6}}>Paiement réussi !</div>
             <div style={{fontSize:12,color:C.t2,marginBottom:20}}>Vous avez maintenant accès à la formation.</div>
             <button onClick={()=>{onSuccess();onClose();}} style={btn({background:C.gold,color:C.bg,padding:"10px 20px",borderRadius:8,fontWeight:700})}>
               Commencer la formation
             </button>
           </div>
        </div>}

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BOOK DOWNLOAD MODAL
═══════════════════════════════════════════════════ */
export function BookDownloadModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useDialog(onClose);
  const [form, setForm] = useState({ nom: "", email: "", entreprise: "", poste: "" });
  const [err, setErr] = useState<Partial<typeof form>>({});
  const [step, setStep] = useState<"form" | "loading" | "done">("form");
  const [submitErr, setSubmitErr] = useState("");

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.nom.trim()) e.nom = "Requis";
    if (!form.email.trim()) e.email = "Requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email invalide";
    return e;
  };

  const submit = async () => {
    const errors = validate();
    if (Object.keys(errors).length) { setErr(errors); return; }
    setStep("loading");
    setSubmitErr("");
    const { error } = await supabase.from("book_leads").insert({
      nom: form.nom.trim(),
      email: form.email.trim(),
      entreprise: form.entreprise.trim() || null,
      poste: form.poste.trim() || null,
    });
    if (error) {
      setSubmitErr("Une erreur s'est produite. Réessayez.");
      setStep("form");
      return;
    }
    track("lead_magnet_download", { magnet: "ebook-art-de-la-rigueur" });
    setStep("done");
    const a = document.createElement("a");
    a.href = "/L_Art_de_la_Rigueur.pdf";
    a.download = "L_Art_de_la_Rigueur_Beyrey_Consulting.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const inp = (field: keyof typeof form) => ({
    value: form[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      setErr(er => ({ ...er, [field]: undefined }));
    },
    style: {
      width: "100%", background: C.s2, border: `1px solid ${err[field] ? C.red : C.bdr}`,
      borderRadius: 10, padding: "12px 14px", color: C.t, fontSize: 14,
      fontFamily: F.sans, outline: "none", boxSizing: "border-box" as const,
      transition: "border-color .2s",
    },
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(4,8,16,.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Télécharger le livre blanc" tabIndex={-1} style={{ background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 22, width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", overflowX: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.7)" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#0E1A2C,#162438)", borderBottom: `1px solid ${C.bdr}`, padding: "24px 28px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: `${C.gold}18`, border: `1px solid ${C.gold}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>📖</div>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.gold, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>Livre blanc · Gratuit</div>
                <div style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>L'Art de la Rigueur</div>
                <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>Manifeste pour une gouvernance frugale de la data en Afrique</div>
              </div>
            </div>
            <button onClick={onClose} aria-label="Fermer" style={btn({ background: C.bdr, color: C.t2, width: 30, height: 30, borderRadius: "50%", fontSize: 14, flexShrink: 0 })}>✕</button>
          </div>
        </div>

        {step === "form" && (
          <div style={{ padding: "24px 28px 28px" }}>
            <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.65, margin: "0 0 22px" }}>
              Renseignez vos informations pour recevoir votre exemplaire. Le téléchargement démarrera immédiatement.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>
                  Nom complet <span style={{ color: C.red }}>*</span>
                </div>
                <input {...inp("nom")} placeholder="Ibrahim Seydou" />
                {err.nom && <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{err.nom}</div>}
              </div>

              <div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>
                  Email professionnel <span style={{ color: C.red }}>*</span>
                </div>
                <input {...inp("email")} placeholder="vous@entreprise.com" type="email" />
                {err.email && <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{err.email}</div>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Entreprise</div>
                  <input {...inp("entreprise")} placeholder="Beyrey Consulting" />
                </div>
                <div>
                  <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Poste</div>
                  <input {...inp("poste")} placeholder="Directeur Data" />
                </div>
              </div>
            </div>

            {submitErr && (
              <div style={{ marginTop: 14, background: `${C.red}12`, border: `1px solid ${C.red}30`, borderRadius: 8, padding: "9px 14px", fontSize: 12, color: C.red }}>{submitErr}</div>
            )}

            <div style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}25`, borderRadius: 10, padding: "9px 14px", fontSize: 11, color: C.t, margin: "18px 0 0" }}>
              🔒 Vos données sont confidentielles. Aucune revente, aucun spam.
            </div>

            <button onClick={submit} style={btn({ width: "100%", background: "linear-gradient(135deg,#C8971A,#E0A820)", color: C.bg, fontWeight: 800, fontSize: 14, padding: 14, borderRadius: 10, marginTop: 14, boxShadow: "0 6px 24px rgba(200,151,26,.3)" })}>
              Télécharger gratuitement →
            </button>
          </div>
        )}

        {step === "loading" && (
          <div style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ width: 40, height: 40, border: `3px solid ${C.bdr}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 14, color: C.t }}>Préparation du téléchargement…</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {step === "done" && (
          <div style={{ padding: "28px 28px 36px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.grn, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: "#fff", boxShadow: `0 8px 24px ${C.grn}50` }}>✓</div>
            <div>
              <div style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Votre téléchargement a démarré !</div>
              <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.65, maxWidth: 340 }}>
                Si le téléchargement ne démarre pas automatiquement,{" "}
                <a href="/L_Art_de_la_Rigueur.pdf" download="L_Art_de_la_Rigueur_Beyrey_Consulting.pdf" style={{ color: C.gold, textDecoration: "underline" }}>cliquez ici</a>.
              </div>
            </div>
            <button onClick={onClose} style={btn({ background: C.s2, color: C.t, border: `1px solid ${C.bdr2}`, padding: "10px 24px", borderRadius: 10, fontWeight: 700, fontSize: 13, marginTop: 6 })}>
              Fermer
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export { Tag };
