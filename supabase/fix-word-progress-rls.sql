-- Run in Supabase Dashboard > SQL Editor if saving a completed word fails with
-- "new row violates row-level security policy for table word_progress".
-- This project-owned table should only allow each signed-in user to access
-- rows whose user_id matches their Supabase Auth user ID.

alter table public.word_progress enable row level security;

do $$
declare
    policy_row record;
begin
    for policy_row in
        select policyname
        from pg_policies
        where schemaname = 'public' and tablename = 'word_progress'
    loop
        execute format('drop policy if exists %I on public.word_progress', policy_row.policyname);
    end loop;
end
$$;

create policy "Users read own word progress" on public.word_progress
    for select to authenticated using (auth.uid() = user_id);
create policy "Users add own word progress" on public.word_progress
    for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own word progress" on public.word_progress
    for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update on public.word_progress to authenticated;
