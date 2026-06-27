"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Quote, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { DiaryEntry } from "@/data/extraData";

const DEFAULT_QUOTES = [
  { id:"q1", text:"Não é o que acontece com você, mas como você reage que importa.", author:"Epicteto" },
  { id:"q2", text:"A disciplina é a ponte entre metas e realizações.", author:"Jim Rohn" },
  { id:"q3", text:"Somos o que fazemos repetidamente. Excelência não é um ato, é um hábito.", author:"Aristóteles" },
  { id:"q4", text:"Não desperdice mais tempo discutindo como um bom homem deve ser. Seja um.", author:"Marco Aurélio" },
  { id:"q5", text:"Sofra a dor da disciplina ou sofra a dor do arrependimento.", author:"Jim Rohn" },
  { id:"q6", text:"Você tem poder sobre sua mente, não sobre eventos externos.", author:"Marco Aurélio" },
  { id:"q7", text:"Hard work beats talent when talent doesn't work hard.", author:"Tim Notke" },
];

const DEFAULT_VERSES = [
  { id:"v1", text:"Tudo posso naquele que me fortalece.", reference:"Filipenses 4:13" },
  { id:"v2", text:"Confia no Senhor de todo o teu coração.", reference:"Provérbios 3:5" },
  { id:"v3", text:"Mas os que esperam no Senhor renovam as suas forças.", reference:"Isaías 40:31" },
  { id:"v4", text:"Seja forte e corajoso.", reference:"Josué 1:9" },
  { id:"v5", text:"E tudo o que fizerdes, fazei-o de todo o coração, como ao Senhor.", reference:"Colossenses 3:23" },
  { id:"v6", text:"Buscai primeiro o reino de Deus.", reference:"Mateus 6:33" },
  { id:"v7", text:"Porque Deus não nos deu o espírito de temor, mas de poder, de amor e de moderação.", reference:"2 Timóteo 1:7" },
];

function getDayIndex() { const n=new Date(),s=new Date(n.getFullYear(),0,0); return Math.floor((n.getTime()-s.getTime())/86400000); }

