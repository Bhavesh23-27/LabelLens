-- 1) Named reference sources -------------------------------------------------
insert into data_sources (source_name, source_type, source_reference, source_version, retrieved_at, license_information, is_seed_data)
select v.n, v.t, v.r, v.ver, now(), v.lic, true
from (values
 ('Codex Alimentarius General Standard for Food Additives (GSFA)','regulatory','https://www.fao.org/fao-who-codexalimentarius/codex-texts/list-standards/en/','CXS 192-1995 (current revision)','FAO/WHO, free public use'),
 ('JECFA — Joint FAO/WHO Expert Committee on Food Additives','scientific','https://www.fao.org/food-safety/scientific-advice/jecfa/en/','ADI evaluations database','FAO/WHO, free public use'),
 ('IARC Monographs on the Identification of Carcinogenic Hazards to Humans','scientific','https://monographs.iarc.who.int/','Volumes 1-136','WHO/IARC, free public use'),
 ('EFSA Food Additive Re-evaluation Programme','scientific','https://www.efsa.europa.eu/en/topics/topic/food-additives','rolling re-evaluations','EFSA open access'),
 ('WHO Guideline: Sugars intake for adults and children','guideline','https://www.who.int/publications/i/item/9789241549028','2015','WHO, free public use'),
 ('WHO Guideline: Sodium intake for adults and children','guideline','https://www.who.int/publications/i/item/9789241504836','2012','WHO, free public use'),
 ('FSSAI Food Safety and Standards (Labelling and Display) Regulations','regulatory','https://www.fssai.gov.in/cms/food-safety-and-standards-regulations.php','2020 (as amended)','Government of India, public document'),
 ('ICMR-NIN Dietary Guidelines for Indians','guideline','https://www.nin.res.in/','2024','ICMR-NIN, public document'),
 ('USDA FoodData Central','open-dataset','https://fdc.nal.usda.gov/','rolling','US public domain'),
 ('FSSAI Food Safety and Standards (Advertising and Claims) Regulations','regulatory','https://www.fssai.gov.in/cms/food-safety-and-standards-regulations.php','2018 (as amended)','Government of India, public document')
) as v(n,t,r,ver,lic)
where not exists (select 1 from data_sources d where d.source_name = v.n);

-- 2) Specific FSSAI clauses ---------------------------------------------------
insert into fssai_regulations (regulation_name, regulation_number, section, category, status, permitted_condition, applicable_food_category, source_reference, source_version, last_verified_at, is_seed_data)
select v.n, v.num, v.sec, v.cat, v.st, v.cond, v.food, v.ref, '2011 (as amended)', now(), true
from (values
 ('FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 1: Colouring Matter','Appendix A','Table 1','Colours','permitted-under-conditions','Only the listed synthetic and natural colours may be used, in the food categories and at the maximum levels stated.','Listed categories only','https://www.fssai.gov.in/cms/food-safety-and-standards-regulations.php'),
 ('FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 2: Preservatives','Appendix A','Table 2','Preservatives','permitted-under-conditions','Class I and Class II preservatives may be used only as listed, within stated maximum limits.','Listed categories only','https://www.fssai.gov.in/cms/food-safety-and-standards-regulations.php'),
 ('FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 3: Antioxidants','Appendix A','Table 3','Antioxidants','permitted-under-conditions','Antioxidants may be used only in listed foods, generally expressed on the fat content of the product.','Listed categories only','https://www.fssai.gov.in/cms/food-safety-and-standards-regulations.php'),
 ('FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 4: Emulsifying and Stabilising Agents','Appendix A','Table 4','Emulsifiers and stabilisers','permitted-under-conditions','Emulsifiers, stabilisers and thickeners may be used only in listed foods at stated levels.','Listed categories only','https://www.fssai.gov.in/cms/food-safety-and-standards-regulations.php'),
 ('FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 5: Anticaking Agents, Acidity Regulators and Miscellaneous Additives','Appendix A','Table 5','Miscellaneous additives','permitted-under-conditions','Anticaking agents, acidity regulators, raising agents and flavour enhancers may be used only as listed.','Listed categories only','https://www.fssai.gov.in/cms/food-safety-and-standards-regulations.php'),
 ('FSS (Food Products Standards and Food Additives) Regulations, 2011 — Regulation 3.1.3: Non-nutritive Sweeteners','3.1.3','Non-nutritive sweeteners','Sweeteners','permitted-under-conditions','High-intensity sweeteners are permitted only in specified foods, within maximum limits, with a mandatory label declaration.','Specified foods only','https://www.fssai.gov.in/cms/food-safety-and-standards-regulations.php'),
 ('FSS (Labelling and Display) Regulations, 2020 — Schedule I: Declaration of Allergens','Schedule I','Allergen declaration','Labelling','permitted-under-conditions','Cereals containing gluten, milk, egg, fish, crustacea, tree nuts, peanuts, soybeans, sulphites and their products must be declared on the label.','All packaged food','https://www.fssai.gov.in/cms/food-safety-and-standards-regulations.php'),
 ('FSS (Food Products Standards and Food Additives) Regulations, 2011 — Chapter 2: Standards for Food Products','Chapter 2','Product standards','Food standards','permitted','Compositional standards for oils, cereals, dairy, spices and other basic foods.','Basic foods','https://www.fssai.gov.in/cms/food-safety-and-standards-regulations.php')
) as v(n,num,sec,cat,st,cond,food,ref)
where not exists (select 1 from fssai_regulations r where r.regulation_name = v.n);

