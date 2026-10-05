/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, User } from './firebase/config';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, UserGoals, FoodLogItem, WorkoutSession, ProgressEntry } from './types';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { TodayView } from './components/TodayView';
import { FoodView } from './components/FoodView';
import { WorkoutView } from './components/WorkoutView';
import { ProgressView } from './components/ProgressView';
import { AiCoachView } from './components/AiCoachView';
import { ProfileModal } from './components/ProfileModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'food' | 'workout' | 'progress' | 'ai'>('today');

  // Data states
  const [profile, setProfile] = useState<UserProfile>({
    heightCm: 175,
    weightKg: 75,
    age: 28,
    activityLevel: 'moderate',
  });
  const [goals, setGoals] = useState<UserGoals>({
    calorieTarget: 2200,
    proteinTarget: 150,
    carbTarget: 250,
    fatTarget: 70,
  });
  const [foodLogs, setFoodLogs] = useState<FoodLogItem[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [progressList, setProgressList] = useState<ProgressEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        await loadUserData(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
    setDataLoading(true);
    try {
      // Load Profile
      const profDoc = await getDoc(doc(db, 'users', uid, 'profile', 'main'));
      if (profDoc.exists()) {
        setProfile(profDoc.data() as UserProfile);
      } else {
        await setDoc(doc(db, 'users', uid, 'profile', 'main'), profile);
      }

      // Load Goals
      const goalDoc = await getDoc(doc(db, 'users', uid, 'goals', 'main'));
      if (goalDoc.exists()) {
        setGoals(goalDoc.data() as UserGoals);
      } else {
        await setDoc(doc(db, 'users', uid, 'goals', 'main'), goals);
      }

      // Load Food Logs
      const foodSnap = await getDocs(collection(db, 'users', uid, 'foodLogs'));
      const foods: FoodLogItem[] = foodSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setFoodLogs(foods);

      // Load Workout Sessions
      const workoutSnap = await getDocs(collection(db, 'users', uid, 'workoutSessions'));
      const workList: WorkoutSession[] = workoutSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setSessions(workList);

      // Load Progress
      const progSnap = await getDocs(collection(db, 'users', uid, 'progress'));
      const progList: ProgressEntry[] = progSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setProgressList(progList);
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleRefreshData = async () => {
    if (user) {
      await loadUserData(user.uid);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileOpen(true)}
        userEmail={user.email}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-6">
        {dataLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'today' && (
              <TodayView
                foodLogs={foodLogs}
                goals={goals}
                onNavigateTab={setActiveTab}
                onOpenScan={() => { setActiveTab('food'); setIsScanOpen(true); }}
                onOpenVoice={() => { setActiveTab('food'); setIsVoiceOpen(true); }}
                onOpenManual={() => setActiveTab('food')}
              />
            )}
            {activeTab === 'food' && (
              <FoodView
                foodLogs={foodLogs}
                onRefresh={handleRefreshData}
                isScanOpen={isScanOpen}
                setIsScanOpen={setIsScanOpen}
                isVoiceOpen={isVoiceOpen}
                setIsVoiceOpen={setIsVoiceOpen}
              />
            )}
            {activeTab === 'workout' && (
              <WorkoutView
                sessions={sessions}
                onRefresh={handleRefreshData}
              />
            )}
            {activeTab === 'progress' && (
              <ProgressView
                progressList={progressList}
                onRefresh={handleRefreshData}
              />
            )}
            {activeTab === 'ai' && (
              <AiCoachView
                foodLogs={foodLogs}
                sessions={sessions}
                goals={goals}
                profile={profile}
              />
            )}
          </>
        )}
      </main>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        goals={goals}
        onSave={(newProf, newGoals) => {
          setProfile(newProf);
          setGoals(newGoals);
        }}
      />
    </div>
  );
}
