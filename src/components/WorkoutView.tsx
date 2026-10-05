/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkoutSession, WorkoutExercise } from '../types';
import { Dumbbell, Plus, Play, CheckCircle, Trash2, X, Clock, Flame } from 'lucide-react';
import { db, auth } from '../firebase/config';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface WorkoutViewProps {
  sessions: WorkoutSession[];
  onRefresh: () => void;
}

export function WorkoutView({ sessions, onRefresh }: WorkoutViewProps) {
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [exerciseList, setExerciseList] = useState<string>('Bench Press\nIncline Dumbbell Press\nShoulder Press');
  const [submitting, setSubmitting] = useState(false);

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
      date: new Date().toISOString().split('T')[0],
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
          date: activeSession.date,
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
            <span className="text-xs uppercase font-semibold text-emerald-400">Active Workout</span>
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

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Workout Tracker</h2>
          <p className="text-xs text-slate-400">Start a workout session or browse training plans.</p>
        </div>
      </div>

      {/* Quick Workout Starters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-3">
              <Dumbbell className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Push Day</h3>
            <p className="text-xs text-slate-400 mb-4">Bench Press, Incline Press, Overhead Press, Triceps.</p>
          </div>
          <button
            onClick={() => startWorkout('Push Day', ['Bench Press', 'Incline Dumbbell Press', 'Shoulder Press', 'Tricep Pushdown'])}
            className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Start Workout
          </button>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Pull Day</h3>
            <p className="text-xs text-slate-400 mb-4">Deadlift, Pull-ups, Barbell Row, Bicep Curls.</p>
          </div>
          <button
            onClick={() => startWorkout('Pull Day', ['Deadlift', 'Lat Pulldown', 'Barbell Row', 'Bicep Curl'])}
            className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-950"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Start Workout
          </button>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Leg Day</h3>
            <p className="text-xs text-slate-400 mb-4">Squats, Romanian Deadlifts, Leg Press, Calf Raises.</p>
          </div>
          <button
            onClick={() => startWorkout('Leg Day', ['Barbell Squat', 'Romanian Deadlift', 'Leg Press', 'Calf Raise'])}
            className="w-full h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-950"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Start Workout
          </button>
        </div>
      </div>

      {/* Workout History */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white">Workout History</h3>
        {sessions.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No workouts completed yet</p>
            <p className="text-xs text-slate-500 mt-1">Start a workout session above to log sets and reps.</p>
          </div>
        ) : (
          sessions.map((session) => (
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
    </div>
  );
}
