-- À exécuter dans Supabase > SQL Editor.
-- 1) Créez d'abord un utilisateur dans Authentication > Users.
-- 2) Remplacez l'UUID et le username dans le bloc final pour lui attribuer le rôle admin.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9._-]{3,32}$'),
  display_name text not null default '',
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

create table if not exists public.animals (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  species text not null,
  breed text not null default '',
  age_label text not null default '',
  age_category text not null default 'adulte' check (age_category in ('jeune','adulte','senior')),
  character text not null default '',
  social_compatibility text not null default '',
  description text not null default '',
  sex text not null default '',
  weight text not null default '',
  health_notes text not null default '',
  status text not null default 'available' check (status in ('available','archived')),
  photos jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists animals_status_created_idx on public.animals(status, created_at desc);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  file_name text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists animals_set_updated_at on public.animals;
create trigger animals_set_updated_at before update on public.animals
for each row execute function public.set_updated_at();

create or replace function public.is_refuge_member()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid()); $$;

create or replace function public.is_refuge_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

alter table public.profiles enable row level security;
alter table public.animals enable row level security;
alter table public.documents enable row level security;

drop policy if exists "profile self read" on public.profiles;
create policy "profile self read" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "admin read profiles" on public.profiles;
create policy "admin read profiles" on public.profiles for select to authenticated using (public.is_refuge_admin());

-- Le public peut lire uniquement les annonces disponibles. Les écritures sont réservées aux membres.
drop policy if exists "public read available animals" on public.animals;
create policy "public read available animals" on public.animals for select to anon, authenticated using (status = 'available' or public.is_refuge_member());
drop policy if exists "members insert animals" on public.animals;
create policy "members insert animals" on public.animals for insert to authenticated with check (public.is_refuge_member());
drop policy if exists "members update animals" on public.animals;
create policy "members update animals" on public.animals for update to authenticated using (public.is_refuge_member()) with check (public.is_refuge_member());
drop policy if exists "members delete animals" on public.animals;
create policy "members delete animals" on public.animals for delete to authenticated using (public.is_refuge_member());

-- Les documents administratifs ne sont jamais publics.
drop policy if exists "members read documents" on public.documents;
create policy "members read documents" on public.documents for select to authenticated using (public.is_refuge_member());
drop policy if exists "members insert documents" on public.documents;
create policy "members insert documents" on public.documents for insert to authenticated with check (public.is_refuge_member());
drop policy if exists "members delete documents" on public.documents;
create policy "members delete documents" on public.documents for delete to authenticated using (public.is_refuge_member());

-- Buckets Storage : photos publiques, PDF privés.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('animal-photos', 'animal-photos', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 8388608, allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('association-documents', 'association-documents', false, 15728640, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 15728640, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public view animal photos" on storage.objects;
create policy "public view animal photos" on storage.objects for select to anon, authenticated using (bucket_id = 'animal-photos');
drop policy if exists "members upload animal photos" on storage.objects;
create policy "members upload animal photos" on storage.objects for insert to authenticated with check (bucket_id = 'animal-photos' and public.is_refuge_member());
drop policy if exists "members update animal photos" on storage.objects;
create policy "members update animal photos" on storage.objects for update to authenticated using (bucket_id = 'animal-photos' and public.is_refuge_member()) with check (bucket_id = 'animal-photos' and public.is_refuge_member());
drop policy if exists "members delete animal photos" on storage.objects;
create policy "members delete animal photos" on storage.objects for delete to authenticated using (bucket_id = 'animal-photos' and public.is_refuge_member());
drop policy if exists "members manage association documents" on storage.objects;
create policy "members manage association documents" on storage.objects for all to authenticated using (bucket_id = 'association-documents' and public.is_refuge_member()) with check (bucket_id = 'association-documents' and public.is_refuge_member());

-- IMPORTANT : après avoir créé le premier utilisateur dans Supabase Auth,
-- exécutez cette requête en remplaçant les deux valeurs :
-- insert into public.profiles (id, username, display_name, role)
-- values ('UUID_DE_L_UTILISATEUR_AUTH', 'votre_username', 'Administrateur', 'admin');
