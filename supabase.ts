console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("SUPABASE KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);

import { createClient } from '@supabase/supabase-js';

// 'as string' qo'shish shart, aks holda TypeScript 'undefined' deb xato beradi
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
}

export async function signUpWithProfile(email, password, name) {
  const { data, error: authError } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        full_name: name
      }
    }
  });
  
  if (authError) {
    if (authError.message.includes("User already registered")) {
      throw new Error("An account with this email already exists. Please log in instead.");
    }
    throw authError;
  }
  
  if (!data.user) throw new Error("Authentication failed. Check your email if verification is required.");

  return data.user;
}

export async function ensureUserProfile(user: any) {
  if (!user) return;

  const name =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Hazon User";

  const { error } = await supabase
    .from("app_users")
    .upsert({
      id: user.id,
      full_name: name,
      email: user.email,
    }, { onConflict: 'id' });

  if (error) console.error("Profile creation error:", error);
}
export async function updateVisionChatSession(visionId: string, messages: any[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No authenticated user session.");

  const { error } = await supabase
    .from('visions')
    .update({ chat_session: messages })
    .eq('id', visionId)
    .eq('user_id', user.id);
    
  if (error) {
    console.error("Failed to sync chat history to Supabase:", error);
    throw error;
  }
}

export async function createVisionInDB(title: string, status: string, language?: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("User session expired.");

  const { data, error } = await supabase
    .from("visions")
    .insert({
      user_id: user.id,
      title: title || "New Vision",
      status,
      chat_session: [],
      language: language ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}