export default function DiarioPage() {
  const today = new Date().toISOString().split("T")[0];
  const dayIdx = getDayIndex();
  const dailyQ = DEFAULT_QUOTES[dayIdx % DEFAULT_QUOTES.length];
  const dailyV = DEFAULT_VERSES[(dayIdx+3) % DEFAULT_VERSES.length];

  const [entries,    setEntries]    = useLocalStorage<DiaryEntry[]>("apex-diary-entries",[]);
  const [customQ,    setCustomQ]    = useLocalStorage<{id:string;text:string;author:string}[]>("apex-custom-quotes",[]);
  const [customV,    setCustomV]    = useLocalStorage<{id:string;text:string;reference:string}[]>("apex-custom-verses",[]);
  const [gratidao,   setGratidao]   = useLocalStorage<{id:string;date:string;text:string}[]>("apex-gratidao",[]);

  const [bankOpen,   setBankOpen]   = useState(false);
  const [bankTab,    setBankTab]    = useState<"filosofia"|"versiculos">("filosofia");
  const [newText,    setNewText]    = useState("");
  const [newAuthor,  setNewAuthor]  = useState("");
  const [newRef,     setNewRef]     = useState("");
  const [gratText,   setGratText]   = useState("");
  const [diaryText,  setDiaryText]  = useState("");
  const [diaryMood,  setDiaryMood]  = useState(3);

  const todayEntry = entries.find((e)=>e.date===today);
  const todayGrats = gratidao.filter((g)=>g.date===today);

  function saveDiary() {
    if (!diaryText.trim()) return;
    setEntries((p)=>{
      const filtered = p.filter((e)=>e.date!==today);
      return [...filtered,{id:`d${Date.now()}`,date:today,content:diaryText.trim(),mood:diaryMood}];
    });
    setDiaryText("");
  }

  function addGrat() {
    if (!gratText.trim()) return;
    setGratidao((p)=>[...p,{id:`g${Date.now()}`,date:today,text:gratText.trim()}]);
    setGratText("");
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex-1 overflow-y-auto">
      <PageHeader title="Diário" subtitle="Reflexão, gratidão e frases do dia"/>
      <div className="px-8 py-6 max-w-3xl space-y-8">

        {/* Frase + Versículo do dia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="bg-apex-card border border-apex-border rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3"><Quote size={13} className="text-gold"/><p className="text-[9px] text-gold tracking-[2px] uppercase">Frase do dia</p></div>
            <p className="text-[13px] text-apex-white leading-relaxed italic flex-1 mb-3">"{dailyQ.text}"</p>
            <p className="text-[10px] text-apex-muted">— {dailyQ.author}</p>
          </motion.div>
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.05}} className="bg-apex-gold-bg border border-[#2a1f0a] rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3"><BookOpen size={13} className="text-gold"/><p className="text-[9px] text-gold tracking-[2px] uppercase">Versículo do dia</p></div>
            <p className="text-[13px] text-apex-white leading-relaxed italic flex-1 mb-3">"{dailyV.text}"</p>
            <p className="text-[10px] text-gold opacity-70">— {dailyV.reference}</p>
          </motion.div>
        </div>

        {/* Banco de frases */}
        <div>
          <button onClick={()=>setBankOpen(o=>!o)} className="w-full flex items-center justify-between py-2 mb-2 group">
            <p className="text-[9px] text-apex-faint tracking-[2px] uppercase group-hover:text-apex-muted transition-colors">Banco de frases ({DEFAULT_QUOTES.length+customQ.length+DEFAULT_VERSES.length+customV.length})</p>
            {bankOpen?<ChevronUp size={13} className="text-apex-faint"/>:<ChevronDown size={13} className="text-apex-faint"/>}
          </button>
          <AnimatePresence>
            {bankOpen&&(
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden">
                <div className="bg-apex-card border border-apex-border rounded-xl p-4">
                  <div className="flex gap-2 mb-4">
                    {(["filosofia","versiculos"] as const).map((t)=>(
                      <button key={t} onClick={()=>setBankTab(t)} className={`px-3 py-1.5 rounded-lg text-[10px] border transition-colors ${bankTab===t?"bg-apex-gold-bg border-gold text-gold":"bg-apex-surface border-apex-border text-apex-muted"}`}>
                        {t==="filosofia"?`Filosofia (${DEFAULT_QUOTES.length+customQ.length})`:`Versículos (${DEFAULT_VERSES.length+customV.length})`}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto mb-4 pr-1">
                    {bankTab==="filosofia"
                      ?[...DEFAULT_QUOTES,...customQ].map((q)=>(
                        <div key={q.id} className="flex items-start justify-between gap-2 py-1.5 border-b border-apex-border last:border-0">
                          <div><p className="text-[11px] text-apex-muted">"{q.text}"</p><p className="text-[9px] text-apex-faint mt-0.5">— {q.author}</p></div>
                          {customQ.find((c)=>c.id===q.id)&&<button onClick={()=>setCustomQ(p=>p.filter(c=>c.id!==q.id))} className="text-apex-faint hover:text-red-400 flex-shrink-0"><Trash2 size={11}/></button>}
                        </div>
                      ))
                      :[...DEFAULT_VERSES,...customV].map((v)=>(
                        <div key={v.id} className="flex items-start justify-between gap-2 py-1.5 border-b border-apex-border last:border-0">
                          <div><p className="text-[11px] text-apex-muted">"{v.text}"</p><p className="text-[9px] text-gold opacity-70 mt-0.5">{v.reference}</p></div>
                          {customV.find((c)=>c.id===v.id)&&<button onClick={()=>setCustomV(p=>p.filter(c=>c.id!==v.id))} className="text-apex-faint hover:text-red-400 flex-shrink-0"><Trash2 size={11}/></button>}
                        </div>
                      ))
                    }
                  </div>
                  <div className="border-t border-apex-border pt-3 space-y-2">
                    <p className="text-[9px] text-apex-faint uppercase tracking-wider">Adicionar {bankTab==="filosofia"?"frase":"versículo"}</p>
                    <textarea rows={2} placeholder="Texto..." value={newText} onChange={(e)=>setNewText(e.target.value)}
                      className="w-full bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[11px] text-apex-white placeholder-apex-faint outline-none focus:border-gold transition-colors resize-none"/>
                    <div className="flex gap-2">
                      <input type="text" placeholder={bankTab==="filosofia"?"Autor...":"Referência (ex: João 3:16)"}
                        value={bankTab==="filosofia"?newAuthor:newRef} onChange={(e)=>bankTab==="filosofia"?setNewAuthor(e.target.value):setNewRef(e.target.value)}
                        className="flex-1 bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[11px] text-apex-white placeholder-apex-faint outline-none focus:border-gold transition-colors"/>
                      <button onClick={()=>{
                        if(!newText.trim()) return;
                        if(bankTab==="filosofia"&&newAuthor.trim()){setCustomQ(p=>[...p,{id:`cq${Date.now()}`,text:newText.trim(),author:newAuthor.trim()}]);setNewText("");setNewAuthor("");}
                        else if(bankTab==="versiculos"&&newRef.trim()){setCustomV(p=>[...p,{id:`cv${Date.now()}`,text:newText.trim(),reference:newRef.trim()}]);setNewText("");setNewRef("");}
                      }} className="px-3 bg-gold text-apex-bg rounded-lg hover:bg-amber-500 transition-colors"><Plus size={13}/></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Diário livre */}
        <div>
          <p className="text-[9px] text-apex-faint tracking-[2px] uppercase mb-3">Diário de hoje</p>
          <div className="bg-apex-card border border-apex-border rounded-xl p-4">
            {todayEntry?(
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-gold">Registrado hoje</p>
                  <button onClick={()=>setEntries(p=>p.filter(e=>e.date!==today))} className="text-[9px] text-apex-faint hover:text-red-400 transition-colors">editar</button>
                </div>
                <p className="text-[12px] text-apex-muted leading-relaxed whitespace-pre-wrap">{todayEntry.content}</p>
              </div>
            ):(
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] text-apex-muted">Humor:</p>
                  {[1,2,3,4,5].map((n)=>(
                    <button key={n} onClick={()=>setDiaryMood(n)}
                      className="text-[14px] transition-transform hover:scale-110">{["😔","😐","🙂","😊","🤩"][n-1]}</button>
                  ))}
                </div>
                <textarea rows={6} placeholder="Escreva o que quiser sobre seu dia, pensamentos, aprendizados..."
                  value={diaryText} onChange={(e)=>setDiaryText(e.target.value)}
                  className="w-full bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold transition-colors resize-none leading-relaxed"/>
                <button onClick={saveDiary} disabled={!diaryText.trim()}
                  className="w-full py-2 bg-gold text-apex-bg rounded-lg text-[11px] font-medium hover:bg-amber-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  Salvar diário
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Gratidão */}
        <div>
          <p className="text-[9px] text-apex-faint tracking-[2px] uppercase mb-3">Gratidão do dia</p>
          <div className="bg-apex-card border border-apex-border rounded-xl p-4 space-y-3">
            {todayGrats.length===0&&<p className="text-[11px] text-apex-faint italic">Nenhuma gratidão registrada hoje</p>}
            {todayGrats.map((g)=>(
              <div key={g.id} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-gold mt-1.5 flex-shrink-0"/>
                <p className="text-[12px] text-apex-muted">{g.text}</p>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <input type="text" placeholder="Sou grato por..." value={gratText} onChange={(e)=>setGratText(e.target.value)}
                onKeyDown={(e)=>e.key==="Enter"&&addGrat()}
                className="flex-1 bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[11px] text-apex-white placeholder-apex-faint outline-none focus:border-gold transition-colors"/>
              <button onClick={addGrat} className="px-3 bg-gold text-apex-bg rounded-lg hover:bg-amber-500 transition-colors"><Plus size={13}/></button>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
