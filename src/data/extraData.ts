export type TaskFrequency = { type: "once" } | { type: "daily" } | { type: "xPerWeek"; times: number } | { type: "specificDays"; days: number[] };

export interface Task { id: string; name: string; time?: string; frequency: TaskFrequency; status: "done"|"pending"|"skipped"; date?: string; }

export const defaultTasks: Task[] = [
  { id:"tk1", name:"Fazer compras", frequency:{type:"xPerWeek",times:1}, status:"pending" },
  { id:"tk2", name:"Lavar roupa", time:"19:00", frequency:{type:"specificDays",days:[1,4]}, status:"pending" },
];

export function isTaskScheduledToday(t: Task): boolean {
  const dow = new Date().getDay();
  const today = new Date().toISOString().split("T")[0];
  if (t.frequency.type==="once") return t.date===today;
  if (t.frequency.type==="daily") return true;
  if (t.frequency.type==="xPerWeek") return true;
  if (t.frequency.type==="specificDays") return t.frequency.days.includes(dow);
  return false;
}

export interface CheckinEntry { date: string; energia: number; sono: number; humor: number; estresse: number; dorMuscular: number; }

export const CHECKIN_FIELDS: { key: keyof Omit<CheckinEntry,"date">; label: string; lucideIcon: string; invert?: boolean }[] = [
  { key:"energia",    label:"Energia",      lucideIcon:"Zap" },
  { key:"sono",        label:"Sono",         lucideIcon:"Moon" },
  { key:"humor",       label:"Humor",        lucideIcon:"Smile" },
  { key:"estresse",    label:"Estresse",     lucideIcon:"Activity", invert:true },
  { key:"dorMuscular", label:"Dor muscular", lucideIcon:"AlertCircle", invert:true },
];

export interface FocusItem { refId: string; type: "habit"|"task"; priority: "primary"|"secondary"; }

export interface Goal { id: string; title: string; targetDate: string; current: number; target: number; unit: string; linkedHabitIds: string[]; linkedWorkoutTemplateIds: string[]; }

export const defaultGoals: Goal[] = [
  { id:"g1", title:"Perder 5kg de gordura", targetDate:"2026-12-31", current:2, target:5, unit:"kg", linkedHabitIds:["h2","h3"], linkedWorkoutTemplateIds:[] },
  { id:"g2", title:"Correr 10km em 50min",  targetDate:"2026-09-30", current:56, target:50, unit:"min", linkedHabitIds:["h3"], linkedWorkoutTemplateIds:[] },
];

export interface FoodItem { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; portion: string; }
export interface MealItem { foodId: string; name: string; quantity: number; calories: number; protein: number; carbs: number; fat: number; }
export interface Meal { id: string; name: string; time: string; items: MealItem[]; done: boolean; }
export interface DietDayPreset { dow: number; meals: Meal[]; }

export const defaultFoodBank: FoodItem[] = [
  { id:"f1", name:"Peito de frango grelhado", calories:165, protein:31, carbs:0,  fat:4,  portion:"100g" },
  { id:"f2", name:"Arroz branco cozido",       calories:130, protein:2.7,carbs:28, fat:0.3,portion:"100g" },
  { id:"f3", name:"Ovo cozido",                calories:78,  protein:6.3,carbs:0.6,fat:5.3,portion:"1 unidade" },
  { id:"f4", name:"Aveia em flocos",            calories:389, protein:17, carbs:66, fat:7,  portion:"100g" },
  { id:"f5", name:"Banana",                     calories:89,  protein:1.1,carbs:23, fat:0.3,portion:"1 unidade" },
  { id:"f6", name:"Whey protein",               calories:120, protein:24, carbs:3,  fat:1.5,portion:"1 scoop" },
  { id:"f7", name:"Batata doce cozida",         calories:86,  protein:1.6,carbs:20, fat:0.1,portion:"100g" },
];

export const defaultDietGoals = { calories:2400, protein:180, carbs:280, fat:80 };

export const defaultDietPresets: DietDayPreset[] = [0,1,2,3,4,5,6].map((dow)=>({
  dow,
  meals:[
    { id:`m${dow}1`, name:"Café da manhã", time:"07:30", done:false, items:[
      { foodId:"f4", name:"Aveia", quantity:0.8, calories:311, protein:13.6, carbs:52.8, fat:5.6 },
      { foodId:"f5", name:"Banana", quantity:1, calories:89, protein:1.1, carbs:23, fat:0.3 },
    ]},
    { id:`m${dow}2`, name:"Almoço", time:"12:30", done:false, items:[
      { foodId:"f1", name:"Frango grelhado", quantity:1.5, calories:247, protein:46.5, carbs:0, fat:6 },
      { foodId:"f2", name:"Arroz cozido", quantity:1.5, calories:195, protein:4, carbs:42, fat:0.5 },
    ]},
    { id:`m${dow}3`, name:"Jantar", time:"19:30", done:false, items:[
      { foodId:"f1", name:"Frango grelhado", quantity:1.2, calories:198, protein:37, carbs:0, fat:4.8 },
      { foodId:"f7", name:"Batata doce", quantity:2, calories:172, protein:3.2, carbs:40, fat:0.2 },
    ]},
  ],
}));

export const MICRO_TARGETS = [
  { key:"ferro",   label:"Ferro",      unit:"mg", target:18 },
  { key:"vitD",     label:"Vitamina D", unit:"UI", target:600 },
  { key:"omega3",   label:"Ômega 3",    unit:"g",  target:1.6 },
  { key:"magnesio", label:"Magnésio",   unit:"mg", target:400 },
];

export function sumMealMacros(items: MealItem[]) {
  return items.reduce((a,i)=>({ calories:a.calories+i.calories, protein:a.protein+i.protein, carbs:a.carbs+i.carbs, fat:a.fat+i.fat }), { calories:0, protein:0, carbs:0, fat:0 });
}

export interface DiaryEntry { id: string; date: string; content: string; mood?: number; }
