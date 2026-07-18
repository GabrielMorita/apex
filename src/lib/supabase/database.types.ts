export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          avatar_path: string | null;
          date_of_birth: string | null;
          biological_sex: "male" | "female" | null;
          height_cm: number | null;
          weight_kg: number | null;
          body_fat_percentage: number | null;
          goal: "lose_weight" | "maintain_weight" | "gain_muscle" | null;
          target_weight_kg: number | null;
          activity_level_suggested: "sedentary" | "light" | "moderate" | "high" | null;
          activity_level_selected: "sedentary" | "light" | "moderate" | "high" | null;
          activity_assessment: Json | null;
          training_frequency: number | null;
          goal_pace: "conservative" | "moderate" | "accelerated" | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          avatar_path?: string | null;
          date_of_birth?: string | null;
          biological_sex?: "male" | "female" | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          body_fat_percentage?: number | null;
          goal?: "lose_weight" | "maintain_weight" | "gain_muscle" | null;
          target_weight_kg?: number | null;
          activity_level_suggested?: "sedentary" | "light" | "moderate" | "high" | null;
          activity_level_selected?: "sedentary" | "light" | "moderate" | "high" | null;
          activity_assessment?: Json | null;
          training_frequency?: number | null;
          goal_pace?: "conservative" | "moderate" | "accelerated" | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          avatar_path?: string | null;
          date_of_birth?: string | null;
          biological_sex?: "male" | "female" | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          body_fat_percentage?: number | null;
          goal?: "lose_weight" | "maintain_weight" | "gain_muscle" | null;
          target_weight_kg?: number | null;
          activity_level_suggested?: "sedentary" | "light" | "moderate" | "high" | null;
          activity_level_selected?: "sedentary" | "light" | "moderate" | "high" | null;
          activity_assessment?: Json | null;
          training_frequency?: number | null;
          goal_pace?: "conservative" | "moderate" | "accelerated" | null;
          onboarding_completed?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      diet_preferences: {
        Row: {
          user_id: string;
          onboarding_completed: boolean;
          health_eligibility_confirmed: boolean;
          meal_count: number;
          meal_times: string[];
          training_time: "morning" | "afternoon" | "evening" | "varies" | "none";
          dietary_pattern: "omnivore" | "vegetarian" | "vegan" | "pescatarian";
          allergies: string[];
          restrictions: string[];
          disliked_foods: string[];
          favorite_foods: string[];
          cooking_time_minutes: number;
          budget_level: "economical" | "moderate" | "flexible";
          variety_level: "varied" | "balanced" | "practical";
          meal_style: "simple" | "mixed" | "recipes";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          onboarding_completed?: boolean;
          health_eligibility_confirmed?: boolean;
          meal_count: number;
          meal_times: string[];
          training_time: "morning" | "afternoon" | "evening" | "varies" | "none";
          dietary_pattern: "omnivore" | "vegetarian" | "vegan" | "pescatarian";
          allergies?: string[];
          restrictions?: string[];
          disliked_foods?: string[];
          favorite_foods?: string[];
          cooking_time_minutes: number;
          budget_level: "economical" | "moderate" | "flexible";
          variety_level: "varied" | "balanced" | "practical";
          meal_style: "simple" | "mixed" | "recipes";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          onboarding_completed?: boolean;
          health_eligibility_confirmed?: boolean;
          meal_count?: number;
          meal_times?: string[];
          training_time?: "morning" | "afternoon" | "evening" | "varies" | "none";
          dietary_pattern?: "omnivore" | "vegetarian" | "vegan" | "pescatarian";
          allergies?: string[];
          restrictions?: string[];
          disliked_foods?: string[];
          favorite_foods?: string[];
          cooking_time_minutes?: number;
          budget_level?: "economical" | "moderate" | "flexible";
          variety_level?: "varied" | "balanced" | "practical";
          meal_style?: "simple" | "mixed" | "recipes";
          updated_at?: string;
        };
        Relationships: [];
      };
      nutrition_targets: {
        Row: {
          user_id: string;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          source: "calculated" | "manual";
          calculation_version: string;
          calculation_inputs: Json;
          is_provisional: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          source?: "calculated" | "manual";
          calculation_version: string;
          calculation_inputs?: Json;
          is_provisional?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          calories?: number;
          protein_g?: number;
          carbs_g?: number;
          fat_g?: number;
          source?: "calculated" | "manual";
          calculation_version?: string;
          calculation_inputs?: Json;
          is_provisional?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      food_catalog: {
        Row: {
          id: string;
          user_id: string | null;
          recipe_id: string | null;
          source_type: "reference" | "custom";
          name_pt: string;
          category: "grain" | "vegetable" | "fruit" | "fat" | "fish" | "meat" | "dairy" | "egg" | "legume";
          dietary_patterns: ("omnivore" | "vegetarian" | "vegan" | "pescatarian")[];
          allergen_tags: string[];
          meal_tags: string[];
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          fiber_g: number;
          serving_grams: number;
          serving_label: string;
          cost_level: number;
          source_name: string;
          source_code: string;
          source_url: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          recipe_id?: string | null;
          source_type?: "reference" | "custom";
          name_pt: string;
          category: "grain" | "vegetable" | "fruit" | "fat" | "fish" | "meat" | "dairy" | "egg" | "legume";
          dietary_patterns: ("omnivore" | "vegetarian" | "vegan" | "pescatarian")[];
          allergen_tags?: string[];
          meal_tags?: string[];
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          fiber_g?: number;
          serving_grams?: number;
          serving_label?: string;
          cost_level?: number;
          source_name: string;
          source_code: string;
          source_url: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["food_catalog"]["Insert"]>;
        Relationships: [];
      };
      diet_plans: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          status: "active" | "archived";
          generation_version: string;
          targets_snapshot: Json;
          preferences_snapshot: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          status?: "active" | "archived";
          generation_version: string;
          targets_snapshot: Json;
          preferences_snapshot: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["diet_plans"]["Insert"]>;
        Relationships: [];
      };
      diet_plan_days: {
        Row: {
          id: string;
          plan_id: string;
          user_id: string;
          plan_date: string;
          day_order: number;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          user_id: string;
          plan_date: string;
          day_order: number;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["diet_plan_days"]["Insert"]>;
        Relationships: [];
      };
      diet_meals: {
        Row: {
          id: string;
          day_id: string;
          plan_id: string;
          user_id: string;
          name: string;
          meal_order: number;
          scheduled_time: string | null;
          is_locked: boolean;
          regeneration_count: number;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          day_id: string;
          plan_id: string;
          user_id: string;
          name: string;
          meal_order: number;
          scheduled_time?: string | null;
          is_locked?: boolean;
          regeneration_count?: number;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["diet_meals"]["Insert"]>;
        Relationships: [];
      };
      diet_meal_items: {
        Row: {
          id: string;
          meal_id: string;
          user_id: string;
          food_id: string;
          food_name: string;
          grams: number;
          serving_label: string;
          item_order: number;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_id: string;
          user_id: string;
          food_id: string;
          food_name: string;
          grams: number;
          serving_label: string;
          item_order: number;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["diet_meal_items"]["Insert"]>;
        Relationships: [];
      };
      diet_consumption_entries: {
        Row: {
          id: string;
          user_id: string;
          plan_week_start: string;
          consumed_date: string;
          meal_order: number;
          meal_name: string;
          items_snapshot: Json;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          consumed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_week_start: string;
          consumed_date: string;
          meal_order: number;
          meal_name: string;
          items_snapshot: Json;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          consumed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["diet_consumption_entries"]["Insert"]>;
        Relationships: [];
      };
      diet_food_favorites: {
        Row: {
          user_id: string;
          food_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          food_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      diet_shopping_checks: {
        Row: {
          user_id: string;
          week_start: string;
          food_id: string;
          checked_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          week_start: string;
          food_id: string;
          checked_at?: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      diet_recipes: {
        Row: {
          id: string;
          user_id: string;
          name_pt: string;
          category: "grain" | "vegetable" | "fruit" | "fat" | "fish" | "meat" | "dairy" | "egg" | "legume";
          servings: number;
          yield_grams: number;
          preparation_minutes: number;
          instructions: string;
          dietary_patterns: ("omnivore" | "vegetarian" | "vegan" | "pescatarian")[];
          allergen_tags: string[];
          total_calories: number;
          total_protein_g: number;
          total_carbs_g: number;
          total_fat_g: number;
          total_fiber_g: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      diet_recipe_items: {
        Row: {
          id: string;
          recipe_id: string;
          user_id: string;
          food_id: string;
          food_name_snapshot: string;
          grams: number;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          fiber_g: number;
          item_order: number;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      diet_meal_templates: {
        Row: {
          id: string;
          user_id: string;
          name_pt: string;
          item_count: number;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      diet_meal_template_items: {
        Row: {
          id: string;
          template_id: string;
          user_id: string;
          food_id: string;
          food_name_snapshot: string;
          serving_label_snapshot: string;
          grams: number;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          item_order: number;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      training_exercises: {
        Row: {
          id: string;
          user_id: string | null;
          source_type: "reference" | "custom";
          name_pt: string;
          category: "strength" | "cardio" | "mobility";
          primary_muscle_group: string;
          equipment: string;
          instructions: string;
          video_url: string | null;
          source_code: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          source_type?: "reference" | "custom";
          name_pt: string;
          category: "strength" | "cardio" | "mobility";
          primary_muscle_group?: string;
          equipment?: string;
          instructions?: string;
          video_url?: string | null;
          source_code?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_exercises"]["Insert"]>;
        Relationships: [];
      };
      training_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          workout_type: "strength" | "running" | "mobility" | "recovery";
          description: string;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          workout_type: "strength" | "running" | "mobility" | "recovery";
          description?: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_templates"]["Insert"]>;
        Relationships: [];
      };
      training_template_exercises: {
        Row: {
          id: string;
          template_id: string;
          user_id: string;
          exercise_id: string;
          exercise_order: number;
          target_sets: number;
          target_reps: number;
          target_load_kg: number | null;
          rest_seconds: number;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          user_id: string;
          exercise_id: string;
          exercise_order: number;
          target_sets?: number;
          target_reps?: number;
          target_load_kg?: number | null;
          rest_seconds?: number;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_template_exercises"]["Insert"]>;
        Relationships: [];
      };
      training_cycles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          goal: string;
          start_date: string;
          end_date: string;
          status: "planned" | "active" | "completed" | "archived";
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          goal?: string;
          start_date: string;
          end_date: string;
          status?: "planned" | "active" | "completed" | "archived";
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_cycles"]["Insert"]>;
        Relationships: [];
      };
      training_schedule: {
        Row: {
          id: string;
          user_id: string;
          template_id: string;
          cycle_id: string | null;
          scheduled_date: string;
          scheduled_time: string;
          status: "scheduled" | "in_progress" | "completed" | "skipped";
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id: string;
          cycle_id?: string | null;
          scheduled_date: string;
          scheduled_time?: string;
          status?: "scheduled" | "in_progress" | "completed" | "skipped";
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_schedule"]["Insert"]>;
        Relationships: [];
      };
      training_sessions: {
        Row: {
          id: string;
          user_id: string;
          scheduled_workout_id: string | null;
          template_id: string | null;
          template_name_snapshot: string;
          workout_type_snapshot: "strength" | "running" | "mobility" | "recovery";
          status: "in_progress" | "completed" | "cancelled";
          started_at: string;
          completed_at: string | null;
          duration_minutes: number | null;
          total_volume_kg: number;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scheduled_workout_id?: string | null;
          template_id?: string | null;
          template_name_snapshot: string;
          workout_type_snapshot: "strength" | "running" | "mobility" | "recovery";
          status?: "in_progress" | "completed" | "cancelled";
          started_at?: string;
          completed_at?: string | null;
          duration_minutes?: number | null;
          total_volume_kg?: number;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_sessions"]["Insert"]>;
        Relationships: [];
      };
      training_session_sets: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          template_exercise_id: string | null;
          exercise_id: string | null;
          exercise_name_snapshot: string;
          exercise_order: number;
          set_order: number;
          target_reps: number;
          target_load_kg: number | null;
          actual_reps: number | null;
          actual_load_kg: number | null;
          rest_seconds: number;
          is_completed: boolean;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          template_exercise_id?: string | null;
          exercise_id?: string | null;
          exercise_name_snapshot: string;
          exercise_order: number;
          set_order: number;
          target_reps: number;
          target_load_kg?: number | null;
          actual_reps?: number | null;
          actual_load_kg?: number | null;
          rest_seconds?: number;
          is_completed?: boolean;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_session_sets"]["Insert"]>;
        Relationships: [];
      };
      productivity_habits: {
        Row: {
          id: string; user_id: string; name: string; scheduled_time: string;
          period: "morning" | "afternoon" | "evening" | "anytime";
          category: "spiritual" | "training" | "focus" | "health" | "learning" | "personal";
          color: string; icon_name: string;
          frequency_type: "daily" | "times_per_week" | "specific_days";
          frequency_times: number | null; frequency_days: number[]; weekly_goal: number;
          duration_minutes: number | null; opens_reading_log: boolean; is_archived: boolean;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; user_id: string; name: string; scheduled_time?: string;
          period?: "morning" | "afternoon" | "evening" | "anytime";
          category?: "spiritual" | "training" | "focus" | "health" | "learning" | "personal";
          color?: string; icon_name?: string;
          frequency_type?: "daily" | "times_per_week" | "specific_days";
          frequency_times?: number | null; frequency_days?: number[]; weekly_goal?: number;
          duration_minutes?: number | null; opens_reading_log?: boolean; is_archived?: boolean;
          created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["productivity_habits"]["Insert"]>;
        Relationships: [];
      };
      productivity_habit_entries: {
        Row: { id: string; user_id: string; habit_id: string; entry_date: string; status: "done" | "skipped"; completed_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; habit_id: string; entry_date: string; status: "done" | "skipped"; completed_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["productivity_habit_entries"]["Insert"]>;
        Relationships: [];
      };
      productivity_habit_day_plans: {
        Row: { id: string; user_id: string; plan_date: string; habit_ids: string[]; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; plan_date: string; habit_ids?: string[]; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["productivity_habit_day_plans"]["Insert"]>;
        Relationships: [];
      };
      productivity_tasks: {
        Row: { id: string; user_id: string; title: string; scheduled_time: string | null; frequency_type: "once" | "daily" | "times_per_week" | "specific_days"; frequency_times: number | null; frequency_days: number[]; due_date: string | null; notes: string; is_archived: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; title: string; scheduled_time?: string | null; frequency_type?: "once" | "daily" | "times_per_week" | "specific_days"; frequency_times?: number | null; frequency_days?: number[]; due_date?: string | null; notes?: string; is_archived?: boolean; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["productivity_tasks"]["Insert"]>;
        Relationships: [];
      };
      productivity_task_entries: {
        Row: { id: string; user_id: string; task_id: string; entry_date: string; status: "done" | "skipped"; completed_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; task_id: string; entry_date: string; status: "done" | "skipped"; completed_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["productivity_task_entries"]["Insert"]>;
        Relationships: [];
      };
      productivity_goals: {
        Row: { id: string; user_id: string; title: string; target_date: string; current_value: number; target_value: number; unit: string; status: "active" | "completed" | "paused" | "archived"; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; title: string; target_date: string; current_value?: number; target_value: number; unit?: string; status?: "active" | "completed" | "paused" | "archived"; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["productivity_goals"]["Insert"]>;
        Relationships: [];
      };
      productivity_goal_habits: {
        Row: { user_id: string; goal_id: string; habit_id: string; created_at: string };
        Insert: { user_id: string; goal_id: string; habit_id: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      productivity_goal_training_templates: {
        Row: { user_id: string; goal_id: string; template_id: string; created_at: string };
        Insert: { user_id: string; goal_id: string; template_id: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      productivity_daily_checkins: {
        Row: { id: string; user_id: string; checkin_date: string; energy: number; sleep: number; mood: number; stress: number; muscle_soreness: number; notes: string; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; checkin_date: string; energy: number; sleep: number; mood: number; stress: number; muscle_soreness: number; notes?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["productivity_daily_checkins"]["Insert"]>;
        Relationships: [];
      };
      productivity_day_moods: {
        Row: { id: string; user_id: string; mood_date: string; mood: number; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; mood_date: string; mood: number; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["productivity_day_moods"]["Insert"]>;
        Relationships: [];
      };
      productivity_inbox_items: {
        Row: { id: string; user_id: string; item_type: "idea" | "note"; content: string; is_archived: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; item_type: "idea" | "note"; content: string; is_archived?: boolean; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["productivity_inbox_items"]["Insert"]>;
        Relationships: [];
      };
      productivity_weekly_reviews: {
        Row: { id: string; user_id: string; week_start: string; answers: Json; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; week_start: string; answers?: Json; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["productivity_weekly_reviews"]["Insert"]>;
        Relationships: [];
      };
      productivity_focus_sessions: {
        Row: { id: string; user_id: string; habit_id: string | null; session_date: string; task_name: string; duration_minutes: number; completed_at: string; created_at: string };
        Insert: { id?: string; user_id: string; habit_id?: string | null; session_date: string; task_name: string; duration_minutes: number; completed_at?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      reading_cycles: {
        Row: { id: string; user_id: string; label: string; start_date: string; end_date: string; target_books: number; linked_goal_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; label: string; start_date: string; end_date: string; target_books?: number; linked_goal_id?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["reading_cycles"]["Insert"]>;
        Relationships: [];
      };
      reading_projects: {
        Row: { id: string; user_id: string; title: string; author: string | null; total_pages: number; current_page: number; weekly_target_pages: number; reading_days: number[]; status: "planned" | "active" | "paused" | "completed" | "abandoned"; priority: "main" | "secondary"; start_date: string; target_end_date: string | null; completed_at: string | null; cycle_id: string | null; linked_goal_id: string | null; color: string | null; category: string | null; notes: string; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; title: string; author?: string | null; total_pages: number; current_page?: number; weekly_target_pages?: number; reading_days?: number[]; status?: "planned" | "active" | "paused" | "completed" | "abandoned"; priority?: "main" | "secondary"; start_date: string; target_end_date?: string | null; completed_at?: string | null; cycle_id?: string | null; linked_goal_id?: string | null; color?: string | null; category?: string | null; notes?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["reading_projects"]["Insert"]>;
        Relationships: [];
      };
      reading_sessions: {
        Row: { id: string; user_id: string; project_id: string; session_date: string; from_page: number; to_page: number; pages_read: number; note: string; created_at: string };
        Insert: { id?: string; user_id: string; project_id: string; session_date: string; from_page: number; to_page: number; pages_read: number; note?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      notification_preferences: {
        Row: { user_id: string; in_app_enabled: boolean; email_enabled: boolean; push_enabled: boolean; habit_reminders: boolean; task_reminders: boolean; training_reminders: boolean; diet_reminders: boolean; weekly_review_reminders: boolean; daily_summary_enabled: boolean; reminder_lead_minutes: number; daily_summary_time: string; weekly_review_time: string; quiet_hours_enabled: boolean; quiet_hours_start: string; quiet_hours_end: string; timezone: string; created_at: string; updated_at: string };
        Insert: { user_id: string; in_app_enabled?: boolean; email_enabled?: boolean; push_enabled?: boolean; habit_reminders?: boolean; task_reminders?: boolean; training_reminders?: boolean; diet_reminders?: boolean; weekly_review_reminders?: boolean; daily_summary_enabled?: boolean; reminder_lead_minutes?: number; daily_summary_time?: string; weekly_review_time?: string; quiet_hours_enabled?: boolean; quiet_hours_start?: string; quiet_hours_end?: string; timezone?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["notification_preferences"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: { id: string; user_id: string; kind: "habit" | "task" | "training" | "diet" | "weekly_review" | "daily_summary" | "system"; title: string; body: string; action_destination: string | null; source_type: "habit" | "task" | "training_schedule" | "diet_meal" | "weekly_review" | "daily_summary" | "system" | null; source_id: string | null; scheduled_for: string; expires_at: string | null; read_at: string | null; dismissed_at: string | null; dedupe_key: string; payload: Json; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; kind: "habit" | "task" | "training" | "diet" | "weekly_review" | "daily_summary" | "system"; title: string; body?: string; action_destination?: string | null; source_type?: "habit" | "task" | "training_schedule" | "diet_meal" | "weekly_review" | "daily_summary" | "system" | null; source_id?: string | null; scheduled_for: string; expires_at?: string | null; read_at?: string | null; dismissed_at?: string | null; dedupe_key: string; payload?: Json; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      notification_push_subscriptions: {
        Row: { id: string; user_id: string; endpoint: string; p256dh: string; auth_key: string; user_agent: string; is_active: boolean; last_used_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; endpoint: string; p256dh: string; auth_key: string; user_agent?: string; is_active?: boolean; last_used_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["notification_push_subscriptions"]["Insert"]>;
        Relationships: [];
      };
      billing_plans: {
        Row: { id: string; code: string; name: string; description: string; tier: "beta" | "pro"; billing_interval: "none" | "month" | "year"; currency: string; unit_amount: number | null; trial_days: number; provider: "manual" | "stripe" | "mercado_pago"; provider_price_id: string | null; features: Json; is_active: boolean; is_public: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; code: string; name: string; description?: string; tier: "beta" | "pro"; billing_interval: "none" | "month" | "year"; currency?: string; unit_amount?: number | null; trial_days?: number; provider?: "manual" | "stripe" | "mercado_pago"; provider_price_id?: string | null; features?: Json; is_active?: boolean; is_public?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["billing_plans"]["Insert"]>;
        Relationships: [];
      };
      billing_customers: {
        Row: { id: string; user_id: string; provider: "stripe" | "mercado_pago"; provider_customer_id: string; email_snapshot: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; provider: "stripe" | "mercado_pago"; provider_customer_id: string; email_snapshot?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["billing_customers"]["Insert"]>;
        Relationships: [];
      };
      billing_subscriptions: {
        Row: { id: string; user_id: string; plan_id: string | null; provider: "stripe" | "mercado_pago" | "manual"; provider_subscription_id: string; provider_price_id: string | null; status: "incomplete" | "incomplete_expired" | "trialing" | "active" | "past_due" | "paused" | "canceled" | "unpaid"; current_period_start: string | null; current_period_end: string | null; trial_start: string | null; trial_end: string | null; cancel_at_period_end: boolean; canceled_at: string | null; ended_at: string | null; metadata: Json; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; plan_id?: string | null; provider: "stripe" | "mercado_pago" | "manual"; provider_subscription_id: string; provider_price_id?: string | null; status: "incomplete" | "incomplete_expired" | "trialing" | "active" | "past_due" | "paused" | "canceled" | "unpaid"; current_period_start?: string | null; current_period_end?: string | null; trial_start?: string | null; trial_end?: string | null; cancel_at_period_end?: boolean; canceled_at?: string | null; ended_at?: string | null; metadata?: Json; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["billing_subscriptions"]["Insert"]>;
        Relationships: [];
      };
      billing_invoices: {
        Row: { id: string; user_id: string; subscription_id: string | null; provider: "stripe" | "mercado_pago" | "manual"; provider_invoice_id: string; status: "draft" | "open" | "paid" | "void" | "uncollectible" | "failed"; currency: string; amount_due: number; amount_paid: number; hosted_invoice_url: string | null; invoice_pdf_url: string | null; due_at: string | null; paid_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; subscription_id?: string | null; provider: "stripe" | "mercado_pago" | "manual"; provider_invoice_id: string; status: "draft" | "open" | "paid" | "void" | "uncollectible" | "failed"; currency?: string; amount_due?: number; amount_paid?: number; hosted_invoice_url?: string | null; invoice_pdf_url?: string | null; due_at?: string | null; paid_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["billing_invoices"]["Insert"]>;
        Relationships: [];
      };
      billing_checkout_attempts: {
        Row: { id: string; user_id: string; plan_id: string; provider: "stripe" | "mercado_pago"; provider_checkout_id: string | null; status: "created" | "redirected" | "completed" | "expired" | "failed"; expires_at: string | null; completed_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; plan_id: string; provider: "stripe" | "mercado_pago"; provider_checkout_id?: string | null; status?: "created" | "redirected" | "completed" | "expired" | "failed"; expires_at?: string | null; completed_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["billing_checkout_attempts"]["Insert"]>;
        Relationships: [];
      };
      billing_webhook_events: {
        Row: { id: string; provider: "stripe" | "mercado_pago"; provider_event_id: string; event_type: string; processing_status: "processing" | "processed" | "failed"; attempts: number; user_id: string | null; event_metadata: Json; last_error: string | null; received_at: string; processed_at: string | null };
        Insert: { id?: string; provider: "stripe" | "mercado_pago"; provider_event_id: string; event_type: string; processing_status?: "processing" | "processed" | "failed"; attempts?: number; user_id?: string | null; event_metadata?: Json; last_error?: string | null; received_at?: string; processed_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["billing_webhook_events"]["Insert"]>;
        Relationships: [];
      };
      privacy_documents: {
        Row: { id: string; document_type: "terms_of_use" | "privacy_notice" | "health_data_consent"; version: string; title: string; public_path: string; content_sha256: string | null; published_at: string; effective_at: string; is_current: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; document_type: "terms_of_use" | "privacy_notice" | "health_data_consent"; version: string; title: string; public_path: string; content_sha256?: string | null; published_at: string; effective_at: string; is_current?: boolean; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["privacy_documents"]["Insert"]>;
        Relationships: [];
      };
      privacy_consent_events: {
        Row: { id: string; user_id: string; document_id: string; document_type: "terms_of_use" | "privacy_notice" | "health_data_consent"; document_version: string; event_type: "accepted" | "acknowledged" | "withdrawn"; source: "signup" | "privacy_center" | "system"; evidence: Json; created_at: string };
        Insert: { id?: string; user_id: string; document_id: string; document_type: "terms_of_use" | "privacy_notice" | "health_data_consent"; document_version: string; event_type: "accepted" | "acknowledged" | "withdrawn"; source: "signup" | "privacy_center" | "system"; evidence?: Json; created_at?: string };
        Update: never;
        Relationships: [];
      };
      privacy_preferences: {
        Row: { user_id: string; product_updates_enabled: boolean; anonymous_usage_analytics_enabled: boolean; research_participation_enabled: boolean; created_at: string; updated_at: string };
        Insert: { user_id: string; product_updates_enabled?: boolean; anonymous_usage_analytics_enabled?: boolean; research_participation_enabled?: boolean; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["privacy_preferences"]["Insert"]>;
        Relationships: [];
      };
      privacy_requests: {
        Row: { id: string; user_id: string; request_type: "confirmation" | "access" | "correction" | "anonymization" | "deletion" | "portability" | "sharing_information" | "consent_revocation" | "objection" | "automated_decision_review" | "other"; status: "received" | "in_review" | "waiting_user" | "completed" | "rejected" | "canceled"; details: string; response_summary: string | null; identity_verified_at: string; completed_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; request_type: "confirmation" | "access" | "correction" | "anonymization" | "deletion" | "portability" | "sharing_information" | "consent_revocation" | "objection" | "automated_decision_review" | "other"; status?: "received" | "in_review" | "waiting_user" | "completed" | "rejected" | "canceled"; details?: string; response_summary?: string | null; identity_verified_at?: string; completed_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["privacy_requests"]["Insert"]>;
        Relationships: [];
      };
      privacy_request_events: {
        Row: { id: string; request_id: string; user_id: string; event_type: "received" | "status_changed" | "user_message" | "response"; note: string; created_at: string };
        Insert: { id?: string; request_id: string; user_id: string; event_type: "received" | "status_changed" | "user_message" | "response"; note?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      privacy_retention_rules: {
        Row: { code: string; data_category: string; active_account_period: string; after_account_deletion: string; rationale: string; sort_order: number; is_active: boolean; updated_at: string };
        Insert: { code: string; data_category: string; active_account_period: string; after_account_deletion: string; rationale: string; sort_order?: number; is_active?: boolean; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["privacy_retention_rules"]["Insert"]>;
        Relationships: [];
      };
      api_rate_limits: {
        Row: { id: string; user_id: string; action: string; window_start: string; request_count: number; expires_at: string; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; action: string; window_start: string; request_count?: number; expires_at: string; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["api_rate_limits"]["Insert"]>;
        Relationships: [];
      };
      weight_history: {
        Row: {
          id: string;
          user_id: string;
          weight_kg: number;
          recorded_at: string;
          source: "profile" | "dashboard" | "progress" | "integration";
          operation_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weight_kg: number;
          recorded_at?: string;
          source?: "profile" | "dashboard" | "progress" | "integration";
          operation_id: string;
          created_at?: string;
        };
        Update: {
          weight_kg?: number;
          recorded_at?: string;
          source?: "profile" | "dashboard" | "progress" | "integration";
        };
        Relationships: [];
      };
      user_module_state: {
        Row: {
          user_id: string;
          storage_key: string;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          storage_key: string;
          payload: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          payload?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      save_training_template: {
        Args: {
          p_template_id: string | null;
          p_name: string;
          p_workout_type: "strength" | "running" | "mobility" | "recovery";
          p_description: string;
          p_items: Json;
        };
        Returns: string;
      };
      duplicate_training_template: {
        Args: { p_template_id: string };
        Returns: string;
      };
      start_training_session: {
        Args: { p_scheduled_workout_id: string };
        Returns: string;
      };
      finish_training_session: {
        Args: { p_session_id: string; p_duration_minutes: number | null; p_notes: string };
        Returns: undefined;
      };
      replace_training_session_exercise: {
        Args: { p_session_id: string; p_template_exercise_id: string; p_replacement_exercise_id: string };
        Returns: undefined;
      };
      cancel_training_session: {
        Args: { p_session_id: string };
        Returns: undefined;
      };
      set_habit_entry: {
        Args: { p_habit_id: string; p_entry_date: string; p_status: "pending" | "done" | "skipped" };
        Returns: undefined;
      };
      set_task_entry: {
        Args: { p_task_id: string; p_entry_date: string; p_status: "pending" | "done" | "skipped" };
        Returns: undefined;
      };
      save_habit_day_plan: {
        Args: { p_plan_date: string; p_habit_ids: string[] };
        Returns: undefined;
      };
      save_productivity_goal: {
        Args: { p_goal_id: string | null; p_title: string; p_target_date: string; p_current_value: number; p_target_value: number; p_unit: string; p_status: "active" | "completed" | "paused" | "archived"; p_habit_ids: string[]; p_training_template_ids: string[] };
        Returns: string;
      };
      record_reading_progress: {
        Args: { p_project_id: string; p_session_date: string; p_to_page: number; p_note: string };
        Returns: string;
      };
      sync_my_notifications: {
        Args: { p_local_date: string };
        Returns: number;
      };
      my_billing_access: {
        Args: Record<string, never>;
        Returns: Array<{ tier: "beta" | "pro"; status: string; plan_code: string; plan_name: string; access_until: string | null; cancel_at_period_end: boolean; source: string }>;
      };
      record_my_privacy_choice: {
        Args: { p_document_type: "terms_of_use" | "privacy_notice" | "health_data_consent"; p_event_type: "accepted" | "acknowledged" | "withdrawn" };
        Returns: string;
      };
      submit_my_privacy_request: {
        Args: { p_request_type: "confirmation" | "access" | "correction" | "anonymization" | "deletion" | "portability" | "sharing_information" | "consent_revocation" | "objection" | "automated_decision_review" | "other"; p_details?: string };
        Returns: string;
      };
      consume_api_rate_limit: {
        Args: { p_user_id: string; p_action: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      record_weight: {
        Args: {
          p_weight_kg: number;
          p_source: "profile" | "dashboard" | "progress" | "integration";
          p_recorded_at: string;
          p_operation_id: string;
        };
        Returns: undefined;
      };
      save_physical_data: {
        Args: {
          p_biological_sex: "male" | "female";
          p_height_cm: number;
          p_weight_kg: number;
          p_body_fat_percentage: number | null;
          p_source: "profile" | "dashboard" | "progress" | "integration";
          p_recorded_at: string;
          p_operation_id: string;
        };
        Returns: undefined;
      };
      save_diet_foundation: {
        Args: {
          p_meal_count: number;
          p_health_eligibility_confirmed: boolean;
          p_meal_times: string[];
          p_training_time: "morning" | "afternoon" | "evening" | "varies" | "none";
          p_dietary_pattern: "omnivore" | "vegetarian" | "vegan" | "pescatarian";
          p_allergies: string[];
          p_restrictions: string[];
          p_disliked_foods: string[];
          p_favorite_foods: string[];
          p_cooking_time_minutes: number;
          p_budget_level: "economical" | "moderate" | "flexible";
          p_variety_level: "varied" | "balanced" | "practical";
          p_meal_style: "simple" | "mixed" | "recipes";
          p_calories: number;
          p_protein_g: number;
          p_carbs_g: number;
          p_fat_g: number;
          p_source: "calculated" | "manual";
          p_calculation_version: string;
          p_calculation_inputs: Json;
          p_is_provisional?: boolean;
        };
        Returns: undefined;
      };
      save_weekly_diet_plan: {
        Args: {
          p_week_start: string;
          p_generation_version: string;
          p_targets_snapshot: Json;
          p_preferences_snapshot: Json;
          p_days: Json;
        };
        Returns: string;
      };
      save_weekly_diet_plan_and_sync_consumption: {
        Args: {
          p_week_start: string;
          p_generation_version: string;
          p_targets_snapshot: Json;
          p_preferences_snapshot: Json;
          p_days: Json;
          p_consumed_date: string;
          p_meal_order: number;
          p_meal_name: string;
          p_items_snapshot: Json;
          p_calories: number;
          p_protein_g: number;
          p_carbs_g: number;
          p_fat_g: number;
        };
        Returns: string;
      };
      set_diet_meal_consumption: {
        Args: {
          p_plan_week_start: string;
          p_consumed_date: string;
          p_meal_order: number;
          p_meal_name: string;
          p_items_snapshot: Json;
          p_calories: number;
          p_protein_g: number;
          p_carbs_g: number;
          p_fat_g: number;
          p_consumed: boolean;
        };
        Returns: undefined;
      };
      save_diet_recipe: {
        Args: {
          p_recipe_id: string | null;
          p_name_pt: string;
          p_category: string;
          p_servings: number;
          p_yield_grams: number;
          p_preparation_minutes: number;
          p_instructions: string;
          p_items: Json;
        };
        Returns: string;
      };
      archive_diet_recipe: {
        Args: { p_recipe_id: string };
        Returns: undefined;
      };
      save_diet_meal_template: {
        Args: { p_name_pt: string; p_items: Json };
        Returns: string;
      };
      archive_diet_meal_template: {
        Args: { p_template_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
