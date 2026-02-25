
export enum DiscernmentState {
  VISION_SEED = 'VISION_SEED',
  DISCERNMENT_LOOP = 'DISCERNMENT_LOOP',
  CLARITY_CHECK = 'CLARITY_CHECK',
  VISION_SYNTHESIS = 'VISION_SYNTHESIS',
  COMPLETE = 'COMPLETE'
}

export type AppView = 'landing' | 'auth' | 'dashboard' | 'session' | 'profile' | 'generating' | 'paywall' | 'confirmation' | 'notFound' | 'payments';

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface CreditCard {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
  name: string;
}

export interface VisionDocument {
  title: string;
  summary?: string;
  call: string;
  bible_foundation: { verse: string; meaning: string }[];
  core_values: string[];
  faith_declarations: string[];
  prayer: string;
  next_steps: string[];
}

export interface VisionSession {
  id: string;
  title: string;
  date: string;
  state: DiscernmentState;
  messages: Message[];
  document: VisionDocument | null;
  unlocked: boolean;
  is_paid: boolean;
  language?: string;
}
