/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserGoals, UserProfile } from '../types';
import { X, Save, User, Flame } from 'lucide-react';
import { db, auth } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  goals: UserGoals;
  onSave: (profile: UserProfile, goals: UserGoals) => void;
}

export function ProfileModal({ isOpen, onClose, profile, goals, onSave }: ProfileModalProps) {
  const [formData, setFormData] = useState({ ...profile });
  const [goalData, setGoalData] = useState({ ...goals });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await setDoc(doc(db, 'users', uid, 'profile', 'main'), {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
        await setDoc(doc(db, 'users', uid, 'goals', 'main'), {
          ...goalData,
          updatedAt: new Date().toISOString(),
        });
      }
      onSave(formData, goalData);
      onClose();
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Profile & Daily Goals</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Body Metrics</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weightKg}
                  onChange={(e) => setFormData({ ...formData, weightKg: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Height (cm)</label>
                <input
                  type="number"
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Activity Level</label>
                <select
                  value={formData.activityLevel}
                  onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Lightly Active</option>
                  <option value="moderate">Moderately Active</option>
                  <option value="very">Very Active</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4" /> Nutrition & Calorie Targets
            </p>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Daily Calorie Target (kcal)</label>
              <input
                type="number"
                value={goalData.calorieTarget}
                onChange={(e) => setGoalData({ ...goalData, calorieTarget: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Protein (g)</label>
                <input
                  type="number"
                  value={goalData.proteinTarget}
                  onChange={(e) => setGoalData({ ...goalData, proteinTarget: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Carbs (g)</label>
                <input
                  type="number"
                  value={goalData.carbTarget}
                  onChange={(e) => setGoalData({ ...goalData, carbTarget: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Fat (g)</label>
                <input
                  type="number"
                  value={goalData.fatTarget}
                  onChange={(e) => setGoalData({ ...goalData, fatTarget: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-6 transition-all shadow-lg shadow-emerald-950"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile & Targets'}
          </button>
        </form>
      </div>
    </div>
  );
}
