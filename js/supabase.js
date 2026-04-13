// ===== js/supabase.js =====
// Supabase client initialization
// IMPORTANT: Replace the values below with your actual Supabase project credentials
// Get them from: https://app.supabase.com → Your Project → Settings → API

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ⚠️ REPLACE THESE WITH YOUR PROJECT'S VALUES ⚠️
const SUPABASE_URL = 'https://aokbrbinzkrhtsisncxv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZMgvFqhlJYA9eaQFxXObmQ_b4R9_rjr';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== AUTH HELPERS =====

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/dashboard.html' }
  });
  return { data, error };
}

// ===== HABIT HELPERS =====

export async function getHabits(userId) {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createHabit(habit) {
  const { data, error } = await supabase
    .from('habits')
    .insert([habit])
    .select()
    .single();
  return { data, error };
}

export async function updateHabit(id, updates) {
  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteHabit(id) {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id);
  return { error };
}

// ===== COMPLETIONS HELPERS =====

export async function getCompletions(userId, startDate, endDate) {
  const { data, error } = await supabase
    .from('completions')
    .select('*')
    .eq('user_id', userId)
    .gte('completed_date', startDate)
    .lte('completed_date', endDate);
  return { data, error };
}

export async function toggleCompletion(userId, habitId, date) {
  // Check if already completed
  const { data: existing } = await supabase
    .from('completions')
    .select('id')
    .eq('user_id', userId)
    .eq('habit_id', habitId)
    .eq('completed_date', date)
    .single();

  if (existing) {
    // Un-complete
    const { error } = await supabase
      .from('completions')
      .delete()
      .eq('id', existing.id);
    return { completed: false, error };
  } else {
    // Complete
    const { data, error } = await supabase
      .from('completions')
      .insert([{ user_id: userId, habit_id: habitId, completed_date: date }])
      .select()
      .single();
    return { completed: true, data, error };
  }
}

export async function getTodayCompletions(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('completions')
    .select('habit_id')
    .eq('user_id', userId)
    .eq('completed_date', today);
  return { data, error };
}
