-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles & Subscription
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'premium')),
  credits_remaining integer default 10, -- Free tier limit
  storage_used_mb float default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Trigger for new user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, subscription_tier, credits_remaining)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    'free',
    10
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Projects (Grouping datasets)
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table projects enable row level security;
create policy "Users can view own projects" on projects for select using (auth.uid() = user_id);
create policy "Users can insert own projects" on projects for insert with check (auth.uid() = user_id);
create policy "Users can delete own projects" on projects for delete using (auth.uid() = user_id);

-- 3. Datasets (Real references)
create table public.datasets (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects on delete cascade,
  user_id uuid references auth.users not null,
  name text not null,
  file_path text, -- Supabase Storage path or external URL
  source_type text check (source_type in ('file', 'kaggle', 'huggingface', 'google_storage')),
  source_url text,
  row_count integer,
  file_size_mb float,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table datasets enable row level security;
create policy "Users can view own datasets" on datasets for select using (auth.uid() = user_id);
create policy "Users can insert own datasets" on datasets for insert with check (auth.uid() = user_id);
create policy "Users can delete own datasets" on datasets for delete using (auth.uid() = user_id);

-- 4. Chat History (LangChain)
create table public.chats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  dataset_id uuid references datasets on delete set null,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table chats enable row level security;
create policy "Users can view own chats" on chats for select using (auth.uid() = user_id);
create policy "Users can insert own chats" on chats for insert with check (auth.uid() = user_id);

create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references chats on delete cascade not null,
  role text check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table messages enable row level security;
create policy "Users can view own messages" on messages for select using (
  exists (select 1 from chats where chats.id = messages.chat_id and chats.user_id = auth.uid())
);
create policy "Users can insert own messages" on messages for insert with check (
  exists (select 1 from chats where chats.id = messages.chat_id and chats.user_id = auth.uid())
);

-- 5. Storage Buckets
insert into storage.buckets (id, name, public) values ('datasets', 'datasets', false)
on conflict (id) do nothing;

create policy "Dataset Access" on storage.objects for select using (auth.uid() = owner);
create policy "Dataset Upload" on storage.objects for insert with check (auth.uid() = owner);
create policy "Dataset Delete" on storage.objects for delete using (auth.uid() = owner);
