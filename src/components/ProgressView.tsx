/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProgressEntry } from '../types';
import { TrendingUp, Plus, Trash2, Scale, X } from 'lucide-react';
import { db, auth } from '../firebase/config';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface ProgressViewProps {
  progressList: ProgressEntry[];
  onRefresh: () => void;
}

export function ProgressView({ progressList, onRefresh }: ProgressViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightKg) return;
    setSubmitting(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await addDoc(collection(db, 'users', uid, 'progress'), {
          date: new Date().toISOString().split('T')[0],
          weightKg: parseFloat(weightKg),
          bodyFatPercentage: bodyFat ? parseFloat(bodyFat) : null,
          notes: notes.trim(),
          createdAt: serverTimestamp(),
        });
        setWeightKg('');
        setBodyFat('');
        setNotes('');
        setIsAddOpen(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Error adding progress entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await deleteDoc(doc(db, 'users', uid, 'progress', id));
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting progress entry:', err);
    }
  };

  const sortedList = [...progressList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestWeight = sortedList[0]?.weightKg || 70;
  const initialWeight = sortedList[sortedList.length - 1]?.weightKg || latestWeight;
  const weightDiff = Math.round((latestWeight - initialWeight) * 10) / 10;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Progress Analytics</h2>
          <p className="text-xs text-slate-400">Track body weight and consistency over time.</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" /> Log Weight
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">Current Weight</p>
          <p className="text-2xl font-extrabold text-white tabular-nums">{latestWeight} <span className="text-sm font-normal text-slate-400">kg</span></p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">Total Change</p>
          <p className={`text-2xl font-extrabold tabular-nums ${weightDiff <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {weightDiff > 0 ? `+${weightDiff}` : weightDiff} <span className="text-sm font-normal text-slate-400">kg</span>
          </p>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white">Weight Log History</h3>
        {sortedList.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <Scale className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No weight entries logged yet</p>
            <p className="text-xs text-slate-500 mt-1">Tap Log Weight above to record your body weight.</p>
          </div>
        ) : (
          sortedList.map((entry) => (
            <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tabular-nums">{entry.weightKg} kg</h4>
                  <p className="text-xs text-slate-400">
                    {entry.date} {entry.bodyFatPercentage ? `&bull; BF: ${entry.bodyFatPercentage}%` : ''} {entry.notes ? `&bull; ${entry.notes}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Progress Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Log Body Weight</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 75.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 tabular-nums"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Body Fat % (Optional)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 18.5"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Morning weigh-in fasting"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-6 shadow-lg shadow-emerald-950"
              >
                <Plus className="w-4 h-4" />
                {submitting ? 'Saving...' : 'Save Weight Log'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
