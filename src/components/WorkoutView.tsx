/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkoutSession, WorkoutExercise, WorkoutPlan } from '../types';
import { Dumbbell, Plus, Play, CheckCircle, Trash2, X, Clock, Flame } from 'lucide-react';
import { db, auth } from '../firebase/config';
import { collection, addDoc, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { DateNavigator } from './DateNavigator';

interface WorkoutViewProps {
  sessions: WorkoutSession[];
  selectedDate: string;
  onChangeDate: (date: string) => void;
  onRefresh: () => void;
}

export function WorkoutView({ sessions, selectedDate, onChangeDate, onRefresh }: WorkoutViewProps) {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [exerciseInput, setExerciseInput] = useState('Bench Press, Incline Dumbbell Press, Tricep Pushdown');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkoutPlans();
  }, []);

  const fetchWorkoutPlans = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'workoutPlans'));
      const plans: WorkoutPlan[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setWorkoutPlans(plans);
    } catch (err) {
      console.error('Error fetching workout plans:', err);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim()) return;
    setSubmitting(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        const exercises = exerciseInput.split(',').map((s) => s.trim()).filter(Boolean);
        await addDoc(collection(db, 'users', uid, 'workoutPlans'), {
          title: planTitle.trim(),
          description: planDesc.trim(),
          exercises: exercises.length > 0 ? exercises : ['Exercise 1'],
          createdAt: serverTimestamp(),
        });
        setPlanTitle('');
        setPlanDesc('');
        setExerciseInput('Bench Press, Incline Dumbbell Press');
        setIsPlanModalOpen(false);
        await fetchWorkoutPlans();
      }
    } catch (err) {
      console.error('Error creating workout plan:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (id?: string) => {
    if (!id) return;
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await deleteDoc(doc(db, 'users', uid, 'workoutPlans', id));
        await fetchWorkoutPlans();
      }
    } catch (err) {
      console.error('Error deleting workout plan:', err);
    }
  };

  // Filter sessions for selectedDate
  const daySessions = sessions.filter((s) => s.date === selectedDate);

  const startWorkout = (title: string, defaultExercises: string[]) => {
    const exercises: WorkoutExercise[] = defaultExercises.map((name, idx) => ({
      id: `ex_${idx}_${Date.now()}`,
      name,
      sets: [
        { setNumber: 1, weightKg: 60, reps: 10, completed: false },
        { setNumber: 2, weightKg: 60, reps: 10, completed: false },
        { setNumber: 3, weightKg: 60, reps: 8, completed: false },
      ],
    }));

    setActiveSession({
      planTitle: title,
      date: selectedDate,
      exercises,
      completed: false,
      durationMinutes: 45,
      createdAt: new Date(),
    });
  };

  const updateSet = (exerciseId: string, setIndex: number, field: 'weightKg' | 'reps' | 'completed', value: any) => {
    if (!activeSession) return;
    const updatedExercises = activeSession.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      const newSets = [...ex.sets];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      return { ...ex, sets: newSets };
    });
    setActiveSession({ ...activeSession, exercises: updatedExercises });
  };

  const addSetToExercise = (exerciseId: string) => {
    if (!activeSession) return;
    const updatedExercises = activeSession.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      const lastSet = ex.sets[ex.sets.length - 1] || { weightKg: 50, reps: 10 };
      const newSets = [...ex.sets, { setNumber: ex.sets.length + 1, weightKg: lastSet.weightKg, reps: lastSet.reps, completed: false }];
      return { ...ex, sets: newSets };
    });
    setActiveSession({ ...activeSession, exercises: updatedExercises });
  };

  const saveWorkoutSession = async () => {
    if (!activeSession) return;
    setSubmitting(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await addDoc(collection(db, 'users', uid, 'workoutSessions'), {
          planTitle: activeSession.planTitle,
          date: selectedDate,
          exercises: activeSession.exercises,
          completed: true,
          durationMinutes: activeSession.durationMinutes,
          createdAt: serverTimestamp(),
        });
        setActiveSession(null);
        onRefresh();
      }
    } catch (err) {
      console.error('Error saving workout session:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async (id?: string) => {
    if (!id) return;
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await deleteDoc(doc(db, 'users', uid, 'workoutSessions', id));
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting workout session:', err);
    }
  };

  if (activeSession) {
    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div>
            <span className="text-xs uppercase font-semibold text-emerald-400">Active Workout ({selectedDate})</span>
            <h2 className="text-xl font-extrabold text-white">{activeSession.planTitle}</h2>
          </div>
          <button
            onClick={() => setActiveSession(null)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {activeSession.exercises.map((ex) => (
            <div key={ex.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{ex.name}</h3>
                <button
                  onClick={() => addSetToExercise(ex.id)}
                  className="text-xs text-emerald-400 font-semibold hover:underline"
                >
                  + Add Set
                </button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] text-slate-400 uppercase font-semibold px-2">
                  <span className="col-span-2">Set</span>
                  <span className="col-span-4">Weight (kg)</span>
                  <span className="col-span-4">Reps</span>
                  <span className="col-span-2 text-center">Done</span>
                </div>

                {ex.sets.map((set, sIdx) => (
                  <div key={sIdx} className="grid grid-cols-12 gap-2 items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                    <span className="col-span-2 text-xs font-bold text-slate-400 text-center">{set.setNumber}</span>
                    <div className="col-span-4">
                      <input
                        type="number"
                        step="0.5"
                        value={set.weightKg}
                        onChange={(e) => updateSet(ex.id, sIdx, 'weightKg', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-emerald-500 tabular-nums"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(ex.id, sIdx, 'reps', parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-emerald-500 tabular-nums"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <input
                        type="checkbox"
                        checked={set.completed || false}
                        onChange={(e) => updateSet(ex.id, sIdx, 'completed', e.target.checked)}
                        className="w-5 h-5 rounded accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={saveWorkoutSession}
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
        >
          <CheckCircle className="w-5 h-5" />
          {submitting ? 'Saving Session...' : 'Finish & Complete Workout'}
        </button>
      </div>
    );
  }

  const defaultPlans = [
    { title: 'Push Day', desc: 'Chest, Shoulders & Triceps', exercises: ['Bench Press', 'Incline Dumbbell Press', 'Shoulder Press', 'Tricep Pushdown'] },
    { title: 'Pull Day', desc: 'Back & Biceps', exercises: ['Deadlift', 'Lat Pulldown', 'Barbell Row', 'Bicep Curl'] },
    { title: 'Leg Day', desc: 'Quads, Hamstrings & Calves', exercises: ['Barbell Squat', 'Romanian Deadlift', 'Leg Press', 'Calf Raise'] },
  ];

  return (
    <div className="space-y-6 pb-24">
      <DateNavigator selectedDate={selectedDate} onChangeDate={onChangeDate} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Workout Structures</h2>
          <p className="text-xs text-slate-400">Design daily routines (Chest Day, Leg Day, Custom) and start workouts.</p>
        </div>
        <button
          onClick={() => setIsPlanModalOpen(true)}
          className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" /> Create Routine
        </button>
      </div>

      {/* Workout Routines / Plans */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">Available Workout Routines</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {defaultPlans.map((p, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-bold text-white">{p.title}</h4>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">Preset</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{p.desc}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {p.exercises.map((ex, eIdx) => (
                    <span key={eIdx} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-1 rounded-lg">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => startWorkout(p.title, p.exercises)}
                className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Workout
              </button>
            </div>
          ))}

          {workoutPlans.map((plan) => (
            <div key={plan.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-bold text-white">{plan.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-md">Custom</span>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-slate-500 hover:text-red-400"
                      title="Delete routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-3">{plan.description || 'Custom workout routine'}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {plan.exercises.map((ex, eIdx) => (
                    <span key={eIdx} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-1 rounded-lg">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => startWorkout(plan.title, plan.exercises)}
                className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Workout
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Workout History for Selected Date */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <h3 className="text-base font-bold text-white">Workouts Completed on {selectedDate}</h3>
        {daySessions.length === 0 ? (
          <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No workout sessions logged for this date</p>
            <p className="text-xs text-slate-500 mt-1">Start a workout routine above.</p>
          </div>
        ) : (
          daySessions.map((session) => (
            <div key={session.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{session.planTitle}</h4>
                  <p className="text-xs text-slate-400">
                    {session.date} &bull; {session.exercises?.length || 0} exercises &bull; {session.durationMinutes || 45} mins
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteSession(session.id)}
                className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create Routine Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Create Custom Workout Routine</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Routine Name (e.g. Chest Day, Leg Day)</label>
                <input
                  type="text"
                  placeholder="e.g. Chest & Biceps"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Heavy compound movements & hypertrophy"
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Exercises (comma separated)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Barbell Bench Press, Incline Dumbbell Fly, Cable Crossover"
                  value={exerciseInput}
                  onChange={(e) => setExerciseInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-6 shadow-lg shadow-emerald-950"
              >
                <Plus className="w-4 h-4" />
                {submitting ? 'Creating...' : 'Save Workout Routine'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
