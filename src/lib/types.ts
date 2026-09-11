export type Kind = 'tasks' | 'projects' | 'fitness' | 'sleep' | 'finance' | 'journal' | 'weekly' | 'study';
export type Exercise = {name: string; sets: number; reps: number; weight: number; rir: number};
export type EntryData = {
  title: string; description?: string; status?: string; priority?: string; projectId?: string;
  estimated?: number; actual?: number; tags?: string; progress?: number; color?: string;
  startDate?: string; phase?: string; next?: string; duration?: number; workout?: string;
  feeling?: string; cardio?: number; notes?: string; exercises?: Exercise[];
  hours?: number; quality?: number; energy?: number; mood?: number; bedtime?: string; wake?: string;
  amount?: number; category?: string; type?: string; wins?: string; problems?: string;
  gratitude?: string; tomorrow?: string; score?: number; habits?: string; understanding?: number;
};
export type Entry = {id: string; userId?: string; date: string; data: EntryData; createdAt?: string; updatedAt?: string};
export type Profile = {id: string; displayName: string; email: string | null; budget: string; guest: string};
export type Store = {profile: Profile; records: Record<Kind, Entry[]>; authMode: 'supabase' | 'local'};
export type Field = {key: keyof EntryData | 'date'; label: string; type?: string; options?: string[]; required?: boolean; min?: number; max?: number; placeholder?: string};
