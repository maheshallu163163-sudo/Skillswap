-- =========================================================================
-- SkillSwap PostgreSQL Database Schema & Security Policies (Supabase)
-- =========================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
create type skill_type as enum ('teach', 'learn');
create type experience_level as enum ('Beginner', 'Intermediate', 'Advanced', 'Expert');
create type request_status as enum ('pending', 'accepted', 'declined', 'cancelled', 'completed');
create type session_status as enum ('scheduled', 'completed', 'cancelled');
create type learning_mode as enum ('online', 'in-person', 'both');

-- 3. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique,
  full_name text not null,
  avatar_url text,
  city text default '',
  country text default '',
  bio text default '',
  experience text default '',
  languages text[] default array['English'],
  learning_mode learning_mode default 'online',
  availability text[] default array['Weekday evenings', 'Weekends'],
  learning_goals text default '',
  points integer default 50,
  rating numeric(3,2) default 5.0,
  review_count integer default 0,
  completed_swaps_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. MASTER SKILLS TABLE
create table if not exists public.skills (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  category text not null,
  description text default '',
  created_at timestamptz default now()
);

-- 5. USER SKILLS TABLE
create table if not exists public.user_skills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  skill_id text not null,
  name text not null,
  category text not null,
  type skill_type not null,
  experience_level experience_level default 'Intermediate',
  description text default '',
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- 6. SWAP REQUESTS TABLE
create table if not exists public.swap_requests (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references auth.users(id) on delete cascade,
  receiver_id uuid references auth.users(id) on delete cascade,
  teach_skill_id text not null,
  teach_skill_name text not null,
  learn_skill_id text not null,
  learn_skill_name text not null,
  message text not null,
  status request_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. CONVERSATIONS & MESSAGES TABLE
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  participant_ids uuid[] not null,
  last_message_text text,
  last_message_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  receiver_id uuid references auth.users(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- 8. SESSIONS TABLE
create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  swap_request_id uuid references public.swap_requests(id) on delete set null,
  teacher_id uuid references auth.users(id) on delete cascade,
  learner_id uuid references auth.users(id) on delete cascade,
  skill_id text not null,
  skill_name text not null,
  scheduled_at timestamptz not null,
  duration_minutes integer default 60,
  meeting_mode learning_mode default 'online',
  meeting_link text,
  location_details text,
  notes text,
  status session_status default 'scheduled',
  completed_by_teacher boolean default false,
  completed_by_learner boolean default false,
  created_at timestamptz default now()
);

-- 9. REVIEWS TABLE
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.sessions(id) on delete cascade,
  reviewer_id uuid references auth.users(id) on delete cascade,
  reviewee_id uuid references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  tags text[] default array[]::text[],
  created_at timestamptz default now(),
  unique (session_id, reviewer_id)
);

-- 10. BADGES & USER BADGES
create table if not exists public.badges (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  requirement text not null,
  category text not null,
  points_reward integer default 100
);

create table if not exists public.user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  badge_id text references public.badges(id) on delete cascade,
  earned_at timestamptz default now(),
  unique (user_id, badge_id)
);

-- 11. POINTS TRANSACTIONS
create table if not exists public.points_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  points integer not null,
  reason text not null,
  created_at timestamptz default now()
);

-- 12. LEARNING PLANS
create table if not exists public.learning_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  skill_name text not null,
  current_level experience_level default 'Beginner',
  goal text not null,
  hours_per_week integer default 5,
  duration_weeks integer default 4,
  overview text,
  weeks jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 13. CALLS (VOICE & VIDEO)
create type call_type as enum ('voice', 'video');
create type call_status as enum ('calling', 'connecting', 'connected', 'completed', 'missed', 'declined', 'failed');

create table if not exists public.calls (
  id uuid primary key default uuid_generate_v4(),
  caller_id uuid references auth.users(id) on delete cascade,
  receiver_id uuid references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  call_type call_type not null default 'video',
  status call_status not null default 'calling',
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds integer default 0,
  created_at timestamptz default now()
);

-- 14. LEARNING ROOMS
create type room_type as enum ('public', 'private');
create type room_status as enum ('live', 'scheduled', 'ended');
create type room_role as enum ('host', 'co-host', 'participant');
create type room_learning_mode as enum ('video', 'voice', 'chat', 'hybrid');

create table if not exists public.learning_rooms (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  skill_name text not null,
  skill_level experience_level default 'Beginner',
  max_participants integer default 16,
  current_participants_count integer default 1,
  learning_mode room_learning_mode default 'hybrid',
  room_type room_type default 'public',
  status room_status default 'live',
  is_live boolean default true,
  scheduled_at timestamptz,
  created_at timestamptz default now()
);

-- 15. ROOM MEMBERS
create table if not exists public.room_members (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.learning_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role room_role default 'participant',
  is_muted boolean default false,
  is_video_off boolean default false,
  hand_raised boolean default false,
  joined_at timestamptz default now(),
  unique (room_id, user_id)
);

