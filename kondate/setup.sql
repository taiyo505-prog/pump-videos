-- くるくるごはん: みんなのごはん（投稿・いいね・コメント・通報）の表と守り
-- Supabase の SQL Editor に全部貼って Run するだけ。何回実行しても大丈夫。

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  avatar text not null default '🍙' check (char_length(avatar) <= 8),
  recipe_id text not null check (char_length(recipe_id) <= 20),
  caption text not null default '' check (char_length(caption) <= 200),
  photo_path text not null check (char_length(photo_path) <= 200),
  likes int not null default 0,
  comments int not null default 0,
  reports int not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists posts_created on public.posts (created_at desc);
create index if not exists posts_recipe on public.posts (recipe_id, created_at desc);

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  text text not null check (char_length(text) between 1 and 200),
  created_at timestamptz not null default now()
);
create index if not exists comments_post on public.comments (post_id, created_at);

create table if not exists public.reports (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- 数のカウント（いいね・コメント・通報）。通報が3人以上で自動で非表示
create or replace function public.kd_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'likes' then
    update posts set likes = (select count(*) from likes where post_id = coalesce(new.post_id, old.post_id)) where id = coalesce(new.post_id, old.post_id);
  elsif tg_table_name = 'comments' then
    update posts set comments = (select count(*) from comments where post_id = coalesce(new.post_id, old.post_id)) where id = coalesce(new.post_id, old.post_id);
  elsif tg_table_name = 'reports' then
    update posts set reports = (select count(*) from reports where post_id = new.post_id),
                     hidden = (select count(*) from reports where post_id = new.post_id) >= 3
      where id = new.post_id;
  end if;
  return null;
end $$;
drop trigger if exists kd_likes_cnt on public.likes;
create trigger kd_likes_cnt after insert or delete on public.likes for each row execute function public.kd_count();
drop trigger if exists kd_comments_cnt on public.comments;
create trigger kd_comments_cnt after insert or delete on public.comments for each row execute function public.kd_count();
drop trigger if exists kd_reports_cnt on public.reports;
create trigger kd_reports_cnt after insert on public.reports for each row execute function public.kd_count();

-- 連投よけ（投稿は1日10回、コメントは1時間30回まで）
create or replace function public.kd_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'posts' and (select count(*) from posts where user_id = new.user_id and created_at > now() - interval '1 day') >= 10 then
    raise exception '今日はもう投稿できないよ（1日10回まで）';
  end if;
  if tg_table_name = 'comments' and (select count(*) from comments where user_id = new.user_id and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'コメントが多すぎるよ。少し待ってね';
  end if;
  return new;
end $$;
drop trigger if exists kd_posts_limit on public.posts;
create trigger kd_posts_limit before insert on public.posts for each row execute function public.kd_limit();
drop trigger if exists kd_comments_limit on public.comments;
create trigger kd_comments_limit before insert on public.comments for each row execute function public.kd_limit();

-- 守り（RLS）: 見るのはみんなOK、書く・消すは自分のものだけ。数や非表示は勝手に変えられない
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select to anon, authenticated using (not hidden or user_id = auth.uid());
drop policy if exists posts_add on public.posts;
create policy posts_add on public.posts for insert to authenticated with check (user_id = auth.uid() and likes = 0 and comments = 0 and reports = 0 and not hidden);
drop policy if exists posts_del on public.posts;
create policy posts_del on public.posts for delete to authenticated using (user_id = auth.uid());

drop policy if exists likes_read on public.likes;
create policy likes_read on public.likes for select to authenticated using (user_id = auth.uid());
drop policy if exists likes_add on public.likes;
create policy likes_add on public.likes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists likes_del on public.likes;
create policy likes_del on public.likes for delete to authenticated using (user_id = auth.uid());

drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select to anon, authenticated using (exists (select 1 from public.posts p where p.id = post_id and not p.hidden));
drop policy if exists comments_add on public.comments;
create policy comments_add on public.comments for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id and not p.hidden));
drop policy if exists comments_del on public.comments;
create policy comments_del on public.comments for delete to authenticated using (user_id = auth.uid());

drop policy if exists reports_add on public.reports;
create policy reports_add on public.reports for insert to authenticated with check (user_id = auth.uid());

revoke all on public.posts, public.likes, public.comments, public.reports from anon, authenticated;
grant select on public.posts, public.comments to anon;
grant select, delete on public.posts to authenticated;
grant insert (name, avatar, recipe_id, caption, photo_path) on public.posts to authenticated;
grant select, insert, delete on public.likes to authenticated;
grant select, delete on public.comments to authenticated;
grant insert (post_id, name, text) on public.comments to authenticated;
grant insert (post_id, reason) on public.reports to authenticated;

-- 写真の置き場所: 見るのは誰でも、置く・消すは自分のフォルダだけ。JPEG・2MBまで
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg'];

drop policy if exists kd_photo_add on storage.objects;
create policy kd_photo_add on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists kd_photo_del on storage.objects;
create policy kd_photo_del on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

select 'OK できたよ' as result;
