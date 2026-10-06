/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { auth, db, onAuthStateChanged, User } from './firebase/config';
import { collection, getDocs, doc, getDoc, setDoc, query, limit, orderBy } from 'firebase/firestore';
import { UserProfile, UserGoals, FoodLogItem, WorkoutSession, ProgressEntry } from './types';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { ProfileModal } from './components/ProfileModal';
import { Loader2 } from 'lucide-react';

// Lazy-loaded tab components for code splitting & fast initial bundle load
const TodayView = lazy(() => import('./components/TodayView').then((m) => ({ default: m.TodayView })));
const FoodView = lazy(() => import('./components/FoodView').then((m) => ({ default: m.FoodView })));
const WorkoutView = lazy(() => import('./components/WorkoutView').then((m) => ({ default: m.WorkoutView })));
const ProgressView = lazy(() => import('./components/ProgressView').then((m) => ({ default: m.ProgressView })));
const AiCoachView = lazy(() => import('./components/AiCoachView').then((m) => ({ default: m.AiCoachView })));

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ViewFallback() {
  return (
    <div className="flex items-center justify-center py-24 min-h-[300px]">
      <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'food' | 'workout' | 'progress' | 'ai'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());

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
      // 1. Load Profile
      const profDoc = await getDoc(doc(db, 'users', uid, 'profile', 'main'));
      if (profDoc.exists()) {
        setProfile(profDoc.data() as UserProfile);
      } else {
        await setDoc(doc(db, 'users', uid, 'profile', 'main'), profile);
      }

      // 2. Load Goals
      const goalDoc = await getDoc(doc(db, 'users', uid, 'goals', 'main'));
      if (goalDoc.exists()) {
        setGoals(goalDoc.data() as UserGoals);
      } else {
        await setDoc(doc(db, 'users', uid, 'goals', 'main'), goals);
      }

      // 3. Load Food Logs (Bounded to recent 100 entries / ~30 days)
      try {
        const foodQuery = query(collection(db, 'users', uid, 'foodLogs'), limit(150));
        const foodSnap = await getDocs(foodQuery);
        const foods: FoodLogItem[] = foodSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setFoodLogs(foods);
      } catch (e) {
        console.warn('Fallback loading foodLogs without query limit:', e);
        const foodSnap = await getDocs(collection(db, 'users', uid, 'foodLogs'));
        setFoodLogs(foodSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      }

      // 4. Load Workout Sessions (Bounded limit)
      try {
        const workoutQuery = query(collection(db, 'users', uid, 'workoutSessions'), limit(60));
        const workoutSnap = await getDocs(workoutQuery);
        const workList: WorkoutSession[] = workoutSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setSessions(workList);
      } catch (e) {
        const workoutSnap = await getDocs(collection(db, 'users', uid, 'workoutSessions'));
        setSessions(workoutSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      }

      // 5. Load Progress (Bounded limit)
      try {
        const progQuery = query(collection(db, 'users', uid, 'progress'), limit(100));
        const progSnap = await getDocs(progQuery);
        const progList: ProgressEntry[] = progSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setProgressList(progList);
      } catch (e) {
        const progSnap = await getDocs(collection(db, 'users', uid, 'progress'));
        setProgressList(progSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      }
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
          <Suspense fallback={<ViewFallback />}>
            {activeTab === 'today' && (
              <TodayView
                foodLogs={foodLogs}
                goals={goals}
                selectedDate={selectedDate}
                onChangeDate={setSelectedDate}
                onNavigateTab={setActiveTab}
                onOpenScan={() => { setActiveTab('food'); setIsScanOpen(true); }}
                onOpenVoice={() => { setActiveTab('food'); setIsVoiceOpen(true); }}
                onOpenManual={() => setActiveTab('food')}
              />
            )}
            {activeTab === 'food' && (
              <FoodView
                foodLogs={foodLogs}
                setFoodLogs={setFoodLogs}
                selectedDate={selectedDate}
                onChangeDate={setSelectedDate}
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
                setSessions={setSessions}
                selectedDate={selectedDate}
                onChangeDate={setSelectedDate}
                onRefresh={handleRefreshData}
              />
            )}
            {activeTab === 'progress' && (
              <ProgressView
                progressList={progressList}
                setProgressList={setProgressList}
                foodLogs={foodLogs}
                goals={goals}
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
          </Suspense>
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
