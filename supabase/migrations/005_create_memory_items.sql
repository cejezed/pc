-- Enable pgvector extension for semantic search (if not already enabled)
create extension if not exists vector;

-- Create memory_items table
create table public.memory_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text not null check (type in ('fact', 'preference', 'task', 'goal', 'reflection')),
  content text not null,
  importance integer not null default 1 check (importance >= 1 and importance <= 10),
  embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.memory_items enable row level security;

-- Policies
create policy "Users can insert their own memories"
  on public.memory_items for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own memories"
  on public.memory_items for select
  using (auth.uid() = user_id);

create policy "Users can update their own memories"
  on public.memory_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own memories"
  on public.memory_items for delete
  using (auth.uid() = user_id);

-- Create index for vector search
create index on public.memory_items using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Create similarity search function (RPC)
create or replace function match_memories (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    memory_items.id,
    memory_items.content,
    1 - (memory_items.embedding <=> query_embedding) as similarity
  from memory_items
  where memory_items.user_id = p_user_id
  and 1 - (memory_items.embedding <=> query_embedding) > match_threshold
  order by memory_items.embedding <=> query_embedding
  limit match_count;
end;
$$;
