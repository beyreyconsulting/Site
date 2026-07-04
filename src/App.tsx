import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C, F, COURSES, POSTS, DIAL, TESTIMONIALS, STATS, fmt, btn, Tag } from "./data.tsx";
import { KalanAI, VideoPlayer, PaymentModal, BookDownloadModal } from "./components";
import { CourseDetailModal, BlogModal } from "./modals";
import { AdminPanel } from "./admin";
import { CourseViewer, CourseCatalog } from "./lms";
import { useAuth, AuthModal, StudentDashboard, CartModal, useCart, useEnrollments } from "./student";
import { fadeInUp, fadeIn, staggerContainer, staggerItem, hoverScale, hoverLift, tapScale } from "./motion";

/* ═══════════════════════════════════════════════════
   HEADER - CONSULTING & KALAN SEPARATED
═══════════════════════════════════════════════════ */
function Header({onNav, user, profile, cartCount, onShowAuth, onShowCart}:{onNav:(id:string)=>void; user: any; profile: any; cartCount: number; onShowAuth: ()=>void; onShowCart: ()=>void}){
  const [scrolled,setScrolled]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [activeSection, setActiveSection] = useState<"consulting" | "kalan">("consulting");

  useEffect(()=>{
    const onScroll=()=>setScrolled(window.scrollY>20);
    window.addEventListener("scroll",onScroll);
    return()=>window.removeEventListener("scroll",onScroll);
  },[]);

  const consultingLinks=[
    {l:"Services",id:"formations"},
    {l:"Méthode DIAL™",id:"methode"},
    {l:"Témoignages",id:"temoignages"},
    {l:"Blog",id:"blog"},
    {l:"À propos",id:"apropos"},
  ];

  return(
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{position:"fixed",top:0,left:0,right:0,zIndex:100,transition:"all .3s",background:scrolled?"rgba(8,17,30,.95)":"transparent",backdropFilter:scrolled?"blur(16px)":"none",borderBottom:scrolled?`1px solid ${C.bdr}`:"1px solid transparent"}}
    >
      {/* Brand Switcher Bar */}
      <AnimatePresence>
        {scrolled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{background:"rgba(200,151,26,.08)",borderBottom:`1px solid ${C.bdr}`,overflow:"hidden"}}
          >
            <div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px",display:"flex",gap:16}}>
              <motion.button
                onClick={() => setActiveSection("consulting")}
                whileHover={{ backgroundColor: "rgba(200,151,26,.15)" }}
                style={{
                  background: activeSection === "consulting" ? `${C.gold}20` : "transparent",
                  border: "none",
                  borderBottom: activeSection === "consulting" ? `2px solid ${C.gold}` : "2px solid transparent",
                  color: activeSection === "consulting" ? C.gold : C.t2,
                  padding: "8px 16px",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: F.mono,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                💼 Consulting Entreprise
              </motion.button>
              <motion.button
                onClick={() => { setActiveSection("kalan"); window.location.hash = "lms"; }}
                whileHover={{ backgroundColor: "rgba(0,200,150,.15)" }}
                style={{
                  background: activeSection === "kalan" ? `${C.grn}15` : "transparent",
                  border: "none",
                  borderBottom: activeSection === "kalan" ? `2px solid ${C.grn}` : "2px solid transparent",
                  color: activeSection === "kalan" ? C.grn : C.t2,
                  padding: "8px 16px",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: F.mono,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                🎓 Académie Kalan
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <motion.div
          onClick={()=>onNav("hero")}
          whileHover={{ scale: 1.02 }}
          style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}
        >
          <motion.img
            src="/logo.png"
            alt="Beyrey Consulting"
            style={{width:40,height:40,objectFit:"contain",borderRadius:8}}
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.4 }}
          />
          <div>
            <div style={{fontFamily:F.serif,fontSize:18,fontWeight:600,color:"#fff",lineHeight:1}}>Beyrey</div>
            <div style={{fontFamily:F.mono,fontSize:9,color:C.gold,letterSpacing:".15em",textTransform:"uppercase"}}>Consulting</div>
          </div>
        </motion.div>

        <nav style={{display:"flex",gap:28,alignItems:"center"}}>
          {consultingLinks.map((x, i) => (
            <motion.button
              key={x.id}
              onClick={()=>onNav(x.id)}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              style={btn({background:"none",color:C.t2,fontSize:13,fontWeight:600,padding:"6px 0",borderBottom:"2px solid transparent"})}
            >
              {x.l}
            </motion.button>
          ))}
          <motion.button
            onClick={()=>{ window.location.hash = "lms"; }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: consultingLinks.length * 0.05 }}
            whileHover={{ y: -2, color: C.gold }}
            style={btn({background:`${C.gold}12`,border:`1px solid ${C.gold}30`,color:C.gold,fontSize:12,fontWeight:700,padding:"6px 14px",borderRadius:8})}
          >
            🎓 Kalan
          </motion.button>
        </nav>

        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {user && (
            <motion.button
              onClick={onShowCart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={btn({background:C.s2,border:`1px solid ${C.bdr}`,color:C.t,padding:"8px 12px",borderRadius:10,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6})}
            >
              🛒 {cartCount > 0 && <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{background:C.gold,color:C.bg,borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}
              >{cartCount}</motion.span>}
            </motion.button>
          )}
          {user ? (
            <motion.button
              onClick={()=>{ window.location.hash = "student"; }}
              whileHover={{ scale: 1.05, backgroundColor: `${C.gold}25` }}
              whileTap={{ scale: 0.95 }}
              style={btn({background:`${C.gold}18`,border:`1px solid ${C.gold}30`,color:C.gold,padding:"8px 14px",borderRadius:10,fontSize:13,fontWeight:700})}
            >
              {profile?.full_name?.split(" ")[0] || "Espace"} ▾
            </motion.button>
          ) : (
            <motion.button
              onClick={onShowAuth}
              whileHover={{ scale: 1.05, borderColor: C.gold }}
              whileTap={{ scale: 0.95 }}
              style={btn({background:"none",color:C.t2,border:`1px solid ${C.bdr}`,padding:"8px 14px",borderRadius:10,fontSize:13,fontWeight:600})}
            >
              Connexion
            </motion.button>
          )}
          <motion.button
            onClick={()=>onNav("contact")}
            className="hide-mobile"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            style={btn({background:"linear-gradient(135deg,#C8971A,#E0A820)",color:C.bg,padding:"10px 20px",borderRadius:10,fontWeight:700,fontSize:13,boxShadow:"0 4px 16px rgba(200,151,26,.3)"})}
          >
            Nous contacter
          </motion.button>
          <motion.button
            onClick={()=>setMobileOpen(true)}
            whileHover={{ backgroundColor: C.s3 }}
            whileTap={{ scale: 0.9 }}
            style={btn({display:"none",background:C.s2,color:C.t,border:`1px solid ${C.bdr}`,width:38,height:38,borderRadius:10,fontSize:18})}
            className="mobile-only"
          >☰</motion.button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{position:"fixed",inset:0,zIndex:200,background:"rgba(4,8,16,.95)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24}}
          >
            <motion.button
              onClick={()=>setMobileOpen(false)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={btn({position:"absolute",top:20,right:20,background:C.s2,color:C.t,width:40,height:40,borderRadius:"50%",fontSize:18})}
            >✕</motion.button>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20}}
            >
              {consultingLinks.map((x, i) => (
                <motion.button
                  key={x.id}
                  variants={staggerItem}
                  onClick={()=>{onNav(x.id);setMobileOpen(false);}}
                  style={btn({background:"none",color:C.t,fontSize:22,fontFamily:F.serif})}
                >{x.l}</motion.button>
              ))}
              <motion.button
                variants={staggerItem}
                onClick={()=>{ window.location.hash = "lms"; setMobileOpen(false); }}
                style={btn({background:`${C.gold}18`,border:`1px solid ${C.gold}30`,color:C.gold,padding:"12px 24px",borderRadius:10,fontSize:18,fontFamily:F.serif,fontWeight:700})}
              >🎓 Académie Kalan</motion.button>
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={()=>{onNav("contact");setMobileOpen(false);}}
              style={btn({background:"linear-gradient(135deg,#C8971A,#E0A820)",color:C.bg,padding:"14px 32px",borderRadius:10,fontWeight:700,fontSize:15,marginTop:20})}
            >Nous contacter</motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* ═══════════════════════════════════════════════════
   HERO - ROI-FOCUSED CONSULTING LANDING
═══════════════════════════════════════════════════ */
function Hero({onNav,onExplore}:{onNav:(id:string)=>void,onExplore:()=>void}){
  return(
    <section id="hero" style={{position:"relative",padding:"140px 24px 100px",overflow:"hidden"}}>
      {/* Animated Background */}
      <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        {[...Array(60)].map((_,i)=>(
          <motion.div
            key={i}
            animate={{
              opacity: [0.1, 0.6, 0.1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
            style={{position:"absolute",width:Math.random()*3+1,height:Math.random()*3+1,borderRadius:"50%",background:C.gold,left:`${Math.random()*100}%`,top:`${Math.random()*100}%`}}
          />
        ))}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.12, 0.08] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{position:"absolute",top:"-20%",right:"-10%",width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(200,151,26,.1),transparent 70%)"}}
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{position:"absolute",bottom:"-30%",left:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,200,150,.08),transparent 70%)"}}
        />
      </div>

      <div className="hero-grid" style={{maxWidth:1200,margin:"0 auto",position:"relative",display:"grid",gridTemplateColumns:"1.15fr .85fr",gap:80,alignItems:"center"}}>
        <div>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{display:"inline-flex",alignItems:"center",gap:8,background:`${C.gold}12`,border:`1px solid ${C.gold}28`,borderRadius:24,padding:"8px 16px",marginBottom:28}}
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{width:8,height:8,borderRadius:"50%",background:C.grn}}
            />
            <span style={{fontFamily:F.mono,fontSize:11,color:C.gold,letterSpacing:".1em"}}>CABINET DATA & BI · BAMAKO</span>
          </motion.div>

          {/* Headline - ROI Focused */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hero-title"
            style={{fontFamily:F.serif,fontSize:68,fontWeight:600,color:"#fff",lineHeight:1.05,margin:"0 0 24px",letterSpacing:"-0.02em"}}
          >
            Transformez vos<br/>
            <span style={{color:C.gold,fontStyle:"italic"}}>données en décisions.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{fontSize:18,color:C.t2,lineHeight:1.75,maxWidth:540,margin:"0 0 36px"}}
          >
            <strong style={{color:C.t}}>Beyrey Consulting</strong> aide les entreprises maliennes à exploiter la puissance de leurs données.
            <span style={{color:C.gold,fontWeight:700}}> ROI prouvé, méthodologie éprouvée DIAL™.</span>
          </motion.p>

          {/* ROI Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{display:"flex",gap:28,marginBottom:36,flexWrap:"wrap"}}
          >
            {[
              { value: "+40%", label: "Gain d'efficacité" },
              { value: "50+", label: "Entreprises formées" },
              { value: "3x", label: "ROI moyen" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <span style={{ fontFamily: F.serif, fontSize: 32, fontWeight: 700, color: C.gold }}>{stat.value}</span>
                <span style={{ fontSize: 11, color: C.t2, fontFamily: F.mono, letterSpacing: ".04em" }}>{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}
          >
            <motion.button
              onClick={()=>onNav("contact")}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              style={{background:"linear-gradient(135deg,#C8971A,#E0A820)",border:"none",color:C.bg,padding:"16px 32px",borderRadius:12,fontWeight:800,fontSize:15,boxShadow:"0 8px 32px rgba(200,151,26,.4)",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}
            >
              Réserver un appel <span style={{fontSize:18}}>→</span>
            </motion.button>
            <motion.button
              onClick={()=>onNav("formations")}
              whileHover={{ scale: 1.05, backgroundColor: C.s3 }}
              whileTap={{ scale: 0.95 }}
              style={{background:C.s2,color:C.t,border:`1px solid ${C.bdr2}`,padding:"16px 28px",borderRadius:12,fontWeight:700,fontSize:15,cursor:"pointer"}}
            >
              Voir nos services
            </motion.button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{display:"flex",gap:24,alignItems:"center",marginTop:24,paddingTop:24,borderTop:`1px solid ${C.bdr}`,flexWrap:"wrap"}}
          >
            {STATS.slice(0,3).map((s,i)=>(
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <div style={{fontFamily:F.serif,fontSize:26,fontWeight:700,color:C.t,lineHeight:1}}>{s.n}</div>
                <div style={{fontSize:10,color:C.t2,fontFamily:F.mono,letterSpacing:".06em",textTransform:"uppercase",marginTop:2}}>{s.l}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Hero card — featured course preview with animation */}
        <motion.div
          initial={{ opacity: 0, x: 40, rotateY: -10 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          style={{position:"relative",perserspective:"1000px"}}
        >
          <motion.div
            whileHover={{ y: -8, boxShadow: "0 40px 100px rgba(0,0,0,.6)" }}
            style={{background:"linear-gradient(160deg,#0E1A2C,#162438)",border:`1px solid ${C.bdr}`,borderRadius:24,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,.5)"}}
          >
            <div style={{padding:24,paddingBottom:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <Tag c={C.gold}>⭐ Formation phare</Tag>
                <span style={{fontFamily:F.mono,fontSize:10,color:C.t2}}>★ 4.9 · 147 étudiants</span>
              </div>
              <div style={{fontFamily:F.serif,fontSize:24,fontWeight:600,color:"#fff",marginBottom:8}}>Power BI pour PME Maliennes</div>
              <div style={{fontSize:13,color:C.t2,marginBottom:20}}>De zéro à votre premier dashboard professionnel</div>
            </div>
            <div style={{padding:"0 24px 24px"}}>
              <VideoPlayer course={COURSES[0]} enrolled={false} />
            </div>
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
            style={{position:"absolute",right:-16,top:-16,background:C.gold,color:C.bg,padding:"10px 16px",borderRadius:12,fontSize:12,fontWeight:800,fontFamily:F.mono,transform:"rotate(8deg)",boxShadow:"0 8px 24px rgba(200,151,26,.5)"}}
          >
            -25% LANCEMENT
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION TITLE - WITH ANIMATION
═══════════════════════════════════════════════════ */
function SectionTitle({tag,title,sub,center}:{tag:string,title:React.ReactNode,sub?:string,center?:boolean}){
  return(
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      style={{maxWidth:680,margin:center?"0 auto 48px":"0 0 40px",textAlign:center?"center":"left"}}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        style={{fontFamily:F.mono,fontSize:11,color:C.gold,letterSpacing:".15em",textTransform:"uppercase",marginBottom:12}}
      >{tag}</motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="section-title"
        style={{fontFamily:F.serif,fontSize:42,fontWeight:600,color:"#fff",lineHeight:1.15,margin:"0 0 14px",letterSpacing:"-0.01em"}}
      >{title}</motion.h2>
      {sub && <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        style={{fontSize:15,color:C.t2,lineHeight:1.7,margin:0}}
      >{sub}</motion.p>}
    </motion.div>
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
function DialSection({onDownload}:{onDownload:()=>void}){
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

        <div className="dial-book" style={{background:"linear-gradient(135deg,#0E1A2C,#162438)",border:`1px solid ${C.bdr}`,borderRadius:20,padding:32,display:"grid",gridTemplateColumns:"1fr 1fr",gap:32,alignItems:"center"}}>
          <div>
            <Tag c={C.gold}>📚 LIVRE BLANC</Tag>
            <h3 style={{fontFamily:F.serif,fontSize:28,fontWeight:600,color:"#fff",margin:"14px 0 12px",lineHeight:1.2}}>L'Art de la Rigueur</h3>
            <p style={{fontSize:14,color:C.t2,lineHeight:1.7,margin:"0 0 20px"}}>
              Manifeste pour une gouvernance frugale de la data en Afrique. Écrit par Ibrahim Seydou après 5 ans de terrain à Bamako. Disponible en téléchargement gratuit.
            </p>
            <button onClick={onDownload} style={btn({background:"linear-gradient(135deg,#C8971A,#E0A820)",color:C.bg,padding:"12px 24px",borderRadius:10,fontWeight:700,fontSize:13})}>
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
      <div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"center"}} className="about-grid">
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
              <img src="/tof.jpg" alt="Ibrahim Seydou" style={{width:72,height:72,borderRadius:"50%",objectFit:"cover",border:"2px solid #C8971A"}}/>
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
      <div style={{background:"linear-gradient(135deg,#0E1A2C,#162438)",border:`1px solid ${C.bdr}`,borderRadius:24,overflow:"hidden",display:"grid",gridTemplateColumns:"1fr 1fr"}} className="contact-grid">
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
              +223 92 97 66 46
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
            <img src="/logo.png" alt="Beyrey Consulting" style={{width:36,height:36,objectFit:"contain",borderRadius:8}}/>
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
            📍 Bamako, Mali<br/>✉️ contact@beyrey.consulting<br/>💬 +223 92 97 66 46
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
type Route = "home" | "admin" | "lms-catalog" | "lms-course" | "student";

function parseHash(): { route: Route; courseId?: string } {
  const hash = window.location.hash.slice(1);
  if (hash === "admin") return { route: "admin" };
  if (hash === "student") return { route: "student" };
  if (hash === "lms") return { route: "lms-catalog" };
  if (hash.startsWith("lms/")) return { route: "lms-course", courseId: hash.slice(4) };
  return { route: "home" };
}

export default function App() {
  const [route, setRoute] = useState<Route>("home");
  const [lmsCourseId, setLmsCourseId] = useState<string | undefined>();
  const [showPayment,setShowPayment]=useState(false);
  const [payCourse,setPayCourse]=useState<any>(null);
  const [detailCourse,setDetailCourse]=useState<any>(null);
  const [blogPost,setBlogPost]=useState<any>(null);
  const [enrolled,setEnrolled]=useState<number[]>([]);
  const [showBook,setShowBook]=useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const { user, profile, loading: authLoading, signIn, signOut } = useAuth();
  const { addToCart, count: cartCount } = useCart(user);

  // Hash routing
  useEffect(() => {
    const updateRoute = () => {
      const parsed = parseHash();
      setRoute(parsed.route);
      setLmsCourseId(parsed.courseId);
    };
    updateRoute();
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);

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

  // Admin route
  if (route === "admin") {
    return <AdminPanel />;
  }

  // Student dashboard route
  if (route === "student") {
    if (!user) {
      return (
        <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.t, marginBottom: 8 }}>Connexion requise</div>
            <div style={{ fontSize: 13, color: C.t2, marginBottom: 20 }}>Connectez-vous pour acceder a votre espace etudiant.</div>
            <button onClick={() => setShowAuth(true)} style={btn({ background: C.gold, color: C.bg, padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14 })}>
              Se connecter
            </button>
          </div>
          {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={() => setShowAuth(false)} />}
        </div>
      );
    }
    return <StudentDashboard user={user} profile={profile} onSignOut={async () => { await signOut(); window.location.hash = ""; }} onViewCourse={(id) => { window.location.hash = `lms/${id}`; }} />;
  }

  // LMS Catalog route
  if (route === "lms-catalog") {
    return (
      <CourseCatalog
        onSelectCourse={(id) => { window.location.hash = `lms/${id}`; }}
        onBack={() => { window.location.hash = ""; }}
        user={user}
        onAddToCart={async (courseId) => { await addToCart(courseId); setShowCart(true); }}
      />
    );
  }

  // LMS Course Viewer route
  if (route === "lms-course" && lmsCourseId) {
    return (
      <CourseViewer
        courseId={lmsCourseId}
        onBack={() => { window.location.hash = "lms"; }}
        user={user}
      />
    );
  }

  // Home route (default)
  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.t,fontFamily:F.sans,overflowX:"hidden"}}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @media(max-width:768px){
          .mobile-only{display:flex !important;}
          nav{display:none !important;}
          .hero-grid{grid-template-columns:1fr !important;gap:32px !important;}
          .hero-title{font-size:40px !important;}
          .about-grid{grid-template-columns:1fr !important;gap:32px !important;}
          .contact-grid{grid-template-columns:1fr !important;}
          .dial-book{grid-template-columns:1fr !important;}
          .section-title{font-size:30px !important;}
          .hide-mobile{display:none !important;}
        }
        @media(max-width:480px){
          .hero-title{font-size:32px !important;}
          .section-title{font-size:26px !important;}
        }
      `}</style>

      <Header onNav={nav} user={user} profile={profile} cartCount={cartCount} onShowAuth={()=>setShowAuth(true)} onShowCart={()=>setShowCart(true)} />
      <Hero onNav={nav} onExplore={()=>nav("formations")}/>
      <CoursesSection onOpenCourse={openCourse} onBuy={openBuy}/>
      <DialSection onDownload={()=>setShowBook(true)}/>
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
      {showBook&&(
        <BookDownloadModal onClose={()=>setShowBook(false)}/>
      )}
      {showAuth && (
        <AuthModal onClose={()=>setShowAuth(false)} onAuth={()=>setShowAuth(false)} />
      )}
      {showCart && user && (
        <CartModal onClose={()=>setShowCart(false)} onCheckout={()=>{ setShowCart(false); /* TODO: implement checkout */ }} />
      )}

      <a
        href="https://wa.me/22392976646"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter sur WhatsApp"
        style={{
          position:"fixed",
          bottom:24,
          left:24,
          width:60,
          height:60,
          borderRadius:"50%",
          background:"#25D366",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          boxShadow:"0 6px 20px rgba(37,211,102,.45)",
          zIndex:1000,
          transition:"transform .2s ease, box-shadow .2s ease",
        }}
        onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.1)";e.currentTarget.style.boxShadow="0 8px 28px rgba(37,211,102,.6)";}}
        onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 6px 20px rgba(37,211,102,.45)";}}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
