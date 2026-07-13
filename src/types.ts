/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'backlog';
export type NoteType = 'text' | 'canvas' | 'capture';
export type HabitFrequency = 'daily' | 'weekly' | 'monthly';
export type AppMode = 'full' | 'external_brain' | 'minimalist' | 'calendar' | 'notebook' | 'settings';

export interface RecurrenceRule {
  days: number[]; // 0-6 (Sun-Sat)
  until?: string; // ISO Date
}

export interface Sketch {
  id: string;
  title: string;
  imageData: string; // Preview image
  paths: string; // JSON string of drawing paths
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  recurrence?: RecurrenceRule;
  isDeepWork: boolean;
  googleEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  frequency: HabitFrequency;
  streak: number;
  lastCompleted?: string | null;
  history: string[]; // ISO Dates of completion
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: NoteType;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  mode: AppMode;
  onboardingCompleted: boolean;
}
