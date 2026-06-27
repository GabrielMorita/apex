// Icon names correspond to lucide-react component names
export type HabitStatus = "done" | "pending" | "skipped";

export type HabitFrequency =
  | { type: "daily" }
  | { type: "xPerWeek"; times: number }
  | { type: "specificDays"; days: number[] };

export interface Habit {
  id: string; name: string; time: string;
  category: "espiritual" | "treino" | "foco" | "saude" | "aprendizado";
  color: string;
  lucideIcon: string; // matches lucide-react component name, e.g. "Flame"
  frequency: HabitFrequency;
  status: HabitStatus; streak: number; weeklyGoal: number; duration?: string;
  opensReadingLog?: boolean; // se true, clicar abre o registro de leitura
}

export interface DayPreset { dow: number; habitIds: string[]; }
export interface DayException { date: string; habitIds: string[]; }

export interface Exercise { id: string; name: string; sets: number; reps: number; rest: string; weight?: string; }
export interface WorkoutTemplate { id: string; name: string; type: "musculacao" | "corrida" | "mobilidade" | "descanso"; exercises: Exercise[]; description: string; }
export interface PlannedWorkout { id: string; templateId: string; day: string; time: string; done: boolean; }
export interface ExerciseLog { exerciseId: string; name: string; setsPlanned: number; repsPlanned: number; weightPlanned: string; setsReal: number; repsReal: number; weightReal: string; }
export interface WorkoutLog { id: string; plannedWorkoutId: string; templateName: string; type: WorkoutTemplate["type"]; date: string; exerciseLogs: ExerciseLog[]; sensacao: number; notas: string; }

export interface Workout { id: string; name: string; type: "musculacao" | "corrida" | "mobilidade" | "descanso"; day: string; time: string; duration: string; description: string; done: boolean; metrics?: { pace?: string; distancia?: string; fc?: string; sensacao?: number; fadiga?: number }; }
export interface DayPlan { day: string; shortDay: string; date: number; isToday: boolean; workouts: string[]; habitsDone: number; habitsTotal: number; }

export const defaultHabits: Habit[] = [
  { id:"h1", name:"Devocional",  time:"06:00", category:"espiritual",  color:"#c9a84c", lucideIcon:"BookOpen",   frequency:{type:"daily"},                        status:"pending", streak:14, weeklyGoal:7, duration:"20 min" },
  { id:"h2", name:"Musculação",  time:"07:00", category:"treino",      color:"#3B82F6", lucideIcon:"Dumbbell",   frequency:{type:"xPerWeek",times:3},             status:"pending", streak:9,  weeklyGoal:3, duration:"60 min" },
  { id:"h3", name:"Corrida",     time:"17:30", category:"treino",      color:"#10b981", lucideIcon:"Footprints", frequency:{type:"specificDays",days:[2,4,6]},    status:"pending", streak:5,  weeklyGoal:3, duration:"45 min" },
  { id:"h4", name:"Deep Work",   time:"09:00", category:"foco",        color:"#8b5cf6", lucideIcon:"Zap",        frequency:{type:"specificDays",days:[1,2,3,4,5]}, status:"pending", streak:12, weeklyGoal:5, duration:"2h"     },
  { id:"h5", name:"Leitura",     time:"21:00", category:"aprendizado", color:"#ef4444", lucideIcon:"Book",       frequency:{type:"xPerWeek",times:5},             status:"pending", streak:3,  weeklyGoal:5, duration:"30 min", opensReadingLog:true },
  { id:"h6", name:"Gratidão",    time:"21:30", category:"espiritual",  color:"#f97316", lucideIcon:"Heart",      frequency:{type:"daily"},                        status:"pending", streak:7,  weeklyGoal:7, duration:"10 min" },
];

export const defaultPresets: DayPreset[] = [
  { dow:0, habitIds:["h1","h5","h6"] },
  { dow:1, habitIds:["h1","h2","h4","h5","h6"] },
  { dow:2, habitIds:["h1","h3","h4","h5","h6"] },
  { dow:3, habitIds:["h1","h2","h4","h5","h6"] },
  { dow:4, habitIds:["h1","h3","h4","h5","h6"] },
  { dow:5, habitIds:["h1","h2","h3","h4","h5","h6"] },
  { dow:6, habitIds:["h1","h3","h5","h6"] },
];

