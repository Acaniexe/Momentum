export interface Task { id: number; text: string; done: boolean; priority: "high" | "mid" | "low"; }
export interface Email { id: number; from: string; initials: string; subject: string; preview: string; time: string; unread: boolean; tag?: string; }
export interface NewsItem { title: string; source: string; time: string; url: string; category: string; }
export type PomMode = "focus" | "short" | "long";