-- 3) Ingredient knowledge base ------------------------------------------------
insert into ingredients (canonical_name, common_name, ins_number, category, functional_class, why_used, consumer_explanation, allergen_flag, allergen_group, vegetarian_status, vegan_status, processing_indicator, nova_relevance, fssai_status, risk_level, sugar_alias, confidence)
values
-- Preservatives
('Sulphur Dioxide','Sulphites','220','Preservative','Preservative, bleaching agent','Stops browning and microbial spoilage','A sulphite preservative. Must be declared because it can trigger reactions in people with asthma.',true,'sulphites','vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.92),
('Sodium Metabisulphite','Sulphite preservative','223','Preservative','Preservative','Keeps dried and pickled foods from spoiling','Releases sulphur dioxide. Declared as an allergen because sensitive people can react to it.',true,'sulphites','vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.92),
('Potassium Metabisulphite','Sulphite preservative','224','Preservative','Preservative','Preserves colour in dried fruit and beverages','A sulphite preservative that must be declared on the label.',true,'sulphites','vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.9),
('Sodium Sulphite',null,'221','Preservative','Preservative','Prevents discolouration and spoilage','A sulphite preservative subject to allergen declaration.',true,'sulphites','vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.88),
('Benzoic Acid',null,'210','Preservative','Preservative','Blocks yeast and mould in acidic foods','Works only in acidic foods such as squashes and sauces. Widely used and studied.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.9),
('Sorbic Acid',null,'200','Preservative','Preservative','Stops mould growth in baked and dairy foods','One of the mildest common preservatives, with a high safety margin.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.9),
('Calcium Propionate','Bread preservative','282','Preservative','Preservative','Prevents mould and rope in bread','The standard bread preservative. Occurs naturally in some cheeses.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.9),
('Sodium Propionate',null,'281','Preservative','Preservative','Prevents mould in baked goods','Closely related to calcium propionate, used in bakery products.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.88),
('Nisin',null,'234','Preservative','Preservative','Controls bacteria in cheese and canned foods','A natural preservative made by fermentation, used mainly in dairy.',false,null,'vegetarian','not-vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.85),
('Natamycin',null,'235','Preservative','Preservative','Stops mould on cheese surfaces','A fermentation-derived antifungal used on cheese rinds and sausage casings.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.85),
('Sodium Nitrate',null,'251','Preservative','Preservative, colour fixative','Cures meat and prevents botulism','Used in cured meats. Nitrates can form nitrosamines when meat is cooked at high heat.',false,null,'non-vegetarian-use','not-vegan','industrial-ingredient',4,'permitted-under-conditions','high',false,0.9),
('Potassium Nitrate','Saltpetre','252','Preservative','Preservative, colour fixative','Cures and preserves meat products','A curing salt for meats, tightly limited by FSSAI.',false,null,'non-vegetarian-use','not-vegan','industrial-ingredient',4,'permitted-under-conditions','high',false,0.88),
('Potassium Nitrite',null,'249','Preservative','Preservative, colour fixative','Cures meat and blocks botulism bacteria','A curing agent with strict maximum limits because of nitrosamine formation.',false,null,'non-vegetarian-use','not-vegan','industrial-ingredient',4,'permitted-under-conditions','high',false,0.88),
('Calcium Disodium EDTA',null,'385','Antioxidant','Sequestrant, antioxidant','Traps metal ions that spoil flavour and colour','Locks up trace metals so oils and sauces stay fresh. Strictly limited by dose.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.88),
-- Antioxidants
('Tertiary Butylhydroquinone','TBHQ','319','Antioxidant','Antioxidant','Stops frying oils turning rancid','A synthetic antioxidant for fried snacks and instant noodles, capped at low levels.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.9),
('Butylated Hydroxyanisole','BHA','320','Antioxidant','Antioxidant','Protects fats from oxidation','A synthetic antioxidant under continued review by international expert panels.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.9),
('Butylated Hydroxytoluene','BHT','321','Antioxidant','Antioxidant','Keeps oils and cereals fresh for longer','A synthetic antioxidant permitted only in listed foods at low levels.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.9),
('Mixed Tocopherols','Vitamin E antioxidant','307','Antioxidant','Antioxidant','Natural protection against rancidity','A vitamin E based antioxidant, generally seen as the gentlest option.',false,null,'vegetarian','vegan','processed-food-ingredient',3,'permitted-under-conditions','low',false,0.88),
('Ascorbyl Palmitate',null,'304','Antioxidant','Antioxidant','Fat-soluble form of vitamin C for oils','A vitamin C derivative that protects oils from going off.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.86),
('Sodium Ascorbate',null,'301','Antioxidant','Antioxidant','Preserves colour and freshness','The sodium salt of vitamin C, used to stop browning.',false,null,'vegetarian','vegan','processed-food-ingredient',3,'permitted-under-conditions','low',false,0.88),
-- Synthetic colours
('Carmoisine','Azorubine','122','Artificial colour','Colouring agent','Gives a red-pink shade','A synthetic azo colour. Some studies link azo dyes to hyperactivity in sensitive children.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.92),
('Erythrosine',null,'127','Artificial colour','Colouring agent','Provides a cherry-red colour','A synthetic colour permitted only in a few foods, with tight limits.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.9),
('Ponceau 4R',null,'124','Artificial colour','Colouring agent','Gives a strawberry-red colour','A synthetic azo colour restricted to listed foods and maximum levels.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.9),
('Brilliant Blue FCF',null,'133','Artificial colour','Colouring agent','Produces blue and green shades','A synthetic colour, poorly absorbed by the body and permitted at low levels.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.9),
('Indigo Carmine','Indigotine','132','Artificial colour','Colouring agent','Adds a deep blue colour','A synthetic blue colour permitted in listed foods only.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.88),
('Fast Green FCF',null,'143','Artificial colour','Colouring agent','Adds green colour to sweets and drinks','A synthetic green colour with strict maximum limits in India.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.88),
('Titanium Dioxide',null,'171','Artificial colour','Colouring agent','Creates bright opaque white','Used for white coatings. The EU banned it as a food additive in 2022 while FSSAI still permits limited use.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.9),
-- Natural colours
('Curcumin','Turmeric colour','100','Natural colour','Colouring agent','Gives a yellow-orange colour','The yellow pigment from turmeric, used as a natural colour.',false,null,'vegetarian','vegan','processed-food-ingredient',3,'permitted-under-conditions','low',false,0.9),
('Beta-Carotene',null,'160a','Natural colour','Colouring agent, vitamin A source','Adds an orange colour and vitamin A','The orange pigment found in carrots. Also a source of vitamin A.',false,null,'vegetarian','vegan','processed-food-ingredient',3,'permitted-under-conditions','low',false,0.9),
('Annatto',null,'160b','Natural colour','Colouring agent','Gives butter and cheese a yellow tint','A seed extract used to colour dairy and snacks. Rare allergy reports.',false,null,'vegetarian','vegan','processed-food-ingredient',3,'permitted-under-conditions','low',false,0.88),
('Paprika Oleoresin',null,'160c','Natural colour','Colouring agent','Adds a warm red-orange colour','A concentrated extract of paprika used for colour and mild flavour.',false,null,'vegetarian','vegan','processed-food-ingredient',3,'permitted-under-conditions','low',false,0.86),
('Anthocyanins',null,'163','Natural colour','Colouring agent','Provides red, purple and blue shades','Pigments extracted from fruit and vegetable skins.',false,null,'vegetarian','vegan','processed-food-ingredient',3,'permitted-under-conditions','low',false,0.86),
('Iron Oxides',null,'172','Natural colour','Colouring agent','Gives black, red and yellow tints','Mineral pigments permitted only in a small set of foods.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.84),
-- Sweeteners
('Saccharin Sodium','Saccharin','954','Artificial sweetener','Sweetening agent','Sweetens with no calories','One of the oldest high-intensity sweeteners. Requires a label declaration in India.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.92),
('Acesulfame Potassium','Acesulfame K','950','Artificial sweetener','Sweetening agent','Adds sweetness without sugar','A calorie-free sweetener often blended with others. Limited by maximum use levels.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.92),
('Neotame',null,'961','Artificial sweetener','Sweetening agent','Extremely sweet, used in tiny amounts','A very high-intensity sweetener used at very small doses.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.88),
('Steviol Glycosides','Stevia','960','Artificial sweetener','Sweetening agent','Plant-derived sweetness with no calories','Sweet compounds extracted from stevia leaves. Permitted with maximum limits.',false,null,'vegetarian','vegan','processed-food-ingredient',4,'permitted-under-conditions','low',false,0.9),
('Sorbitol',null,'420','Bulking agent','Sweetening agent, humectant','Adds bulk sweetness and holds moisture','A sugar alcohol. Large amounts can have a laxative effect, which the label must warn about.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.9),
('Mannitol',null,'421','Bulking agent','Sweetening agent','Sweetens and prevents sticking','A sugar alcohol used in sugar-free products.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.86),
('Xylitol',null,'967','Bulking agent','Sweetening agent','Sugar-free sweetness for gum and mints','A sugar alcohol that does not feed tooth decay bacteria.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.88),
('Maltitol',null,'965','Bulking agent','Sweetening agent','Replaces sugar in sugar-free sweets','A sugar alcohol with about half the calories of sugar.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.88),
('Isomalt',null,'953','Bulking agent','Sweetening agent','Bulk sweetener for sugar-free confectionery','A sugar alcohol made from beet sugar.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.84),
-- Emulsifiers
('Mono- and Diglycerides of Fatty Acids',null,'471','Emulsifier','Emulsifier','Keeps fat and water mixed','A very common emulsifier. It can be made from plant or animal fats, so the source is not always clear.',false,null,'unknown','unknown','industrial-ingredient',4,'permitted-under-conditions','low',false,0.9),
('Polysorbate 80',null,'433','Emulsifier','Emulsifier','Stops separation in ice cream and sauces','A synthetic emulsifier permitted in listed foods at low levels.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.88),
('Polysorbate 60',null,'435','Emulsifier','Emulsifier','Improves texture in bakery and desserts','A synthetic emulsifier used in cakes and toppings.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.86),
('Diacetyl Tartaric Acid Esters of Mono- and Diglycerides','DATEM','472e','Emulsifier','Emulsifier, dough conditioner','Strengthens bread dough','A bread improver that gives industrial loaves a soft, even crumb.',false,null,'unknown','unknown','industrial-ingredient',4,'permitted-under-conditions','low',false,0.88),
('Sodium Stearoyl-2-Lactylate',null,'481(i)','Emulsifier','Emulsifier, dough conditioner','Improves loaf volume and softness','A bakery emulsifier used to keep bread soft for longer.',false,null,'unknown','unknown','industrial-ingredient',4,'permitted-under-conditions','low',false,0.86),
('Polyglycerol Esters of Fatty Acids',null,'475','Emulsifier','Emulsifier','Blends fats smoothly into batters','An emulsifier used in cakes, chocolate and spreads.',false,null,'unknown','unknown','industrial-ingredient',4,'permitted-under-conditions','low',false,0.84),
('Sucrose Esters of Fatty Acids',null,'473','Emulsifier','Emulsifier','Keeps mixtures stable','A sugar-based emulsifier used in beverages and bakery.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.84),
('Ammonium Phosphatides',null,'442','Emulsifier','Emulsifier','Controls chocolate flow during moulding','Used almost only in chocolate, as an alternative to soy lecithin.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.82),
-- Thickeners and stabilisers
('Carrageenan',null,'407','Stabilizer','Stabilizer, thickener','Thickens dairy and plant drinks','Extracted from red seaweed. Debated in research, but permitted at controlled levels.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.9),
('Sodium Alginate',null,'401','Thickener','Thickener, stabilizer','Thickens and gels','A seaweed extract used to thicken sauces and desserts.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.86),
('Pectin',null,'440','Thickener','Gelling agent','Sets jams and jellies','A fibre from fruit peel that makes jams set.',false,null,'vegetarian','vegan','processed-food-ingredient',3,'permitted-under-conditions','low',false,0.9),
('Gum Arabic','Acacia gum','414','Thickener','Thickener, stabilizer','Stops ingredients separating','A tree sap used as a natural stabiliser and fibre.',false,null,'vegetarian','vegan','processed-food-ingredient',3,'permitted-under-conditions','low',false,0.88),
('Locust Bean Gum','Carob gum','410','Thickener','Thickener, stabilizer','Gives a creamy texture','A seed gum used to keep ice cream smooth.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.86),
('Tragacanth Gum',null,'413','Thickener','Thickener, stabilizer','Thickens sauces and dressings','A plant gum used in small amounts as a thickener.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.8),
('Sodium Carboxymethyl Cellulose','CMC','466','Thickener','Thickener, stabilizer','Adds body and stops ice crystals','A cellulose-based thickener made from plant fibre.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.88),
('Microcrystalline Cellulose',null,'460(i)','Bulking agent','Bulking agent, anti-caking agent','Adds bulk and stops caking','Purified plant fibre used as a filler and texture aid.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.86),
('Acetylated Distarch Adipate','Modified starch','1422','Thickener','Thickener, stabilizer','Thickens and survives heating and freezing','A chemically modified starch that holds texture in processed foods.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.88),
('Hydroxypropyl Distarch Phosphate','Modified starch','1442','Thickener','Thickener, stabilizer','Keeps sauces smooth after processing','A modified starch used in sauces, soups and ready meals.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.88),
('Distarch Phosphate','Modified starch','1412','Thickener','Thickener','Thickens and stabilises','A modified starch that resists breaking down when heated.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.86),
('Modified Starch',null,null,'Thickener','Thickener, stabilizer','Generic term for treated starches','A starch changed physically or chemically so it thickens better. The exact type is often not stated.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.8),
-- Acidity regulators
('Malic Acid',null,'296','Acidity regulator','Acidity regulator','Adds a sharp apple-like tartness','The acid naturally found in apples, used to adjust sourness.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.88),
('Tartaric Acid',null,'334','Acidity regulator','Acidity regulator','Adds tartness and helps raising agents work','The acid found in grapes, also used in baking powder.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.88),
('Lactic Acid',null,'270','Acidity regulator','Acidity regulator','Controls acidity and adds mild sourness','Produced by fermentation, the same acid found in curd.',false,null,'vegetarian','vegan','processed-food-ingredient',3,'permitted-under-conditions','low',false,0.88),
('Acetic Acid','Vinegar acid','260','Acidity regulator','Acidity regulator, preservative','Adds sourness and preserves','The acid in vinegar, used to keep pickles and sauces stable.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted-under-conditions','low',false,0.88),
('Phosphoric Acid',null,'338','Acidity regulator','Acidity regulator','Gives colas their sharp bite','Used mainly in colas. Very high intake is linked to lower calcium retention.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.9),
('Trisodium Citrate','Sodium citrate','331(iii)','Acidity regulator','Acidity regulator, emulsifying salt','Balances acidity and melts cheese smoothly','A citric acid salt used to control acidity in drinks and cheese.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.88),
('Potassium Citrate',null,'332','Acidity regulator','Acidity regulator','Buffers acidity','A citric acid salt used to keep acidity steady.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.84),
('Fumaric Acid',null,'297','Acidity regulator','Acidity regulator','Adds long-lasting sourness','A dry acid used in powdered drinks and fillings.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.82),
('Disodium Phosphate',null,'339(ii)','Acidity regulator','Acidity regulator, emulsifying salt','Controls acidity and texture','A phosphate salt used in processed cheese and instant products.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.84),
('Sodium Carbonate','Soda ash','500(i)','Acidity regulator','Acidity regulator, raising agent','Neutralises acidity and softens texture','An alkaline salt used in noodles, biscuits and processed foods.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.86),
-- Raising agents
('Sodium Acid Pyrophosphate',null,'450(i)','Raising agent','Raising agent','Reacts with soda to lift baked goods','A baking-powder acid that makes cakes and biscuits rise.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','low',false,0.86),
('Ammonium Bicarbonate',null,'503(ii)','Raising agent','Raising agent','Makes biscuits crisp and light','A traditional raising agent for dry biscuits and crackers.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.84),
('Sodium Aluminium Phosphate',null,'541','Raising agent','Raising agent','Slow-acting lift for cakes','An aluminium-based raising agent. Aluminium intake is capped by weekly limits.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.84),
-- Flavour enhancers
('Disodium Inosinate',null,'631','Flavour enhancer','Flavour enhancer','Boosts savoury taste alongside MSG','A savoury booster. It can be made from meat, fish or fermentation, so the source may be unclear.',false,null,'unknown','unknown','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.9),
('Disodium Guanylate',null,'627','Flavour enhancer','Flavour enhancer','Intensifies savoury flavour','Usually paired with MSG. May be animal or fermentation derived.',false,null,'unknown','unknown','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.9),
('Disodium Ribonucleotides',null,'635','Flavour enhancer','Flavour enhancer','Mixture that deepens savoury taste','A blend of two savoury boosters, common in instant noodles and chips.',false,null,'unknown','unknown','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.9),
('Yeast Extract',null,null,'Flavour enhancer','Flavour enhancer','Natural savoury flavour','Made from yeast. It naturally contains glutamate, so it acts like MSG.',false,null,'vegetarian','vegan','processed-food-ingredient',3,'permitted','low',false,0.85),
('Hydrolysed Vegetable Protein',null,null,'Flavour enhancer','Flavour enhancer','Adds a meaty, savoury depth','Plant protein broken down to release savoury flavour compounds. Often soy or wheat based.',true,'soy or wheat','vegetarian','vegan','industrial-ingredient',4,'permitted','low',false,0.82),
-- Anti-caking agents
('Tricalcium Phosphate',null,'341(iii)','Anti-caking agent','Anti-caking agent','Keeps powders free-flowing','A calcium salt that stops powdered foods clumping.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.86),
('Magnesium Carbonate',null,'504(i)','Anti-caking agent','Anti-caking agent','Prevents caking in salt and powders','A mineral salt used to keep powders dry.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.84),
('Sodium Aluminosilicate',null,'554','Anti-caking agent','Anti-caking agent','Stops table salt clumping','An aluminium-containing anti-caking agent with weekly intake limits.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','medium',false,0.84),
('Magnesium Stearate',null,'470','Anti-caking agent','Anti-caking agent','Prevents sticking during manufacture','A fatty acid salt. It can come from plant or animal fat.',false,null,'unknown','unknown','industrial-ingredient',4,'permitted-under-conditions','low',false,0.82),
-- Fats and oils
('Hydrogenated Vegetable Fat','Vanaspati',null,'Fat or oil','Fat, texturiser','Makes fat solid and extends shelf life','Partially hydrogenated fats create trans fat, which health authorities advise avoiding.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted-under-conditions','high',false,0.9),
('Interesterified Vegetable Fat',null,null,'Fat or oil','Fat, texturiser','Solid fat without trans fat','A rearranged fat used to replace hydrogenated fat. Still a highly refined industrial fat.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted','medium',false,0.82),
('Refined Palmolein',null,null,'Fat or oil','Fat','Cheap, stable frying oil','The liquid fraction of palm oil, widely used in Indian processed foods.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','medium',false,0.88),
('Refined Sunflower Oil',null,null,'Fat or oil','Fat','Neutral cooking and frying oil','A refined seed oil, high in polyunsaturated fat.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','low',false,0.9),
('Rice Bran Oil',null,null,'Fat or oil','Fat','Stable oil for frying','Pressed from rice bran, valued for its balanced fat profile.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','low',false,0.88),
('Groundnut Oil','Peanut oil',null,'Fat or oil','Fat','Traditional Indian cooking oil','Pressed from peanuts. Refined oil rarely causes allergy but the source must be declared.',true,'peanut','vegetarian','vegan','processed-culinary-ingredient',2,'permitted','low',false,0.88),
('Coconut Oil',null,null,'Fat or oil','Fat','Cooking fat and flavour','A saturated plant fat used in South Indian cooking and confectionery.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','medium',false,0.88),
('Mustard Oil',null,null,'Fat or oil','Fat','Pungent traditional cooking oil','Pressed from mustard seeds, with FSSAI standards for purity.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','low',false,0.86),
('Butter',null,null,'Dairy','Fat, flavour','Adds richness and flavour','Milk fat. It is an allergen for people who react to dairy.',true,'milk','vegetarian','not-vegan','processed-culinary-ingredient',2,'permitted','medium',false,0.9),
('Ghee','Clarified butter',null,'Dairy','Fat, flavour','Traditional cooking fat','Clarified butter fat. Still a dairy allergen and high in saturated fat.',true,'milk','vegetarian','not-vegan','processed-culinary-ingredient',2,'permitted','medium',false,0.9),
('Cocoa Butter',null,null,'Fat or oil','Fat','Gives chocolate its melt','The natural fat of the cocoa bean, required in real chocolate.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','low',false,0.88),
-- Cereals and starches
('Refined Wheat Flour','Maida',null,'Cereal','Base ingredient','Main structure of most baked goods','Wheat flour with the bran and germ removed, so it has less fibre than whole wheat.',true,'gluten','vegetarian','vegan','processed-culinary-ingredient',2,'permitted','medium',false,0.92),
('Whole Wheat Flour','Atta',null,'Cereal','Base ingredient','Whole grain flour with the bran retained','Keeps the whole grain, so it has more fibre than refined flour.',true,'gluten','vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.92),
('Rice Flour',null,null,'Cereal','Base ingredient','Gluten-free flour for crisp texture','Milled rice, naturally free of gluten.',false,null,'vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.88),
('Corn Flour','Maize starch',null,'Cereal','Thickener, base ingredient','Thickens and adds crispness','Starch from maize, used to thicken and to lighten batters.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','low',false,0.88),
('Semolina','Suji or rava',null,'Cereal','Base ingredient','Coarse wheat for texture','Coarsely milled wheat used in upma, halwa and pasta.',true,'gluten','vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.88),
('Oats',null,null,'Cereal','Base ingredient','Whole grain with soluble fibre','A whole grain rich in beta-glucan fibre. Often processed alongside wheat.',true,'gluten','vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.88),
('Gram Flour','Besan',null,'Cereal','Base ingredient','Protein-rich pulse flour','Ground chickpeas, giving protein and fibre.',false,null,'vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.86),
('Tapioca Starch',null,null,'Cereal','Thickener, base ingredient','Cheap gluten-free starch','Starch from cassava root, used for texture and bulk.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted','low',false,0.84),
-- Dairy and protein
('Skimmed Milk Powder',null,null,'Dairy','Dairy ingredient','Adds milk solids without fat','Dried milk with the fat removed. A dairy allergen.',true,'milk','vegetarian','not-vegan','processed-food-ingredient',2,'permitted','low',false,0.9),
('Whey Protein Concentrate',null,null,'Protein','Protein source','Adds protein and body','A milk protein left over from cheese making. A dairy allergen.',true,'milk','vegetarian','not-vegan','industrial-ingredient',3,'permitted','low',false,0.88),
('Sodium Caseinate',null,null,'Protein','Protein source, emulsifier','Milk protein that blends fat and water','A processed milk protein used in creamers and desserts. A dairy allergen.',true,'milk','vegetarian','not-vegan','industrial-ingredient',4,'permitted','low',false,0.86),
('Gelatin',null,null,'Protein','Gelling agent','Sets jellies and marshmallows','Made from animal collagen, so it is not vegetarian.',false,null,'non-vegetarian-use','not-vegan','industrial-ingredient',3,'permitted','low',false,0.9),
('Egg Powder','Dried egg',null,'Protein','Protein source, emulsifier','Binds and enriches baked goods','Dried whole egg. A declared allergen.',true,'egg','non-vegetarian-use','not-vegan','processed-food-ingredient',2,'permitted','low',false,0.88),
('Peanut','Groundnut',null,'Nut or seed','Base ingredient','Adds protein, fat and crunch','One of the most common serious food allergens. Must always be declared.',true,'peanut','vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.92),
('Cashew Nut','Kaju',null,'Nut or seed','Base ingredient','Adds richness and crunch','A tree nut and declared allergen.',true,'tree nuts','vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.9),
('Almond','Badam',null,'Nut or seed','Base ingredient','Adds protein, fat and texture','A tree nut and declared allergen.',true,'tree nuts','vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.9),
('Sesame Seeds','Til',null,'Nut or seed','Base ingredient','Adds flavour and crunch','A declared allergen under Indian labelling rules.',true,'sesame','vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.88),
('Soybean','Soya',null,'Protein','Protein source','Cheap plant protein','A declared allergen used widely in processed foods.',true,'soy','vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.88),
('Wheat Gluten',null,null,'Protein','Protein source, dough conditioner','Strengthens dough and adds protein','Concentrated wheat protein. A declared allergen for people with coeliac disease.',true,'gluten','vegetarian','vegan','industrial-ingredient',3,'permitted','medium',false,0.88),
-- Sugars
('High Fructose Corn Syrup','HFCS',null,'Sugar','Sweetening agent','Cheap liquid sweetener','An industrial sweetener made from maize starch. Counts fully as added sugar.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted','high',true,0.9),
('Liquid Glucose',null,null,'Sugar','Sweetening agent, bulking agent','Sweetens and stops crystallisation','A syrup made from starch. It is an added sugar.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted','medium',true,0.9),
('Corn Syrup Solids',null,null,'Sugar','Sweetening agent, bulking agent','Dry form of glucose syrup','A dried starch syrup that counts as added sugar.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted','medium',true,0.86),
('Brown Sugar',null,null,'Sugar','Sweetening agent','Sweetens with a molasses note','Sugar with some molasses left in. Nutritionally almost the same as white sugar.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','medium',true,0.9),
('Jaggery','Gur',null,'Sugar','Sweetening agent','Traditional unrefined sweetener','Boiled cane juice. It keeps trace minerals but still counts as added sugar.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','medium',true,0.88),
('Honey',null,null,'Sugar','Sweetening agent','Natural liquid sweetener','A natural sugar. WHO counts honey as free sugar in daily limits.',false,null,'vegetarian','not-vegan','processed-culinary-ingredient',1,'permitted','medium',true,0.88),
('Molasses',null,null,'Sugar','Sweetening agent, colour','Adds dark colour and deep sweetness','A by-product of sugar refining, still an added sugar.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','medium',true,0.86),
('Malt Extract',null,null,'Sugar','Sweetening agent, flavour','Adds malty sweetness','A sugar syrup made from sprouted grain. Contains gluten.',true,'gluten','vegetarian','vegan','processed-food-ingredient',3,'permitted','medium',true,0.84),
-- Salt, spices, misc
('Common Salt','Namak',null,'Seasoning','Seasoning, preservative','Adds taste and preserves','Sodium chloride. WHO advises under 5 g of salt a day for adults.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','medium',false,0.92),
('Black Pepper','Kali mirch',null,'Spice','Flavouring','Adds pungent heat','A whole spice used for flavour.',false,null,'vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.86),
('Turmeric Powder','Haldi',null,'Spice','Flavouring, colour','Adds warm colour and flavour','A ground spice that also gives natural yellow colour.',false,null,'vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.86),
('Chilli Powder','Mirch powder',null,'Spice','Flavouring','Adds heat and red colour','Ground dried chillies used for heat and colour.',false,null,'vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.86),
('Onion Powder',null,null,'Spice','Flavouring','Adds savoury depth','Dried ground onion used in seasoning blends.',false,null,'vegetarian','vegan','processed-food-ingredient',2,'permitted','low',false,0.84),
('Garlic Powder',null,null,'Spice','Flavouring','Adds savoury aroma','Dried ground garlic used in seasonings.',false,null,'vegetarian','vegan','processed-food-ingredient',2,'permitted','low',false,0.84),
('Cumin Powder','Jeera powder',null,'Spice','Flavouring','Adds earthy aroma','A ground spice used across Indian cooking.',false,null,'vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.84),
('Spices and Condiments',null,null,'Spice','Flavouring','Generic blend declaration','A collective label term. The exact spices are not disclosed.',false,null,'vegetarian','vegan','processed-food-ingredient',2,'permitted','low',false,0.7),
('Water',null,null,'Base','Base ingredient','Carrier and solvent','Potable water used as the base of the product.',false,null,'vegetarian','vegan','processed-culinary-ingredient',1,'permitted','low',false,0.95),
('Inulin','Chicory root fibre',null,'Fibre','Dietary fibre, bulking agent','Adds fibre and replaces sugar bulk','A plant fibre added to boost the fibre figure. Large amounts can cause bloating.',false,null,'vegetarian','vegan','industrial-ingredient',4,'permitted','low',false,0.84),
('Cocoa Solids',null,null,'Base','Base ingredient','Gives chocolate flavour','The non-fat part of the cocoa bean, the source of chocolate taste.',false,null,'vegetarian','vegan','processed-food-ingredient',2,'permitted','low',false,0.86),
('Refined Vegetable Oil',null,null,'Fat or oil','Fat','Generic refined cooking fat','A generic declaration. The exact oil used is not named on the label.',false,null,'vegetarian','vegan','processed-culinary-ingredient',2,'permitted','medium',false,0.78),
-- Fortification nutrients
('Vitamin A (Retinyl Palmitate)',null,null,'Vitamin or mineral','Fortifying agent','Restores vitamin A lost in processing','Added under Indian fortification standards for oil and milk.',false,null,'vegetarian','not-vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.84),
('Vitamin D3 (Cholecalciferol)',null,null,'Vitamin or mineral','Fortifying agent','Supports calcium absorption','Usually made from lanolin in sheep wool, so it may not be vegan.',false,null,'unknown','not-vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.84),
('Folic Acid',null,null,'Vitamin or mineral','Fortifying agent','Added to fortified flour and salt','The synthetic form of folate used in Indian fortification programmes.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.84),
('Niacinamide','Vitamin B3',null,'Vitamin or mineral','Fortifying agent','Restores B vitamins','A B vitamin added to fortified cereals and flour.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.82),
('Ferric Pyrophosphate',null,null,'Vitamin or mineral','Fortifying agent','Iron fortification','An iron compound used to fortify salt, flour and rice under FSSAI standards.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.84),
('Zinc Sulphate',null,null,'Vitamin or mineral','Fortifying agent','Zinc fortification','A zinc salt used in fortified foods at controlled levels.',false,null,'vegetarian','vegan','industrial-ingredient',3,'permitted-under-conditions','low',false,0.82)
on conflict (canonical_name) do nothing;

-- 4) Cite every ingredient to a named FSSAI clause ----------------------------
update ingredients set source_reference = case
  when category in ('Artificial colour','Natural colour') then 'FSSAI FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 1 (Colouring Matter)'
  when category = 'Preservative' then 'FSSAI FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 2 (Preservatives)'
  when category = 'Antioxidant' then 'FSSAI FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 3 (Antioxidants)'
  when category in ('Emulsifier','Stabilizer','Thickener','Bulking agent') then 'FSSAI FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 4 (Emulsifying and Stabilising Agents)'
  when category in ('Anti-caking agent','Acidity regulator','Raising agent','Flavour enhancer','Humectant') then 'FSSAI FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 5 (Anticaking Agents, Acidity Regulators and Miscellaneous Additives)'
  when category = 'Artificial sweetener' then 'FSSAI FSS (Food Products Standards and Food Additives) Regulations, 2011 — Regulation 3.1.3 (Non-nutritive Sweeteners)'
  when category = 'Vitamin or mineral' then 'FSSAI FSS (Fortification of Foods) Regulations, 2018'
  when allergen_flag then 'FSSAI FSS (Labelling and Display) Regulations, 2020 — Schedule I (Declaration of Allergens); ICMR-NIN Dietary Guidelines for Indians, 2024'
  else 'FSSAI FSS (Food Products Standards and Food Additives) Regulations, 2011 — Chapter 2 (Standards for Food Products); ICMR-NIN Dietary Guidelines for Indians, 2024'
end
where source_reference is null or btrim(source_reference) = '';

-- 5) Auto-generate INS/E code aliases -----------------------------------------
insert into ingredient_aliases (ingredient_id, alias, alias_type)
select i.id, a.alias, 'code'
from ingredients i
cross join lateral (values ('ins ' || i.ins_number), ('ins' || i.ins_number), ('e' || i.ins_number), (i.ins_number)) as a(alias)
where i.ins_number is not null and btrim(i.ins_number) <> ''
on conflict (ingredient_id, alias) do nothing;

-- 6) Common label wordings ----------------------------------------------------
insert into ingredient_aliases (ingredient_id, alias, alias_type)
select i.id, v.alias, 'common'
from (values
 ('Refined Wheat Flour','maida'),('Refined Wheat Flour','wheat flour (maida)'),('Refined Wheat Flour','refined flour'),
 ('Whole Wheat Flour','atta'),('Whole Wheat Flour','whole wheat atta'),
 ('Semolina','suji'),('Semolina','rava'),('Gram Flour','besan'),
 ('Common Salt','salt'),('Common Salt','namak'),('Common Salt','edible common salt'),
 ('Hydrogenated Vegetable Fat','vanaspati'),('Hydrogenated Vegetable Fat','partially hydrogenated vegetable oil'),
 ('Refined Palmolein','palmolein'),('Refined Palmolein','refined palm oil'),
 ('Refined Vegetable Oil','edible vegetable oil'),('Refined Vegetable Oil','vegetable oil'),
 ('Skimmed Milk Powder','skim milk powder'),('Skimmed Milk Powder','smp'),
 ('High Fructose Corn Syrup','hfcs'),('High Fructose Corn Syrup','fructose corn syrup'),
 ('Liquid Glucose','glucose syrup solids'),('Corn Flour','maize starch'),('Corn Flour','cornstarch'),
 ('Peanut','groundnut'),('Peanut','groundnuts'),('Cashew Nut','kaju'),('Almond','badam'),
 ('Sesame Seeds','til'),('Soybean','soya'),('Soybean','soyabean'),
 ('Steviol Glycosides','stevia'),('Acesulfame Potassium','acesulfame k'),('Acesulfame Potassium','ace-k'),
 ('Saccharin Sodium','saccharin'),('Tertiary Butylhydroquinone','tbhq'),
 ('Butylated Hydroxyanisole','bha'),('Butylated Hydroxytoluene','bht'),
 ('Sodium Carboxymethyl Cellulose','cmc'),('Sodium Carboxymethyl Cellulose','carboxymethyl cellulose'),
 ('Diacetyl Tartaric Acid Esters of Mono- and Diglycerides','datem'),
 ('Mono- and Diglycerides of Fatty Acids','mono and diglycerides'),
 ('Mono- and Diglycerides of Fatty Acids','emulsifier (471)'),
 ('Disodium Ribonucleotides','ribonucleotides'),('Yeast Extract','yeast extract powder'),
 ('Hydrolysed Vegetable Protein','hvp'),('Turmeric Powder','haldi'),('Chilli Powder','mirch powder'),
 ('Cumin Powder','jeera'),('Ghee','desi ghee'),('Jaggery','gur'),
 ('Modified Starch','modified food starch'),('Acetylated Distarch Adipate','modified starch (1422)'),
 ('Sulphur Dioxide','sulphites'),('Sulphur Dioxide','sulfur dioxide'),
 ('Calcium Disodium EDTA','edta'),('Trisodium Citrate','sodium citrate'),
 ('Water','potable water'),('Inulin','chicory root fibre'),('Mixed Tocopherols','tocopherols')
) as v(name, alias)
join ingredients i on i.canonical_name = v.name
on conflict (ingredient_id, alias) do nothing;

-- 7) Link every ingredient to the regulation clause it is cited from ----------
insert into fssai_ingredient_rules (ingredient_id, food_category, permission_status, condition, regulation_reference, regulation_id, source_version, last_verified_at, is_seed_data)
select i.id, 'general', i.fssai_status,
  case i.fssai_status
    when 'permitted-under-conditions' then 'Permitted only in the food categories and within the maximum levels stated in the cited FSSAI table.'
    when 'permitted' then 'Permitted for use in food, subject to the general purity and compositional standards in the cited regulation.'
    else 'Status carried from the cited regulation; verify before relying on it.'
  end,
  i.source_reference,
  r.id,
  '2011 (as amended); verified against the FSSAI regulations page',
  now(),
  true
from ingredients i
left join fssai_regulations r on r.regulation_name = case
  when i.category in ('Artificial colour','Natural colour') then 'FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 1: Colouring Matter'
  when i.category = 'Preservative' then 'FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 2: Preservatives'
  when i.category = 'Antioxidant' then 'FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 3: Antioxidants'
  when i.category in ('Emulsifier','Stabilizer','Thickener','Bulking agent') then 'FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 4: Emulsifying and Stabilising Agents'
  when i.category in ('Anti-caking agent','Acidity regulator','Raising agent','Flavour enhancer','Humectant') then 'FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A, Table 5: Anticaking Agents, Acidity Regulators and Miscellaneous Additives'
  when i.category = 'Artificial sweetener' then 'FSS (Food Products Standards and Food Additives) Regulations, 2011 — Regulation 3.1.3: Non-nutritive Sweeteners'
  when i.allergen_flag then 'FSS (Labelling and Display) Regulations, 2020 — Schedule I: Declaration of Allergens'
  else 'FSS (Food Products Standards and Food Additives) Regulations, 2011 — Chapter 2: Standards for Food Products'
end
where not exists (select 1 from fssai_ingredient_rules x where x.ingredient_id = i.id);