import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Task, Habit, Note, AppMode, Sketch } from '@/src/types';
import { User } from 'firebase/auth';

export function useNextGen(user: User | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sketches, setSketches] = useState<Sketch[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AppMode>('full');

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setHabits([]);
      setNotes([]);
      setSketches([]);
      setLoading(false);
      return;
    }

    const tasksQuery = query(
      collection(db, `users/${user.uid}/tasks`),
      orderBy('createdAt', 'desc')
    );
    const habitsQuery = query(collection(db, `users/${user.uid}/habits`));
    const notesQuery = query(
      collection(db, `users/${user.uid}/notes`),
      orderBy('updatedAt', 'desc')
    );
    const sketchesQuery = query(
      collection(db, `users/${user.uid}/sketches`),
      orderBy('createdAt', 'desc')
    );

    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    }, (err) => {
      console.error("Error in tasks snapshot:", err);
    });

    const unsubHabits = onSnapshot(habitsQuery, (snapshot) => {
      setHabits(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Habit)));
    }, (err) => {
      console.error("Error in habits snapshot:", err);
    });

    const unsubNotes = onSnapshot(notesQuery, (snapshot) => {
      setNotes(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Note)));
      setLoading(false);
    }, (err) => {
      console.error("Error in notes snapshot:", err);
      setLoading(false);
    });

    const unsubSketches = onSnapshot(sketchesQuery, (snapshot) => {
      setSketches(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sketch)));
    }, (err) => {
      console.error("Error in sketches snapshot:", err);
    });

    return () => {
      unsubTasks();
      unsubHabits();
      unsubNotes();
      unsubSketches();
    };
  }, [user]);

  const addTask = async (task: Partial<Task>) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}/tasks`), {
      ...task,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    await updateDoc(doc(db, `users/${user.uid}/tasks`, id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/tasks`, id));
  };

  const addHabit = async (habit: Partial<Habit>) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}/habits`), {
      ...habit,
      userId: user.uid,
      streak: 0,
      lastCompleted: null,
      createdAt: new Date().toISOString(),
    });
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    if (!user) return;
    await updateDoc(doc(db, `users/${user.uid}/habits`, id), updates);
  };

  const deleteHabit = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/habits`, id));
  };

  const addNote = async (note: Partial<Note>) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}/notes`), {
      ...note,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!user) return;
    await updateDoc(doc(db, `users/${user.uid}/notes`, id), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteNote = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/notes`, id));
  };

  return {
    tasks,
    habits,
    notes,
    sketches,
    loading,
    mode,
    setMode,
    addTask,
    updateTask,
    deleteTask,
    addHabit,
    updateHabit,
    deleteHabit,
    addNote,
    updateNote,
    deleteNote,
    user
  };
}
