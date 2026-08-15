-- ============ roles & profiles ============
create type public.app_role as enum ('admin','moderator','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "user_roles_select_own" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "user_roles_admin_all" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ sources ============
create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_type text not null,
  source_reference text,
  source_version text,
  retrieved_at timestamptz,
  license_information text,
  is_seed_data boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.data_sources to anon, authenticated;
grant insert, update, delete on public.data_sources to authenticated;
grant all on public.data_sources to service_role;
alter table public.data_sources enable row level security;
create policy "data_sources_public_read" on public.data_sources for select to anon, authenticated using (true);
create policy "data_sources_admin_write" on public.data_sources for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger data_sources_updated before update on public.data_sources for each row execute function public.update_updated_at_column();

-- ============ ingredients ============
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  common_name text,
  scientific_name text,
  ins_number text,
  e_number text,
  category text not null default 'Unknown',
  functional_class text,
  description text,
  consumer_explanation text,
  why_used text,
  allergen_flag boolean not null default false,
  allergen_group text,
  vegetarian_status text not null default 'unknown',
  vegan_status text not null default 'unknown',
  processing_indicator text not null default 'unknown',
  nova_relevance int not null default 1,
  fssai_status text not null default 'unknown',
  risk_level text not null default 'unknown',
  sugar_alias boolean not null default false,
  confidence numeric not null default 0.8,
  source_id uuid references public.data_sources(id) on delete set null,
  source_reference text,
  is_seed_data boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.ingredients to anon, authenticated;
grant insert, update, delete on public.ingredients to authenticated;
grant all on public.ingredients to service_role;
alter table public.ingredients enable row level security;
create policy "ingredients_public_read" on public.ingredients for select to anon, authenticated using (true);
create policy "ingredients_admin_write" on public.ingredients for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger ingredients_updated before update on public.ingredients for each row execute function public.update_updated_at_column();
create index ingredients_ins_idx on public.ingredients (ins_number);
create index ingredients_canonical_lower_idx on public.ingredients (lower(canonical_name));
create index ingredients_category_idx on public.ingredients (category);

create table public.ingredient_aliases (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  alias text not null,
  alias_type text not null default 'common',
  created_at timestamptz not null default now(),
  unique (ingredient_id, alias)
);
grant select on public.ingredient_aliases to anon, authenticated;
grant insert, update, delete on public.ingredient_aliases to authenticated;
grant all on public.ingredient_aliases to service_role;
alter table public.ingredient_aliases enable row level security;
create policy "aliases_public_read" on public.ingredient_aliases for select to anon, authenticated using (true);
create policy "aliases_admin_write" on public.ingredient_aliases for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create index aliases_lower_idx on public.ingredient_aliases (lower(alias));

-- ============ regulatory ============
create table public.fssai_regulations (
  id uuid primary key default gen_random_uuid(),
  regulation_name text not null,
  regulation_number text,
  section text,
  subsection text,
  ingredient_or_substance text,
  category text,
  status text not null default 'unknown',
  permitted_condition text,
  maximum_limit numeric,
  unit text,
  applicable_food_category text,
  effective_date date,
  last_verified_at timestamptz,
  source_reference text,
  source_version text,
  source_id uuid references public.data_sources(id) on delete set null,
  is_seed_data boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.fssai_regulations to anon, authenticated;
grant insert, update, delete on public.fssai_regulations to authenticated;
grant all on public.fssai_regulations to service_role;
alter table public.fssai_regulations enable row level security;
create policy "regs_public_read" on public.fssai_regulations for select to anon, authenticated using (true);
create policy "regs_admin_write" on public.fssai_regulations for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger regs_updated before update on public.fssai_regulations for each row execute function public.update_updated_at_column();
create index regs_substance_idx on public.fssai_regulations (lower(ingredient_or_substance));

create table public.fssai_ingredient_rules (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  food_category text not null default 'general',
  permission_status text not null default 'unknown',
  condition text,
  maximum_level numeric,
  unit text,
  regulation_reference text,
  regulation_id uuid references public.fssai_regulations(id) on delete set null,
  effective_date date,
  source_version text,
  last_verified_at timestamptz,
  is_seed_data boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.fssai_ingredient_rules to anon, authenticated;
grant insert, update, delete on public.fssai_ingredient_rules to authenticated;
grant all on public.fssai_ingredient_rules to service_role;
alter table public.fssai_ingredient_rules enable row level security;
create policy "rules_public_read" on public.fssai_ingredient_rules for select to anon, authenticated using (true);
create policy "rules_admin_write" on public.fssai_ingredient_rules for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger rules_updated before update on public.fssai_ingredient_rules for each row execute function public.update_updated_at_column();
create index rules_ingredient_idx on public.fssai_ingredient_rules (ingredient_id);

-- ============ scans & analyses ============
create table public.product_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text,
  brand text,
  barcode text,
  input_method text not null default 'manual',
  image_url text,
  extracted_text text,
  corrected_text text,
  ocr_confidence numeric,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.product_scans to authenticated;
grant all on public.product_scans to service_role;
alter table public.product_scans enable row level security;
create policy "scans_own_all" on public.product_scans for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index scans_user_idx on public.product_scans (user_id, created_at desc);

create table public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.product_scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_score int,
  nova_class int,
  verdict text,
  confidence numeric,
  ingredient_count int,
  additive_count int,
  report jsonb not null default '{}'::jsonb,
  flags jsonb not null default '[]'::jsonb,
  nutrition jsonb,
  ai_explanation text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.analysis_results to authenticated;
grant all on public.analysis_results to service_role;
alter table public.analysis_results enable row level security;
create policy "analyses_own_all" on public.analysis_results for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index analyses_user_idx on public.analysis_results (user_id, created_at desc);

create table public.unknown_ingredients (
  id uuid primary key default gen_random_uuid(),
  raw_name text not null unique,
  occurrences int not null default 1,
  status text not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
grant select, insert, update, delete on public.unknown_ingredients to authenticated;
grant all on public.unknown_ingredients to service_role;
alter table public.unknown_ingredients enable row level security;
create policy "unknown_admin_all" on public.unknown_ingredients for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ seed data ============
insert into public.data_sources (source_name, source_type, source_reference, source_version, retrieved_at, license_information, is_seed_data, notes) values
('FSSAI Food Safety and Standards (Food Products Standards and Food Additives) Regulations','regulatory','fssai.gov.in — Food Products Standards and Food Additives Regulations','2011 (as amended)', now(), 'Government publication', true, 'DEMO/SEED reference record. Verify against the latest official gazette text before relying on it.'),
('LabelLens Curated Ingredient Dictionary','internal','LabelLens knowledge base','v0.1-seed', now(), 'Internal', true, 'Seed ingredient dictionary for demonstration.'),
('Open Food Facts','open-dataset','openfoodfacts.org','rolling', now(), 'Open Database License (ODbL)', true, 'Optional product enrichment source.'),
('NOVA Food Classification System','classification','Monteiro et al., NOVA classification','2019', now(), 'Academic publication', true, 'Processing-level classification rules.');

with src as (select id from public.data_sources where source_name = 'LabelLens Curated Ingredient Dictionary' limit 1)
insert into public.ingredients (canonical_name, common_name, scientific_name, ins_number, e_number, category, functional_class, description, consumer_explanation, why_used, allergen_flag, allergen_group, vegetarian_status, vegan_status, processing_indicator, nova_relevance, fssai_status, risk_level, sugar_alias, confidence)
select v.* from (values
('Sugar','Sugar','Sucrose',null,null,'Sweetener','Sweetening agent','Refined crystalline sucrose obtained from sugarcane or sugar beet.','Ordinary table sugar. It adds sweetness and calories.','Adds sweetness and helps texture and shelf life.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','low',true,0.98),
('Sucrose','Cane sugar','Sucrose',null,null,'Sweetener','Sweetening agent','The chemical name for common table sugar.','This is the scientific name for regular sugar.','Adds sweetness.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','low',true,0.97),
('Glucose Syrup','Glucose syrup',null,null,null,'Sweetener','Sweetening agent, bulking agent','A syrup of glucose produced by the hydrolysis of starch.','A liquid sugar made from starch. It is a form of added sugar.','Adds sweetness, softness and prevents crystallisation.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted','low',true,0.95),
('Invert Sugar Syrup','Invert syrup',null,null,null,'Sweetener','Sweetening agent','A mixture of glucose and fructose made by splitting sucrose.','Another form of added sugar, in liquid form.','Keeps products moist and sweet.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted','low',true,0.93),
('Fructose','Fruit sugar','Fructose',null,null,'Sweetener','Sweetening agent','A simple sugar found naturally in fruit and used as an added sweetener.','A sugar naturally present in fruit, also added to foods.','Adds sweetness.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','low',true,0.94),
('Dextrose','Dextrose','D-glucose',null,null,'Sweetener','Sweetening agent','Glucose in crystalline form, usually made from corn starch.','A sugar made from starch. It counts as added sugar.','Adds mild sweetness and bulk.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted','low',true,0.93),
('Maltodextrin','Maltodextrin',null,null,null,'Bulking agent','Bulking agent, carrier','A starch-derived carbohydrate used as a carrier or bulking agent.','A processed starch powder. It is a marker of industrial processing rather than a sweetener as such.','Adds bulk, carries flavours and improves texture.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted','low',false,0.9),
('Lecithin','Soya lecithin',null,'322','E322','Emulsifier','Emulsifier, antioxidant','A mixture of phospholipids commonly obtained from soybean or sunflower.','Helps ingredients such as oil and water mix together and stay mixed.','Keeps fat and water from separating, giving a smooth texture.',true,'Soy (when soy derived)','vegetarian','unknown','industrial-ingredient',4,'permitted','low',false,0.95),
('Monosodium Glutamate','MSG',null,'621','E621','Flavour enhancer','Flavour enhancer','The sodium salt of glutamic acid, used to enhance savoury taste.','Strengthens savoury (umami) taste. It is widely permitted in specified foods.','Makes savoury flavours taste stronger.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.95),
('Citric Acid','Citric acid','2-hydroxypropane-1,2,3-tricarboxylic acid','330','E330','Acidity regulator','Acidity regulator, antioxidant','A weak organic acid found naturally in citrus fruits and produced by fermentation.','Adds a slightly sour taste and helps keep food fresh.','Controls acidity, adds tartness and protects flavour.',false,null,'vegetarian','vegan','processed-food-ingredient',3,'permitted','low',false,0.96),
('Sodium Benzoate','Sodium benzoate',null,'211','E211','Preservative','Preservative','The sodium salt of benzoic acid, used to inhibit microbial growth.','Helps stop moulds and yeasts from spoiling the food.','Extends shelf life.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.94),
('Potassium Sorbate','Potassium sorbate',null,'202','E202','Preservative','Preservative','The potassium salt of sorbic acid, used as a preservative.','Helps prevent mould and yeast growth.','Extends shelf life.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.94),
('Tartrazine','Tartrazine',null,'102','E102','Artificial colour','Colouring agent','A synthetic lemon-yellow azo dye.','A synthetic yellow colour. It is permitted only in certain foods and within limits.','Gives a bright yellow colour.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.92),
('Sunset Yellow FCF','Sunset yellow',null,'110','E110','Artificial colour','Colouring agent','A synthetic orange-yellow azo dye.','A synthetic orange-yellow colour used in limited amounts.','Gives an orange-yellow colour.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.9),
('Caramel Colour','Caramel',null,'150d','E150d','Natural colour','Colouring agent','Colour produced by controlled heat treatment of carbohydrates.','A brown colour made by heating sugars.','Gives a brown colour.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted','low',false,0.9),
('Aspartame','Aspartame',null,'951','E951','Artificial sweetener','Sweetening agent','A low-calorie sweetener made of aspartic acid and phenylalanine.','A sweetener that gives sweetness with very few calories. Products carry a warning for people with phenylketonuria.','Sweetens without sugar calories.',false,'Phenylalanine (PKU advisory)','vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.93),
('Sucralose','Sucralose',null,'955','E955','Artificial sweetener','Sweetening agent','A high-intensity sweetener derived from sucrose.','A no-calorie sweetener that is much sweeter than sugar.','Sweetens without sugar calories.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.92),
('Xanthan Gum','Xanthan gum',null,'415','E415','Stabilizer','Thickener, stabilizer','A polysaccharide produced by bacterial fermentation.','Thickens the product and keeps it from separating.','Improves texture and stability.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted','low',false,0.93),
('Guar Gum','Guar gum',null,'412','E412','Thickener','Thickener, stabilizer','A polysaccharide from guar beans.','Makes the product thicker and creamier.','Improves thickness and mouthfeel.',false,null,'vegetarian','vegan','processed-food-ingredient',3,'permitted','low',false,0.93),
('Ascorbic Acid','Vitamin C','L-ascorbic acid','300','E300','Antioxidant','Antioxidant, fortifying agent','Vitamin C, used as an antioxidant and nutrient.','Protects the food from going off and is also vitamin C.','Prevents colour and flavour loss.',false,null,'vegetarian','vegan','processed-food-ingredient',3,'permitted','low',false,0.95),
('Palm Oil','Palm oil',null,null,null,'Fat/Oil','Fat source','Edible vegetable oil from the fruit of the oil palm.','A vegetable fat used for texture and shelf life. It is high in saturated fat.','Provides fat, texture and stability.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','medium',false,0.93),
('Milk Solids','Milk solids',null,null,null,'Dairy','Dairy ingredient','The non-water components of milk.','Comes from milk, so it matters for people avoiding dairy.','Adds creaminess, protein and flavour.',true,'Milk','vegetarian','not-vegan','processed-food-ingredient',3,'permitted','low',false,0.94),
('Wheat Flour','Wheat flour',null,null,null,'Cereal','Base ingredient','Flour milled from wheat grain.','Made from wheat, so it contains gluten.','Forms the base structure of the product.',true,'Gluten (wheat)','vegetarian','vegan','processed-culinary-ingredient',2,'permitted','low',false,0.96),
('Soy Protein Isolate','Soy protein isolate',null,null,null,'Protein','Protein source','A highly refined protein extracted from soybeans.','A concentrated protein from soy. It is a sign of industrial processing.','Boosts protein content and texture.',true,'Soy','vegetarian','vegan','industrial-ingredient',4,'permitted','low',false,0.9),
('Cocoa Powder','Cocoa powder',null,null,null,'Cocoa','Flavour, base ingredient','Powder made from roasted, pressed cocoa beans.','Ground cocoa that gives chocolate flavour.','Provides chocolate flavour and colour.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','low',false,0.95),
('Iodised Salt','Salt',null,null,null,'Salt','Seasoning, preservative','Sodium chloride fortified with iodine.','Ordinary salt with added iodine. Contributes sodium.','Adds taste and helps preserve food.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','low',false,0.96),
('Sodium Nitrite','Sodium nitrite',null,'250','E250','Preservative','Preservative, colour fixative','A curing salt used in meat products.','Used in cured meats to prevent bacterial growth and keep the pink colour. It is permitted only within strict limits.','Prevents dangerous bacteria in cured meats.',false,null,'non-vegetarian-use','not-vegan','industrial-ingredient',4,'permitted-under-conditions','high',false,0.9),
('Artificial Flavouring Substances','Artificial flavour',null,null,null,'Flavouring agent','Flavouring','Synthetic substances added to impart flavour.','Lab-made flavours. The label rarely says exactly which ones.','Creates or strengthens a specific taste.',false,null,'unknown','unknown','industrial-ingredient',4,'permitted-under-conditions','low',false,0.75),
('Nature Identical Flavouring Substances','Nature identical flavour',null,null,null,'Flavouring agent','Flavouring','Flavour substances chemically identical to natural ones.','Flavours made in a lab that match flavours found in nature.','Creates a specific taste.',false,null,'unknown','unknown','industrial-ingredient',4,'permitted-under-conditions','low',false,0.75),
('Anticaking Agent (Silicon Dioxide)','Silicon dioxide',null,'551','E551','Anti-caking agent','Anti-caking agent','Amorphous silica used to keep powders free-flowing.','Stops powders from clumping together.','Keeps powder loose and pourable.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted','low',false,0.9),
('Sodium Bicarbonate','Baking soda',null,'500(ii)','E500','Raising agent','Raising agent','Sodium hydrogen carbonate used to leaven baked goods.','Helps baked food rise.','Makes the product light and airy.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','low',false,0.94),
('Glycerol','Glycerine',null,'422','E422','Humectant','Humectant','A polyol used to retain moisture.','Keeps the product soft and moist.','Prevents drying out.',false,null,'unknown','unknown','industrial-ingredient',4,'permitted','low',false,0.9)
) as v(canonical_name, common_name, scientific_name, ins_number, e_number, category, functional_class, description, consumer_explanation, why_used, allergen_flag, allergen_group, vegetarian_status, vegan_status, processing_indicator, nova_relevance, fssai_status, risk_level, sugar_alias, confidence);

update public.ingredients set source_id = (select id from public.data_sources where source_name='LabelLens Curated Ingredient Dictionary' limit 1),
  source_reference = 'LabelLens curated seed entry — demo data' where source_id is null;

insert into public.ingredient_aliases (ingredient_id, alias, alias_type)
select i.id, a.alias, a.alias_type from public.ingredients i
join (values
('Sugar','sugar','common'),('Sugar','cane sugar','common'),('Sugar','refined sugar','common'),('Sugar','sucrose','scientific'),
('Sucrose','sucrose','scientific'),
('Glucose Syrup','glucose syrup','common'),('Glucose Syrup','corn syrup','common'),('Glucose Syrup','liquid glucose','common'),('Glucose Syrup','glucose-fructose syrup','common'),
('Invert Sugar Syrup','invert syrup','common'),('Invert Sugar Syrup','invert sugar','common'),
('Fructose','fructose','common'),('Fructose','fruit sugar','common'),
('Dextrose','dextrose','common'),('Dextrose','dextrose monohydrate','common'),
('Maltodextrin','maltodextrin','common'),
('Lecithin','lecithin','common'),('Lecithin','soya lecithin','common'),('Lecithin','soy lecithin','common'),('Lecithin','ins 322','ins'),('Lecithin','e322','e-number'),('Lecithin','322','ins'),
('Monosodium Glutamate','msg','common'),('Monosodium Glutamate','monosodium glutamate','common'),('Monosodium Glutamate','ins 621','ins'),('Monosodium Glutamate','e621','e-number'),('Monosodium Glutamate','621','ins'),('Monosodium Glutamate','flavour enhancer 621','common'),
('Citric Acid','citric acid','common'),('Citric Acid','ins 330','ins'),('Citric Acid','e330','e-number'),('Citric Acid','330','ins'),
('Sodium Benzoate','sodium benzoate','common'),('Sodium Benzoate','ins 211','ins'),('Sodium Benzoate','e211','e-number'),('Sodium Benzoate','211','ins'),
('Potassium Sorbate','potassium sorbate','common'),('Potassium Sorbate','ins 202','ins'),('Potassium Sorbate','e202','e-number'),('Potassium Sorbate','202','ins'),
('Tartrazine','tartrazine','common'),('Tartrazine','ins 102','ins'),('Tartrazine','e102','e-number'),('Tartrazine','102','ins'),
('Sunset Yellow FCF','sunset yellow fcf','common'),('Sunset Yellow FCF','sunset yellow','common'),('Sunset Yellow FCF','ins 110','ins'),('Sunset Yellow FCF','110','ins'),
('Caramel Colour','caramel colour','common'),('Caramel Colour','caramel color','common'),('Caramel Colour','ins 150d','ins'),('Caramel Colour','150d','ins'),
('Aspartame','aspartame','common'),('Aspartame','ins 951','ins'),('Aspartame','951','ins'),
('Sucralose','sucralose','common'),('Sucralose','ins 955','ins'),('Sucralose','955','ins'),
('Xanthan Gum','xanthan gum','common'),('Xanthan Gum','ins 415','ins'),('Xanthan Gum','415','ins'),
('Guar Gum','guar gum','common'),('Guar Gum','ins 412','ins'),('Guar Gum','412','ins'),
('Ascorbic Acid','ascorbic acid','common'),('Ascorbic Acid','vitamin c','common'),('Ascorbic Acid','ins 300','ins'),('Ascorbic Acid','300','ins'),
('Palm Oil','palm oil','common'),('Palm Oil','palmolein','common'),('Palm Oil','edible vegetable oil (palm)','common'),
('Milk Solids','milk solids','common'),('Milk Solids','skimmed milk powder','common'),('Milk Solids','milk powder','common'),
('Wheat Flour','wheat flour','common'),('Wheat Flour','refined wheat flour','common'),('Wheat Flour','maida','common'),('Wheat Flour','atta','common'),
('Soy Protein Isolate','soy protein isolate','common'),('Soy Protein Isolate','soya protein isolate','common'),
('Cocoa Powder','cocoa powder','common'),('Cocoa Powder','cocoa solids','common'),
('Iodised Salt','iodised salt','common'),('Iodised Salt','salt','common'),('Iodised Salt','iodized salt','common'),
('Sodium Nitrite','sodium nitrite','common'),('Sodium Nitrite','ins 250','ins'),('Sodium Nitrite','250','ins'),
('Artificial Flavouring Substances','artificial flavouring substances','common'),('Artificial Flavouring Substances','artificial flavour','common'),('Artificial Flavouring Substances','artificial flavor','common'),
('Nature Identical Flavouring Substances','nature identical flavouring substances','common'),('Nature Identical Flavouring Substances','nature identical flavour','common'),
('Anticaking Agent (Silicon Dioxide)','silicon dioxide','common'),('Anticaking Agent (Silicon Dioxide)','ins 551','ins'),('Anticaking Agent (Silicon Dioxide)','551','ins'),
('Sodium Bicarbonate','sodium bicarbonate','common'),('Sodium Bicarbonate','baking soda','common'),('Sodium Bicarbonate','ins 500(ii)','ins'),('Sodium Bicarbonate','500(ii)','ins'),
('Glycerol','glycerol','common'),('Glycerol','glycerine','common'),('Glycerol','ins 422','ins'),('Glycerol','422','ins')
) as a(cname, alias, alias_type) on a.cname = i.canonical_name
on conflict do nothing;

insert into public.fssai_regulations (regulation_name, regulation_number, section, ingredient_or_substance, category, status, permitted_condition, applicable_food_category, effective_date, last_verified_at, source_reference, source_version, source_id, is_seed_data, notes)
select r.regulation_name, r.regulation_number, r.section, r.ingredient_or_substance, r.category, r.status, r.permitted_condition, r.applicable_food_category, r.effective_date::date, x.lv, x.sr, x.sv, x.sid, x.seed, x.nt from (values
('Food Safety and Standards (Food Products Standards and Food Additives) Regulations','2011','Appendix A — Food Additives','Monosodium Glutamate','Flavour enhancer','permitted-under-conditions','Permitted in specified food categories at levels consistent with good manufacturing practice; not permitted in foods for infants and young children.','Specified processed foods','2011-08-01'),
('Food Safety and Standards (Food Products Standards and Food Additives) Regulations','2011','Appendix A — Colouring Matter','Tartrazine','Artificial colour','permitted-under-conditions','Permitted synthetic food colour in specified categories, subject to prescribed maximum limits.','Specified food categories','2011-08-01'),
('Food Safety and Standards (Food Products Standards and Food Additives) Regulations','2011','Appendix A — Preservatives','Sodium Benzoate','Preservative','permitted-under-conditions','Class II preservative permitted in specified foods within prescribed limits.','Specified food categories','2011-08-01'),
('Food Safety and Standards (Food Products Standards and Food Additives) Regulations','2011','Appendix A — Preservatives','Sodium Nitrite','Preservative','permitted-under-conditions','Permitted in specified cured meat products within strict prescribed limits.','Cured meat products','2011-08-01'),
('Food Safety and Standards (Labelling and Display) Regulations','2020','Ingredient declaration','Ingredient list and additive declaration','Labelling','permitted','Ingredients must be declared in descending order of composition; additives must be declared by class name with INS number.','All packaged foods','2020-12-01'),
('Food Safety and Standards (Labelling and Display) Regulations','2020','Allergen declaration','Allergen declaration','Labelling','permitted','Declared allergens must be clearly indicated on the label.','All packaged foods','2020-12-01'),
('Food Safety and Standards (Food Products Standards and Food Additives) Regulations','2011','Appendix A — Sweeteners','Aspartame','Artificial sweetener','permitted-under-conditions','Permitted in specified foods within prescribed limits; label must carry the phenylalanine advisory.','Specified food categories','2011-08-01')
) as r(regulation_name, regulation_number, section, ingredient_or_substance, category, status, permitted_condition, applicable_food_category, effective_date),
lateral (select now() as lv, 'FSSAI regulatory reference (seed record — verify against latest gazette)' as sr, '2011/2020 consolidated (seed)' as sv,
  (select id from public.data_sources where source_type='regulatory' limit 1) as sid, true as seed,
  'DEMO/SEED regulatory summary. Not an official certification. Verify the latest amendment before use.' as nt) x;

insert into public.fssai_ingredient_rules (ingredient_id, food_category, permission_status, condition, regulation_reference, regulation_id, effective_date, source_version, last_verified_at, is_seed_data)
select i.id, 'general', i.fssai_status,
  case i.fssai_status when 'permitted-under-conditions' then 'Permitted only in specified food categories and within prescribed maximum limits.'
       when 'permitted' then 'Generally permitted subject to good manufacturing practice.' else 'Insufficient information in the LabelLens seed knowledge base.' end,
  'FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A (seed reference)',
  (select id from public.fssai_regulations where ingredient_or_substance = i.canonical_name limit 1),
  '2011-08-01', '2011/2020 consolidated (seed)', now(), true
from public.ingredients i;