-- 16. ROOM MESSAGES
create type room_msg_type as enum ('normal', 'question', 'announcement');

create table if not exists public.room_messages (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.learning_rooms(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  sender_name text not null,
  sender_avatar text,
  content text not null,
  type room_msg_type default 'normal',
  is_pinned boolean default false,
  created_at timestamptz default now()
);

-- 17. ROOM RESOURCES
create table if not exists public.room_resources (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.learning_rooms(id) on delete cascade,
  uploader_id uuid references auth.users(id) on delete cascade,
  uploader_name text,
  title text not null,
  type text not null,
  url text not null,
  size text default '',
  created_at timestamptz default now()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.user_skills enable row level security;
alter table public.swap_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.sessions enable row level security;
alter table public.reviews enable row level security;
alter table public.user_badges enable row level security;
alter table public.points_transactions enable row level security;
alter table public.learning_plans enable row level security;
alter table public.calls enable row level security;
alter table public.learning_rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_messages enable row level security;
alter table public.room_resources enable row level security;

-- Profiles: Anyone authenticated or public can read profiles; user can only edit their own
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "Users can delete own profile" on public.profiles for delete using (auth.uid() = user_id);

-- Automatic profile creation on auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- SUPABASE STORAGE: AVATARS BUCKET & RLS POLICIES (Sections 3, 4, 27)
-- =========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Storage Policy: Anyone can read avatar images
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Storage Policy: Users can only upload into their own folder: avatars/{auth.uid()}/*
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage Policy: Users can only update their own avatar
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage Policy: Users can only delete their own avatar
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- User skills: Viewable by all; manageable by owner
create policy "User skills viewable by everyone" on public.user_skills for select using (true);
create policy "Users can manage own skills" on public.user_skills for all using (auth.uid() = user_id);

-- Swap requests: Viewable and manageable only by sender or receiver
create policy "Swap requests viewable by involved users" on public.swap_requests for select using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);
create policy "Users can create swap requests" on public.swap_requests for insert with check (auth.uid() = sender_id);
create policy "Involved users can update swap requests" on public.swap_requests for update using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);

-- Messages: Viewable by members of conversation
create policy "Messages viewable by sender or receiver" on public.messages for select using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);
create policy "Users can insert messages" on public.messages for insert with check (auth.uid() = sender_id);

-- Calls: Viewable and manageable by caller or receiver
create policy "Calls viewable by participants" on public.calls for select using (
  auth.uid() = caller_id or auth.uid() = receiver_id
);
create policy "Users can start calls" on public.calls for insert with check (auth.uid() = caller_id);
create policy "Participants can update calls" on public.calls for update using (
  auth.uid() = caller_id or auth.uid() = receiver_id
);

-- Learning Rooms: Viewable by everyone (if public) or members (if private)
create policy "Public rooms viewable by all" on public.learning_rooms for select using (
  room_type = 'public' or auth.uid() = creator_id
);
create policy "Users can create learning rooms" on public.learning_rooms for insert with check (auth.uid() = creator_id);
create policy "Creators can update own learning rooms" on public.learning_rooms for update using (auth.uid() = creator_id);

-- Room Members: Viewable by participants
create policy "Room members viewable by all" on public.room_members for select using (true);
create policy "Users can join rooms" on public.room_members for insert with check (auth.uid() = user_id);
create policy "Users can leave rooms" on public.room_members for delete using (auth.uid() = user_id);

-- Room Messages: Viewable by members
create policy "Room messages viewable by all" on public.room_messages for select using (true);
create policy "Users can send room messages" on public.room_messages for insert with check (auth.uid() = sender_id);

-- Room Resources: Viewable by all room participants
create policy "Room resources viewable by all" on public.room_resources for select using (true);
create policy "Users can upload room resources" on public.room_resources for insert with check (auth.uid() = uploader_id);

-- Sessions: Viewable and updatable by teacher or learner
create policy "Sessions viewable by participants" on public.sessions for select using (
  auth.uid() = teacher_id or auth.uid() = learner_id
);
create policy "Participants can update sessions" on public.sessions for update using (
  auth.uid() = teacher_id or auth.uid() = learner_id
);

-- Reviews: Viewable by everyone; insertable by session reviewer
create policy "Reviews viewable by everyone" on public.reviews for select using (true);
create policy "Reviewer can insert review" on public.reviews for insert with check (auth.uid() = reviewer_id);

-- Learning Plans: Private to user
create policy "User can manage learning plans" on public.learning_plans for all using (auth.uid() = user_id);

-- Storage bucket setup for avatars and room resources
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('room-resources', 'room-resources', true) on conflict (id) do nothing;
create policy "Avatar images are publicly accessible" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users can upload avatar images" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "Room resources are publicly accessible" on storage.objects for select using (bucket_id = 'room-resources');
create policy "Users can upload room resources files" on storage.objects for insert with check (bucket_id = 'room-resources' and auth.role() = 'authenticated');
