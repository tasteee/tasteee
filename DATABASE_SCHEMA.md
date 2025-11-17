# Database Schema for Blog

## Posts Table
```sql
create table posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content jsonb not null,
  excerpt text,
  featured_image text,
  author_id uuid references auth.users(id) on delete cascade not null,
  slug text unique not null,
  published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  published_at timestamp with time zone
);

-- Enable Row Level Security
alter table posts enable row level security;

-- Policies
create policy "Posts are viewable by everyone" 
  on posts for select 
  using ( published = true );

create policy "Users can insert their own posts" 
  on posts for insert 
  with check ( auth.uid() = author_id );

create policy "Users can update their own posts" 
  on posts for update 
  using ( auth.uid() = author_id );

create policy "Users can delete their own posts" 
  on posts for delete 
  using ( auth.uid() = author_id );

-- Authors can view their own unpublished posts
create policy "Authors can view their own posts" 
  on posts for select 
  using ( auth.uid() = author_id );

-- Create storage bucket for blog media
insert into storage.buckets (id, name, public)
values ('blog-media', 'blog-media', true);

-- Storage policies
create policy "Media is publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'blog-media' );

create policy "Authenticated users can upload media"
  on storage.objects for insert
  with check ( bucket_id = 'blog-media' and auth.role() = 'authenticated' );

create policy "Users can update their own media"
  on storage.objects for update
  using ( bucket_id = 'blog-media' and auth.uid() = owner );

create policy "Users can delete their own media"
  on storage.objects for delete
  using ( bucket_id = 'blog-media' and auth.uid() = owner );
```

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the posts table SQL
4. Navigate to Storage
5. Create bucket or run storage bucket SQL
6. Update your .env file with your Supabase credentials
