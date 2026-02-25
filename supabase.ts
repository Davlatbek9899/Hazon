
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://hihspfadzevcdhqgixak.supabase.co';
export const supabaseKey = 'sb_publishable_8rWpg_GtiWizqwM0mK_Wrw_bZL6eVF-';

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

export async function ensureUserProfile(user) {
  if (!user) return;
  
  const { data, error } = await supabase
    .from('app_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "Hazon User";
    const { error: insertError } = await supabase.from('app_users').insert({
      id: user.id,
      full_name: name,
      email: user.email
    });
    if (insertError) console.error("Profile creation error:", insertError);
  }
}

export async function createVisionInDB(title, status, language?: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("User session expired.");

  const { data, error } = await supabase
    .from('visions')
    .insert({ 
      user_id: user.id, 
      title: title || 'New Vision', 
      status: status,
      chat_session: [],
      language: language
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
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
