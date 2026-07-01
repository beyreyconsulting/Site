import { useState, useEffect, useRef } from "react";
import { C, F, PAY, KALAN_SYS, fmt, btn, Tag } from "./data.tsx";

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
      const apiMsgs=next.filter((m,i)=>!(i===0&&m.r==="a")).map(m=>({role:m.r==="u"?"user":"assistant",content:m.t}));
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:KALAN_SYS,messages:apiMsgs})
      });
      const d=await res.json();
      setMsgs([...next,{r:"a",t:d.content?.[0]?.text||"Désolé, une erreur s'est produite."}]);
    }catch{setMsgs([...next,{r:"a",t:"Une erreur s'est produite. Réessayez dans un instant."}]);}
    finally{setBusy(false);}
  };

  const fmt2=(s:string)=>s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br>");

  return(
    <>
      <button onClick={()=>setOpen(o=>!o)} style={{position:"fixed",bottom:24,right:20,zIndex:200,width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#C8971A,#E0A820)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 28px rgba(200,151,26,.45)",fontSize:open?18:22,color:C.bg,fontWeight:open?800:400,transition:"all .25s",transform:open?"rotate(5deg)":"none"}} aria-label="Ouvrir Kalan">
        {open?"✕":"🤖"}
      </button>
      {open&&(
        <div style={{position:"fixed",bottom:88,right:16,zIndex:200,width:Math.min(360,window.innerWidth-24),height:480,background:C.s1,border:`1px solid ${C.bdr}`,borderRadius:20,display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 64px rgba(0,0,0,.7)"}}>
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
                <div style={{maxWidth:"85%",padding:"9px 13px",borderRadius:m.r==="u"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.r==="u"?C.gold:C.s2,color:m.r==="u"?C.bg:C.t,fontSize:12,lineHeight:1.65,border:m.r==="a"?`1px solid ${C.bdr}`:"none"}}
                  dangerouslySetInnerHTML={{__html:fmt2(m.t)}}/>
              </div>
            ))}
            {busy&&<div style={{display:"flex",gap:5,padding:"10px 14px",background:C.s2,borderRadius:"16px 16px 16px 4px",width:"fit-content",border:`1px solid ${C.bdr}`}}>
              {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.gold,animation:`kd 1.2s ease-in-out ${i*.2}s infinite`}}/>)}
            </div>}
            <div ref={endRef}/>
          </div>
          <div style={{borderTop:`1px solid ${C.bdr}`,padding:"10px 12px",display:"flex",gap:8,background:C.s2}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Posez votre question…"
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
   VIDEO PLAYER
═══════════════════════════════════════════════════ */
export function VideoPlayer({course,enrolled}:{course:any,enrolled:boolean}){
  const [playing,setPlaying]=useState(false);
  const [prog,setProg]=useState(0);
  const [sel,setSel]=useState(0);
  const [done,setDone]=useState<number[]>([]);
  const iv=useRef<any>(null);

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

  if(!canPlay) return(
    <div style={{background:C.s2,border:`1px solid ${C.bdr}`,borderRadius:16,overflow:"hidden"}}>
      <div style={{position:"relative",paddingBottom:"56.25%",background:"linear-gradient(135deg,#08111E,#0E1A2C)"}}>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
          <div style={{position:"absolute",inset:0,overflow:"hidden",opacity:.3}}>
            {[...Array(6)].map((_,i)=>(
              <div key={i} style={{position:"absolute",width:3,height:3,borderRadius:"50%",background:C.gold,left:`${20+i*12}%`,top:`${30+Math.sin(i)*20}%`,animation:`float ${2+i*.3}s ease-in-out ${i*.2}s infinite alternate`}}/>
            ))}
          </div>
          <div style={{width:60,height:60,borderRadius:"50%",background:`${C.bdr}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,border:`2px solid ${C.bdr2}`}}>🔒</div>
          <div style={{textAlign:"center",position:"relative",zIndex:1}}>
            <div style={{fontFamily:F.serif,fontSize:17,fontWeight:600,color:"#fff",marginBottom:6}}>Contenu verrouillé</div>
            <div style={{fontSize:12,color:C.t2}}>Inscrivez-vous pour accéder aux {totalVids} leçons</div>
          </div>
        </div>
      </div>
      <style>{`@keyframes float{to{transform:translate(4px,-4px)}}`}</style>
    </div>
  );

  return(
    <div style={{background:C.s2,border:`1px solid ${C.bdr}`,borderRadius:16,overflow:"hidden"}}>
      <div style={{position:"relative",paddingBottom:"56.25%",background:"#000"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#070F1C,#0C1828)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{position:"absolute",top:14,left:14,background:"rgba(0,0,0,.6)",borderRadius:6,padding:"3px 10px",fontFamily:F.mono,fontSize:10,color:C.t2}}>
            {course.preview&&!enrolled?"▶ APERÇU GRATUIT":`📖 ${sec?.t}`}
          </div>
          <button onClick={()=>{setPlaying(p=>!p);if(prog>=100)setProg(0);}}
            style={btn({width:60,height:60,borderRadius:"50%",background:playing?"rgba(200,151,26,.2)":"linear-gradient(135deg,#C8971A,#E0A820)",border:playing?`2px solid ${C.gold}`:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:playing?C.gold:C.bg,boxShadow:playing?"none":"0 8px 32px rgba(200,151,26,.4)",transition:"all .2s"})}>
            {playing?"⏸":"▶"}
          </button>
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0}}>
          <div onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setProg(((e.clientX-r.left)/r.width)*100);}} style={{height:4,background:"rgba(255,255,255,.15)",cursor:"pointer"}}>
            <div style={{height:"100%",width:`${prog}%`,background:C.gold,transition:"width .08s linear"}}/>
          </div>
          <div style={{background:"rgba(0,0,0,.85)",padding:"7px 14px",display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>{setPlaying(p=>!p);if(prog>=100)setProg(0);}} style={btn({background:"none",color:"#fff",fontSize:15})}>{playing?"⏸":"▶"}</button>
            <span style={{fontFamily:F.mono,fontSize:10,color:C.t2}}>{timeStr} / 48:00</span>
            <div style={{flex:1}}/>
            <span style={{fontSize:12,color:C.t2}}>⛶</span>
          </div>
        </div>
      </div>
      <div style={{padding:16,maxHeight:300,overflowY:"auto"}}>
        <div style={{fontFamily:F.mono,fontSize:10,color:C.t2,letterSpacing:".1em",textTransform:"uppercase",marginBottom:12}}>Programme · {totalVids} vidéos</div>
        {course.curriculum.map((s:any,si:number)=>{
          const base=course.curriculum.slice(0,si).reduce((a:number,c:any)=>a+c.n,0);
          return(
            <div key={si} style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.t,marginBottom:6,display:"flex",justifyContent:"space-between"}}>
                <span>{s.t}</span><span style={{fontFamily:F.mono,fontSize:10,color:C.t2}}>{s.d}</span>
              </div>
              {Array.from({length:s.n},(_,li)=>{
                const idx=base+li;
                const isDone=done.includes(idx);
                return(
                  <div key={li} onClick={()=>{setSel(si);setProg(0);setPlaying(false);setDone(d=>d.includes(idx)?d.filter(x=>x!==idx):[...d,idx]);}}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:8,cursor:"pointer",marginBottom:3,background:sel===si&&li===0?`${C.gold}15`:isDone?`${C.grn}08`:"transparent",transition:"background .15s"}}>
                    <div style={{width:18,height:18,borderRadius:4,background:isDone?C.grn:C.bdr,border:`1px solid ${isDone?C.grn:C.bdr2}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:isDone?"#fff":C.t3,flexShrink:0}}>
                      {isDone?"✓":li+1}
                    </div>
                    <span style={{fontSize:11,color:isDone?C.grn:C.t2}}>Leçon {li+1}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
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
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(4,8,16,.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.s1,border:`1px solid ${C.bdr}`,borderRadius:22,width:"100%",maxWidth:420,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,.7)"}}>

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

export { Tag };
