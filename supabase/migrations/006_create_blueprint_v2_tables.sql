-- Enable vector extension if not already enabled (useful for future)
create extension if not exists vector;

-- 1. Moments (Ambient Captures)
create table if not exists public.moments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now() not null,
  entry_date date default current_date not null,
  
  label text not null, -- 'tired', 'win', 'stress', etc.
  intensity integer check (intensity between 1 and 5),
  category text, -- 'energy', 'mood', 'social', 'work'
  context text,
  
  voice_transcript text,
  voice_url text,
  
  resolved_at timestamptz,
  resolution_action text,
  effectiveness integer check (effectiveness between 1 and 5),
  created_by text default 'user'
);

-- 2. Conversations (Voice/Text Chats)
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now() not null,
  
  role text not null check (role in ('user', 'coach')),
  text text not null,
  voice_url text,
  tags text[]
);

-- 3. Evening Reflections
create table if not exists public.evening_reflections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  entry_date date not null,
  created_at timestamptz default now() not null,

  highlights text,
  challenges text,
  relational text,
  authenticity_score integer check (authenticity_score between 1 and 100),
  tomorrow_focus text,
  
  voice_transcript text,
  voice_url text,
  
  unique(user_id, entry_date)
);

-- 4. Patterns (Auto-Detected)
create table if not exists public.patterns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  
  pattern_id text not null,
  domain text not null, -- 'health', 'sleep', 'relationships'
  description text not null,
  confidence numeric(3,2) not null check (confidence between 0.0 and 1.0),
  
  evidence jsonb,
  
  discovered_at timestamptz default now() not null,
  last_seen timestamptz default now(),
  
  unique(user_id, pattern_id)
);

-- 5. Personal Knowledge (Structured Memory)
create table if not exists public.personal_knowledge (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  
  category text not null check (category in ('pattern', 'preference', 'value', 'blindspot', 'goal', 'strength', 'challenge')),
  summary text not null,
  confidence numeric(3,2) default 0.8 not null check (confidence between 0.0 and 1.0),
  source text,
  
  last_updated date default current_date not null,
  created_at timestamptz default now() not null
);

-- 6. Insights (Historical Coaching)
create table if not exists public.insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now() not null,
  
  type text,
  title text,
  text text not null,
  pattern_id uuid references public.patterns(id),
  
  acknowledged_at timestamptz,
  acted_on boolean default false,
  action_notes text
);

-- 7. Voice Transcripts (Metadata)
create table if not exists public.voice_transcripts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  
  moment_id uuid references public.moments(id),
  conversation_id uuid references public.conversations(id),
  
  audio_url text not null,
  transcript text not null,
  duration_seconds integer,
  created_at timestamptz default now() not null
);

-- Enable RLS on all new tables
alter table public.moments enable row level security;
alter table public.conversations enable row level security;
alter table public.evening_reflections enable row level security;
alter table public.patterns enable row level security;
alter table public.personal_knowledge enable row level security;
alter table public.insights enable row level security;
alter table public.voice_transcripts enable row level security;

-- Create simple "Users can only see/edit their own data" policies for all
create policy "Users manage their own moments" on public.moments using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own conversations" on public.conversations using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own reflections" on public.evening_reflections using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own patterns" on public.patterns using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own knowledge" on public.personal_knowledge using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own insights" on public.insights using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own transcripts" on public.voice_transcripts using (auth.uid() = user_id) with check (auth.uid() = user_id);
