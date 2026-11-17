-- ============================================================
-- My Workspace · Supabase 建表脚本
-- 用法：Supabase 控制台 → 左侧 SQL Editor → New query → 粘贴全文 → Run
-- 说明：脚本可重复执行（IF NOT EXISTS / Drop policy），不会破坏已有数据。
-- 隔离：所有表开启 RLS，仅允许登录用户读写自己的行（owner_id = auth.uid()）。
-- ============================================================

-- 0. 通用触发器函数：自动维护 updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- ============================================================
-- 1. 账单数据 / bills  （对应 BillsView.vue，第一梯队）
-- ============================================================
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('expense', 'income')),
  category text not null,
  amount numeric(12, 2) not null default 0,
  day_of_month int not null default 1 check (day_of_month between 1 and 31),
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_bills_updated on public.bills;
create trigger trg_bills_updated before update on public.bills
  for each row execute function public.set_updated_at();

alter table public.bills enable row level security;
drop policy if exists "bills_owner_select" on public.bills;
drop policy if exists "bills_owner_insert" on public.bills;
drop policy if exists "bills_owner_update" on public.bills;
drop policy if exists "bills_owner_delete" on public.bills;
create policy "bills_owner_select" on public.bills for select using (auth.uid() = owner_id);
create policy "bills_owner_insert" on public.bills for insert with check (auth.uid() = owner_id);
create policy "bills_owner_update" on public.bills for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "bills_owner_delete" on public.bills for delete using (auth.uid() = owner_id);


-- ============================================================
-- 2. 宝藏导航 / navigator_sites  （对应 NavigatorView.vue，第一梯队）
--    注意：按你的要求，这里【不含 password / account 字段】，
--          账号密码不落地、不上传，用时在页面上手动输入。
-- ============================================================
create table if not exists public.navigator_sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  section text not null default 'work',        -- 工作专区 / 工具箱 / 个人专区 的 key
  category text not null,                       -- 分类标题，如「优途核心系统」
  name text not null,
  url text not null,
  icon text,
  description text,
  internal boolean not null default false,      -- 是否站内路由
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_sites_updated on public.navigator_sites;
create trigger trg_sites_updated before update on public.navigator_sites
  for each row execute function public.set_updated_at();

alter table public.navigator_sites enable row level security;
drop policy if exists "sites_owner_select" on public.navigator_sites;
drop policy if exists "sites_owner_insert" on public.navigator_sites;
drop policy if exists "sites_owner_update" on public.navigator_sites;
drop policy if exists "sites_owner_delete" on public.navigator_sites;
create policy "sites_owner_select" on public.navigator_sites for select using (auth.uid() = owner_id);
create policy "sites_owner_insert" on public.navigator_sites for insert with check (auth.uid() = owner_id);
create policy "sites_owner_update" on public.navigator_sites for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "sites_owner_delete" on public.navigator_sites for delete using (auth.uid() = owner_id);


-- ============================================================
-- 3. 笔记 / notes  （对应 NotesView.vue，第二梯队）
-- ============================================================
create table if not exists public.notes (
  id text primary key,                          -- 用前端的 Date.now() 字符串作 id，便于本地与云端对齐
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text,
  updated_at_ms bigint not null default 0,      -- 前端 updatedAt（毫秒时间戳）
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;
drop policy if exists "notes_owner_select" on public.notes;
drop policy if exists "notes_owner_insert" on public.notes;
drop policy if exists "notes_owner_update" on public.notes;
drop policy if exists "notes_owner_delete" on public.notes;
create policy "notes_owner_select" on public.notes for select using (auth.uid() = owner_id);
create policy "notes_owner_insert" on public.notes for insert with check (auth.uid() = owner_id);
create policy "notes_owner_update" on public.notes for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "notes_owner_delete" on public.notes for delete using (auth.uid() = owner_id);


-- ============================================================
-- 4. 商品库 / products  （对应 ProductsView.vue，第二梯队）
-- ============================================================
create table if not exists public.products (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  price numeric(12, 2),
  cover_image text,
  tags text[],
  description text,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;
drop policy if exists "products_owner_select" on public.products;
drop policy if exists "products_owner_insert" on public.products;
drop policy if exists "products_owner_update" on public.products;
drop policy if exists "products_owner_delete" on public.products;
create policy "products_owner_select" on public.products for select using (auth.uid() = owner_id);
create policy "products_owner_insert" on public.products for insert with check (auth.uid() = owner_id);
create policy "products_owner_update" on public.products for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "products_owner_delete" on public.products for delete using (auth.uid() = owner_id);


-- ============================================================
-- 5. 分数换算规则 / score_rules  （对应 ScoreConverter，第二梯队）
--    一个人一份规则，用 owner_id 作主键，整包 JSON 存 payload。
-- ============================================================
create table if not exists public.score_rules (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_score_rules_updated on public.score_rules;
create trigger trg_score_rules_updated before update on public.score_rules
  for each row execute function public.set_updated_at();

alter table public.score_rules enable row level security;
drop policy if exists "rules_owner_select" on public.score_rules;
drop policy if exists "rules_owner_insert" on public.score_rules;
drop policy if exists "rules_owner_update" on public.score_rules;
create policy "rules_owner_select" on public.score_rules for select using (auth.uid() = owner_id);
create policy "rules_owner_insert" on public.score_rules for insert with check (auth.uid() = owner_id);
create policy "rules_owner_update" on public.score_rules for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);


-- ============================================================
-- 6. 一分一段表 / rank_tables  （对应 ScoreConverter，第二梯队）
--    同样一人一份，物理/历史两张表 + 列名映射一起打包存 JSONB。
-- ============================================================
create table if not exists public.rank_tables (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_rank_tables_updated on public.rank_tables;
create trigger trg_rank_tables_updated before update on public.rank_tables
  for each row execute function public.set_updated_at();

alter table public.rank_tables enable row level security;
drop policy if exists "rank_owner_select" on public.rank_tables;
drop policy if exists "rank_owner_insert" on public.rank_tables;
drop policy if exists "rank_owner_update" on public.rank_tables;
create policy "rank_owner_select" on public.rank_tables for select using (auth.uid() = owner_id);
create policy "rank_owner_insert" on public.rank_tables for insert with check (auth.uid() = owner_id);
create policy "rank_owner_update" on public.rank_tables for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);


-- ============================================================
-- 7. 用户资料 / profiles  （第三梯队：Supabase Auth 用户体系 + VIP 权限）
--    每个注册用户一行，存 role 与 VIP 信息。
--    新用户注册后触发器自动建行；用户只能读自己的资料，
--    VIP / role 由管理员（service_role）修改，用户改不了，防止自助刷 VIP。
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  role text not null default 'user',
  vip boolean not null default false,
  vip_expires_at timestamptz,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- 注册即建资料行
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
-- 注意：故意不开放 update/insert 给普通用户，VIP 只能由管理员在控制台改。

-- ============================================================
-- 完成。常用运维 SQL：
--   · 给某邮箱开通 VIP（管理员在 SQL Editor 执行）：
--       update public.profiles set vip = true, vip_expires_at = now() + interval '1 year'
--       where email = '你的邮箱@example.com';
--   · 设为管理员：
--       update public.profiles set role = 'admin' where email = '你的邮箱@example.com';
-- ============================================================
