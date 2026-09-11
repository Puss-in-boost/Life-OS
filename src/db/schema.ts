import { pgTable, uuid, text, timestamp, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import type { EntryData } from '@/lib/types';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(), email: text('email').unique(),
  displayName: text('display_name').notNull().default('朋友'), passwordHash: text('password_hash'),
  budget: text('budget').notNull().default('5000'), guest: text('guest').notNull().default('false'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const sessions = pgTable('life_sessions', {
  id: text('id').primaryKey(), userId: uuid('user_id').notNull().references(() => profiles.id, {onDelete:'cascade'}),
  expiresAt: timestamp('expires_at').notNull(),
});
function recordTable(name: string, daily = false) {
  return pgTable(name, {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => profiles.id, {onDelete:'cascade'}),
    date: text('date').notNull(), data: jsonb('data').$type<EntryData>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(), updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }, t => [index(`${name}_owner_idx`).on(t.userId), ...(daily ? [uniqueIndex(`${name}_date_unique`).on(t.userId, t.date)] : [])]);
}
export const projects = recordTable('projects');
export const tasks = recordTable('tasks');
export const fitnessSessions = recordTable('fitness_sessions');
export const sleepLogs = recordTable('sleep_logs', true);
export const financeRecords = recordTable('finance_records');
export const dailyReviews = recordTable('daily_reviews', true);
export const weeklyReviews = recordTable('weekly_reviews', true);
export const studyEntries = recordTable('study_entries');
export const tables = {projects, tasks, fitness: fitnessSessions, sleep: sleepLogs, finance: financeRecords, journal: dailyReviews, weekly: weeklyReviews, study: studyEntries};