export const defaultTemplates: WorkoutTemplate[] = [
  { id:"t1", name:"Upper A — Empurrar", type:"musculacao", description:"Peito, ombro e tríceps.", exercises:[
    {id:"e1",name:"Supino reto",sets:4,reps:8,rest:"90s",weight:"80kg"},
    {id:"e2",name:"Desenvolvimento",sets:3,reps:10,rest:"75s",weight:"50kg"},
    {id:"e3",name:"Tríceps pulley",sets:3,reps:12,rest:"60s",weight:"30kg"},
  ]},
  { id:"t2", name:"Lower A — Pernas", type:"musculacao", description:"Quadríceps, posterior e glúteos.", exercises:[
    {id:"e4",name:"Agachamento",sets:4,reps:8,rest:"120s",weight:"100kg"},
    {id:"e5",name:"Leg press",sets:3,reps:12,rest:"90s",weight:"150kg"},
    {id:"e6",name:"Mesa flexora",sets:3,reps:12,rest:"60s",weight:"30kg"},
  ]},
  { id:"t3", name:"Upper B — Puxar", type:"musculacao", description:"Costas e bíceps.", exercises:[
    {id:"e7",name:"Remada curvada",sets:4,reps:8,rest:"90s",weight:"70kg"},
    {id:"e8",name:"Pulldown",sets:3,reps:10,rest:"75s",weight:"60kg"},
    {id:"e9",name:"Rosca direta",sets:3,reps:12,rest:"60s",weight:"20kg"},
  ]},
  { id:"t4", name:"Corrida Z2", type:"corrida", description:"Base aeróbica. FC < 145bpm.", exercises:[] },
  { id:"t5", name:"Corrida Intensidade", type:"corrida", description:"Tiros 5x1km.", exercises:[] },
  { id:"t6", name:"Descanso Ativo", type:"descanso", description:"Mobilidade e alongamento.", exercises:[] },
];

export const defaultPlannedWorkouts: PlannedWorkout[] = [
  {id:"pw1",templateId:"t1",day:"Segunda",time:"07:00",done:false},
  {id:"pw2",templateId:"t4",day:"Terça",time:"17:30",done:false},
  {id:"pw3",templateId:"t2",day:"Quarta",time:"07:00",done:false},
  {id:"pw4",templateId:"t6",day:"Quinta",time:"—",done:false},
  {id:"pw5",templateId:"t5",day:"Sexta",time:"06:30",done:false},
  {id:"pw6",templateId:"t3",day:"Sábado",time:"08:00",done:false},
  {id:"pw7",templateId:"t6",day:"Domingo",time:"09:00",done:false},
];

export const weekWorkouts: Workout[] = defaultPlannedWorkouts.map((pw) => {
  const t = defaultTemplates.find((t) => t.id === pw.templateId)!;
  return { id:pw.id, name:t.name, type:t.type, day:pw.day, time:pw.time, duration:"—", description:t.description, done:pw.done };
});

export const weekMetrics = { scoreSemanal:87, consistencia:92, streakDias:14, treinosConcluidos:0, treinosTotal:5, habitosHoje:0, habitosTotal:6 };
export const workoutTypeLabel: Record<Workout["type"],string> = { musculacao:"Musculação", corrida:"Corrida", mobilidade:"Mobilidade", descanso:"Descanso" };
export const workoutTypeColor: Record<Workout["type"],string> = { musculacao:"#c9a84c", corrida:"#3B82F6", mobilidade:"#10b981", descanso:"#888888" };

export function freqLabel(f: HabitFrequency | undefined | null): string {
  if (!f) return "diário";
  const D = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  if (f.type==="daily") return "diário";
  if (f.type==="xPerWeek") return `${f.times}x/sem`;
  return f.days.map((d)=>D[d]).join("·");
}

export function isRestDay(f: HabitFrequency | undefined | null): boolean {
  if (!f||!f.type) return false;
  const dow = new Date().getDay();
  if (f.type==="daily"||f.type==="xPerWeek") return false;
  return !f.days.includes(dow);
}

export function getCurrentWeekDates(): string[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate()-((today.getDay()+6)%7));
  return Array.from({length:7},(_,i)=>{
    const d = new Date(monday); d.setDate(monday.getDate()+i);
    return d.toISOString().split("T")[0];
  });
}

export function countDoneThisWeek(history: Record<string,HabitStatus>): number {
  return getCurrentWeekDates().filter((d)=>history[d]==="done").length;
}

export function getMedalColor(pct: number, isFuture: boolean): string {
  if (isFuture) return "transparent";
  if (pct>=80) return "#e3ad52";  // ouro mel
  if (pct>=60) return "#c2b09a";  // prata quente
  if (pct>=41) return "#c77f43";  // bronze
  return "#3a2f22";                // abaixo (marrom escuro)
}

export function getTodayHabits(habits: Habit[], presets: DayPreset[], exceptions: DayException[]): Habit[] {
  const today = new Date().toISOString().split("T")[0];
  const dow = new Date().getDay();
  const exc = exceptions.find((e)=>e.date===today);
  const ids = exc ? exc.habitIds : (presets.find((p)=>p.dow===dow)?.habitIds ?? habits.map((h)=>h.id));
  return habits.filter((h)=>ids.includes(h.id)).sort((a,b)=>a.time.localeCompare(b.time));
}

export const DOW_NAMES = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
export const FULL_DAY_NAMES = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
