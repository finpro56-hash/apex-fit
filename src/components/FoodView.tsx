/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FoodLogItem } from '../types';
import { Plus, Camera, Mic, Trash2, Apple, Sparkles, Check, X, Loader2 } from 'lucide-react';
import { db, auth } from '../firebase/config';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { DateNavigator } from './DateNavigator';

interface FoodViewProps {
  foodLogs: FoodLogItem[];
  selectedDate: string;
  onChangeDate: (date: string) => void;
  onRefresh: () => void;
  isScanOpen: boolean;
  setIsScanOpen: (open: boolean) => void;
  isVoiceOpen: boolean;
  setIsVoiceOpen: (open: boolean) => void;
}

export function FoodView({
  foodLogs,
  selectedDate,
  onChangeDate,
  onRefresh,
  isScanOpen,
  setIsScanOpen,
  isVoiceOpen,
  setIsVoiceOpen,
}: FoodViewProps) {
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [foodName, setFoodName] = useState('');
  const [portion, setPortion] = useState('1 serving');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [estimating, setEstimating] = useState(false);

  // AI Scan & Voice states
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [textInput, setTextInput] = useState('');

  // Filter food logs for selectedDate
  const dayFoodLogs = foodLogs.filter((item) => {
    const itemDate = item.date || (item.createdAt && typeof item.createdAt.toDate === 'function' ? item.createdAt.toDate().toISOString().split('T')[0] : selectedDate);
    return itemDate === selectedDate;
  });

  const handleAutoEstimate = async () => {
    if (!foodName.trim()) return;
    setEstimating(true);
    try {
      const res = await fetch('/api/estimate-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodName, quantity: portion }),
      });
      const data = await res.json();
      if (res.ok) {
        setCalories(String(data.calories || ''));
        setProtein(String(data.protein_g || ''));
        setCarbs(String(data.carbs_g || ''));
        setFat(String(data.fat_g || ''));
      } else {
        alert(data.error || 'Failed to estimate macros');
      }
    } catch (err) {
      console.error('Estimation error:', err);
      alert('Failed to estimate macros');
    } finally {
      setEstimating(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;
    setSubmitting(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await addDoc(collection(db, 'users', uid, 'foodLogs'), {
          date: selectedDate,
          mealType,
          foodName: foodName.trim(),
          portion: portion.trim(),
          calories: parseInt(calories) || 0,
          proteinG: parseFloat(protein) || 0,
          carbsG: parseFloat(carbs) || 0,
          fatG: parseFloat(fat) || 0,
          source: 'manual',
          userConfirmed: true,
          createdAt: serverTimestamp(),
        });
        setFoodName('');
        setPortion('1 serving');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFat('');
        setIsManualOpen(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Error adding food:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await deleteDoc(doc(db, 'users', uid, 'foodLogs', id));
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting food:', err);
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/analyze-food-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64String, mimeType: file.type }),
        });
        const data = await res.json();
        if (res.ok) {
          setAiResult(data);
        } else {
          alert(data.error || 'Failed to analyze photo');
        }
      } catch (err) {
        console.error('Photo analysis error:', err);
        alert('Failed to analyze photo');
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTextExtract = async () => {
    if (!textInput.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/extract-food-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiResult({ meal: 'lunch', foods: data.entries.map((e: any) => ({ name: e.food_name, estimated_portion: e.portion, calories: e.calories, protein_g: e.protein_g, carbs_g: e.carbs_g, fat_g: e.fat_g })) });
      } else {
        alert(data.error || 'Failed to extract food');
      }
    } catch (err) {
      console.error('Text extraction error:', err);
      alert('Failed to extract food');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmAiEntries = async () => {
    if (!aiResult || !aiResult.foods) return;
    setSubmitting(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        for (const item of aiResult.foods) {
          await addDoc(collection(db, 'users', uid, 'foodLogs'), {
            date: selectedDate,
            mealType: (aiResult.meal || 'lunch').toLowerCase(),
            foodName: item.name,
            portion: item.estimated_portion || '1 serving',
            calories: item.calories || 0,
            proteinG: item.protein_g || 0,
            carbsG: item.carbs_g || 0,
            fatG: item.fat_g || 0,
            source: 'photo',
            estimatedByAI: true,
            confidence: aiResult.confidence || 0.8,
            userConfirmed: true,
            createdAt: serverTimestamp(),
          });
        }
        setAiResult(null);
        setIsScanOpen(false);
        setIsVoiceOpen(false);
        setTextInput('');
        onRefresh();
      }
    } catch (err) {
      console.error('Error saving AI food entries:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <DateNavigator selectedDate={selectedDate} onChangeDate={onChangeDate} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Food Tracker</h2>
          <p className="text-xs text-slate-400">Log meals for selected date.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsScanOpen(true)}
            className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <Camera className="w-4 h-4" /> Scan
          </button>
          <button
            onClick={() => setIsVoiceOpen(true)}
            className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <Mic className="w-4 h-4" /> Tell AI
          </button>
          <button
            onClick={() => setIsManualOpen(true)}
            className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Logged Food List */}
      <div className="space-y-3">
        {dayFoodLogs.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <Apple className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No food logged for this date</p>
            <p className="text-xs text-slate-500 mt-1">Tap Add, Scan, or Tell AI to log meals for {selectedDate}.</p>
          </div>
        ) : (
          dayFoodLogs.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 font-bold capitalize">
                  {item.mealType[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{item.foodName}</h4>
                    {item.estimatedByAI && (
                      <span className="text-[10px] bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {item.portion || '1 serving'} · P: {Math.round(item.proteinG || 0)}g · C: {Math.round(item.carbsG || 0)}g · F: {Math.round(item.fatG || 0)}g
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-sm font-bold text-white tabular-nums">{item.calories}</span>
                  <span className="text-xs text-slate-400 ml-1">kcal</span>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Add Modal */}
      {isManualOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Add Food for {selectedDate}</h3>
              <button onClick={() => setIsManualOpen(false)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Meal</label>
                <select
                  value={mealType}
                  onChange={(e: any) => setMealType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="snack">Snack</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Food Name</label>
                <input
                  type="text"
                  placeholder="e.g. Grilled Chicken Salad"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Quantity / Portion</label>
                <input
                  type="text"
                  placeholder="e.g. 1 plate, 200g, 2 bowls"
                  value={portion}
                  onChange={(e) => setPortion(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="button"
                onClick={handleAutoEstimate}
                disabled={!foodName.trim() || estimating}
                className="w-full h-11 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-emerald-600/30 transition-all disabled:opacity-50"
              >
                {estimating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {estimating ? 'Calculating with Gemini...' : '✨ Auto-Fill Macros with Gemini'}
              </button>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Calories (kcal)</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 tabular-nums"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 tabular-nums"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-6 shadow-lg shadow-emerald-950"
              >
                <Plus className="w-4 h-4" />
                {submitting ? 'Saving...' : 'Add Food Entry'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Scan Photo Modal */}
      {isScanOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Camera className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Gemini Food Photo Scan ({selectedDate})</h3>
              </div>
              <button onClick={() => { setIsScanOpen(false); setAiResult(null); }} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!aiResult && !analyzing && (
              <div className="space-y-4 text-center py-8">
                <div className="w-20 h-20 rounded-3xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-sm text-slate-300">Take a photo of your meal or upload an image for instant AI calorie & macro estimation.</p>
                <label className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm cursor-pointer shadow-lg shadow-blue-950">
                  <Camera className="w-4 h-4 mr-2" /> Take / Upload Photo
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="hidden" />
                </label>
              </div>
            )}

            {analyzing && (
              <div className="text-center py-16 space-y-4">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
                <p className="text-sm font-medium text-slate-200">Gemini is analyzing your food photo...</p>
              </div>
            )}

            {aiResult && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs uppercase font-semibold text-blue-400">Meal: {aiResult.meal}</span>
                    <span className="text-xs text-slate-400">Confidence: {Math.round((aiResult.confidence || 0.8) * 100)}%</span>
                  </div>
                  <div className="space-y-2">
                    {aiResult.foods?.map((f: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-700/50 pb-2">
                        <div>
                          <p className="font-semibold text-white">{f.name}</p>
                          <p className="text-slate-400">{f.estimated_portion} · P: {f.protein_g}g · C: {f.carbs_g}g · F: {f.fat_g}g</p>
                        </div>
                        <span className="font-bold text-emerald-400">{f.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 font-bold text-sm text-white">
                    <span>Total Estimated Calories</span>
                    <span className="text-emerald-400">{aiResult.total_calories} kcal</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setAiResult(null)}
                    className="flex-1 h-12 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700"
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleConfirmAiEntries}
                    disabled={submitting}
                    className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
                  >
                    <Check className="w-4 h-4" />
                    {submitting ? 'Saving...' : 'Confirm & Add'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voice / Text AI Modal */}
      {isVoiceOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Mic className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Gemini Voice / Text Logging ({selectedDate})</h3>
              </div>
              <button onClick={() => { setIsVoiceOpen(false); setAiResult(null); setTextInput(''); }} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!aiResult && !analyzing && (
              <div className="space-y-4 py-4">
                <p className="text-xs text-slate-400">Describe what you ate in natural language (e.g. "For lunch I had two chicken biriyani plates and a glass of lassi").</p>
                <textarea
                  rows={4}
                  placeholder="Type or describe what you ate..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleTextExtract}
                  disabled={!textInput.trim()}
                  className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-950 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" /> Extract & Estimate Nutrition
                </button>
              </div>
            )}

            {analyzing && (
              <div className="text-center py-16 space-y-4">
                <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
                <p className="text-sm font-medium text-slate-200">Gemini is extracting food items...</p>
              </div>
            )}

            {aiResult && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
                  <span className="text-xs uppercase font-semibold text-purple-400">Extracted Food Items</span>
                  <div className="space-y-2">
                    {aiResult.foods?.map((f: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-700/50 pb-2">
                        <div>
                          <p className="font-semibold text-white">{f.name}</p>
                          <p className="text-slate-400">{f.estimated_portion} · P: {f.protein_g}g · C: {f.carbs_g}g · F: {f.fat_g}g</p>
                        </div>
                        <span className="font-bold text-emerald-400">{f.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setAiResult(null)}
                    className="flex-1 h-12 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700"
                  >
                    Edit Description
                  </button>
                  <button
                    onClick={handleConfirmAiEntries}
                    disabled={submitting}
                    className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
                  >
                    <Check className="w-4 h-4" />
                    {submitting ? 'Saving...' : 'Confirm & Add'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
