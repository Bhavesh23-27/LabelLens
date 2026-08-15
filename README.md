# LabelLens Insights

LABEL LENS — MASTER PRODUCT DEVELOPMENT PROMPT

1. PROJECT IDENTITY

Build and productionize my major project:

Project Name: LabelLens
Tagline: Understand What You Eat.

LabelLens is an AI-powered ingredient analysis platform designed to help users understand packaged-food ingredient labels in simple language.

The core problem:

People often cannot understand packaged-food ingredient lists because they contain scientific names, technical food-additive names, INS numbers, preservatives, artificial colours, sweeteners, emulsifiers, stabilizers, flavouring agents, and other unfamiliar terms.

LabelLens should allow a user to scan/upload a food label, extract the ingredients, identify and normalize them, compare them against a structured food-safety knowledge base, classify the product using food-processing information such as NOVA, detect potential concerns, and present the result in extremely simple language.

This is NOT just a static UI project.

Build it as a complete, modular, database-backed application with a professional frontend, backend, database, AI/OCR pipeline, analysis engine, explainability layer, and scalable architecture.

2. VERY IMPORTANT — USE THE EXISTING PROJECT DESIGN

I have already created a block diagram/architecture for LabelLens.

Treat my existing block diagram as the PRIMARY architectural reference.

Before implementing the complete system:

Inspect the existing project structure.

Inspect any existing LabelLens components/pages.

Inspect the existing block diagram if it is available in the project.

Preserve the important workflow and concepts already established.

Do not randomly replace the existing architecture.

Improve the implementation where necessary while maintaining the intended workflow.

If an existing feature is already implemented correctly, improve it instead of unnecessarily rebuilding it.

The final application should visually and functionally represent the architecture shown in the block diagram.

3. EXISTING LABEL LENS DESIGN DIRECTION

The existing LabelLens design direction combines:

Fresh editorial wellness aesthetic

Modern food-tech appearance

Futuristic AI scanner experience

Cream/light backgrounds

Green wellness-oriented primary branding

Clean typography

Rounded modern cards

Subtle gradients

Soft shadows

Smooth animations

Professional dashboard components

Mobile-first responsive design

Do NOT make the website look like a generic Bootstrap dashboard.

It should feel like a premium modern AI food-analysis startup.

The interface should communicate:

TRUST + FOOD SAFETY + AI + SIMPLICITY + MODERN TECHNOLOGY

Use visual hierarchy carefully.

Avoid:

excessive neon

excessive glassmorphism

excessive animations

cluttered dashboards

unnecessary gradients everywhere

childish food illustrations

generic template-looking UI

4. CORE USER JOURNEY

The primary user journey should be:

USER
↓
Upload / Scan Food Label
↓
Image Preprocessing
↓
OCR
↓
Ingredient Extraction
↓
Ingredient Normalization
↓
Ingredient Knowledge Base Lookup
↓
FSSAI Regulatory Comparison
↓
NOVA / Food Processing Classification
↓
Nutrition Analysis
↓
Risk / Concern Detection
↓
AI Explanation
↓
Overall Product Analysis
↓
Simple Consumer-Friendly Report

The user should always understand what is happening.

5. HOME PAGE

Create a high-quality landing page.

Hero section:

Headline:

"Know What's Really Inside Your Food."

Supporting text:

"Scan a food label and let LabelLens turn complex ingredients into simple, understandable insights."

Primary CTA:

"Scan a Product"

Secondary CTA:

"Explore How It Works"

Hero visual:

Create an attractive AI food-label scanning interface.

Show:

Product package image

Scanning frame

OCR detection effect

Ingredient extraction animation

AI analysis indicators

Safety score preview

Do not make the animation excessive.

6. HOW LABEL LENS WORKS

Create a visual step-by-step section:

01 — Scan
User uploads or captures the ingredient label.

02 — Extract
OCR extracts the ingredient text.

03 — Understand
AI identifies and normalizes ingredients.

04 — Verify
Ingredients are compared with the knowledge base and relevant FSSAI regulatory information.

05 — Classify
The product is classified using processing and nutritional information.

06 — Explain
LabelLens converts technical information into simple language.

07 — Decide
The user receives an easy-to-understand product report.

Use a beautiful visual workflow rather than plain paragraphs.

7. PRODUCT SCANNING PAGE

Create a dedicated scanner page.

Provide two major methods:

OPTION A — IMAGE UPLOAD

Allow:

JPG

JPEG

PNG

WEBP

Drag-and-drop upload.

Show image preview.

Allow:

Crop

Rotate

Retake

Remove

Scan again

OPTION B — MANUAL ENTRY

Provide a text area:

"Paste ingredient list here"

This is important because OCR may fail.

Example:

"Milk solids, sugar, cocoa powder, emulsifier (INS 322), acidity regulator..."

Provide:

"Analyze Ingredients"

button.

8. OCR PIPELINE

Implement the architecture so OCR is a replaceable service.

The system should:

Receive image.

Validate image.

Preprocess image.

Improve contrast.

Correct orientation where possible.

Crop relevant text.

Perform OCR.

Extract ingredient text.

Detect likely ingredient-list boundaries.

Clean OCR errors.

Show extracted text to the user.

Allow the user to edit/correct OCR output before analysis.

VERY IMPORTANT:

Never silently trust OCR.

If OCR confidence is low:

Show:

"Some text may not have been detected correctly."

Allow manual correction.

Store:

original image

extracted text

corrected text

OCR confidence

timestamp

9. INGREDIENT PARSING

Build an ingredient parser that can understand:

comma-separated ingredients

nested parentheses

INS numbers

additive names

aliases

scientific names

common names

compound ingredients

percentage values

allergen declarations

Example:

"Emulsifier (Lecithin – INS 322)"

should be interpreted as:

Display name:
Lecithin

INS:
322

Category:
Emulsifier

Do not treat every word as a separate ingredient.

10. INGREDIENT NORMALIZATION

Create a normalization layer.

Different names may refer to the same ingredient.

Examples:

Sugar
Cane sugar
Sucrose

should be mapped where scientifically appropriate.

Similarly support:

INS numbers
E-numbers
Common names
Scientific names
Commercial names
Synonyms
Aliases

Every ingredient record should have:

canonical_name

common_names

scientific_name

INS_number

category

function

description

source

regulatory_status

processing_information

allergen_information

explanation

confidence

Do NOT make unsupported assumptions.

If the system cannot confidently identify an ingredient:

Show:

"Identification uncertain"

rather than inventing an answer.

11. FSSAI KNOWLEDGE BASE

This is one of the MOST IMPORTANT parts of LabelLens.

Create a structured FSSAI knowledge layer.

Use official FSSAI regulatory material as the regulatory source of truth.

The system should be designed to incorporate information related to:

Food product standards

Food additives

Contaminants

Toxins

Residues

Labelling

Display requirements

Health supplements

Nutraceuticals

Novel foods

Food claims

Packaging where relevant

Relevant amendments

Do NOT hard-code random internet claims as "FSSAI approved" or "FSSAI banned."

Instead create a versioned regulatory database.

Suggested tables:

fssai_regulations

Fields:

id
regulation_name
regulation_number
section
subsection
ingredient_or_substance
category
status
permitted_condition
maximum_limit
unit
applicable_food_category
effective_date
last_updated
source_reference
source_version
notes

Also create:

fssai_ingredient_rules

Fields:

id
ingredient_id
food_category
permission_status
condition
maximum_level
unit
regulation_reference
effective_date
source_version

VERY IMPORTANT:

The system must distinguish:

Permitted

Permitted under conditions

Restricted

Not permitted

Unknown / insufficient evidence

Not applicable

Do NOT convert "not found in database" into "banned."

12. REGULATORY VERSIONING

Because food regulations change, build versioning.

Every regulatory record should contain:

source

publication/version

effective date

last verified date

The admin should be able to update the knowledge base without rewriting application code.

Create an admin knowledge-base interface where authorized administrators can:

add ingredient

edit ingredient

update regulatory status

add regulation

update limits

add source

mark outdated records

review changes

maintain version history

13. NOVA CLASSIFICATION

Do NOT treat NOVA as a simple "healthy/unhealthy" score.

NOVA should classify the degree of food processing.

Support:

NOVA 1
Unprocessed / minimally processed foods

NOVA 2
Processed culinary ingredients

NOVA 3
Processed foods

NOVA 4
Ultra-processed foods

The UI should explain the classification in simple language.

Example:

"NOVA 4 — Ultra-processed"

Then:

"Why?"

Show evidence such as:

multiple additives

cosmetic ingredients

flavourings

sweeteners

emulsifiers

industrial processing indicators

Do NOT automatically say:

"NOVA 4 = dangerous"

Instead say something like:

"This classification indicates a high degree of industrial processing. It does not by itself prove that the product is unsafe."

14. USE A BETTER DATA STRATEGY THAN "NOVA DATABASE"

Do not depend on a supposed single "NOVA database."

Use a layered data architecture:

PRIMARY REGULATORY SOURCE:
FSSAI official regulations and amendments.

PRODUCT / INGREDIENT ENRICHMENT:
Use a reputable open food dataset such as Open Food Facts where appropriate and legally/licensing-compliantly available.

PROCESSING CLASSIFICATION:
NOVA classification rules.

NUTRITION:
Product nutrition data when available.

INTERNAL KNOWLEDGE BASE:
LabelLens curated ingredient dictionary.

The architecture must allow multiple sources.

For every external data point store:

source_name
source_type
source_reference
retrieved_at
confidence
license_information where applicable

Do not blindly merge conflicting sources.

15. INGREDIENT KNOWLEDGE DATABASE

Create a central ingredient database.

Suggested structure:

ingredients

id
canonical_name
common_name
scientific_name
aliases
ins_number
e_number
category
functional_class
description
consumer_explanation
allergen_flag
vegetarian_status
vegan_status
processing_indicator
nova_relevance
fssai_status
risk_level
confidence
source
source_reference
created_at
updated_at

Example categories:

Preservative

Emulsifier

Stabilizer

Thickener

Sweetener

Artificial colour

Natural colour

Acidity regulator

Antioxidant

Flavour enhancer

Humectant

Raising agent

Anti-caking agent

Fortifying agent

Processing aid

16. AI EXPLANATION ENGINE

The AI should NOT simply dump technical information.

Convert:

"INS 621"

into something understandable.

Example structure:

Ingredient:
Monosodium Glutamate

What it does:
"Used as a flavour enhancer."

Why it is used:
"Helps strengthen savoury flavour."

Regulatory status:
"Show the relevant verified regulatory information."

Consumer interpretation:
"LabelLens found this ingredient in the product. Here is what it does and what the available regulatory information says."

Avoid fear-based language.

Do not call something:

"toxic"
"poison"
"dangerous"

unless there is strong verified evidence and the context genuinely supports such a claim.

17. CONCERN DETECTION ENGINE

Create a rule-based analysis layer before AI interpretation.

Possible flags:

HIGH_SUGAR
ADDED_SUGAR
MULTIPLE_SUGAR_ALIASES
HIGH_SODIUM
ARTIFICIAL_SWEETENER
COLOUR_ADDITIVE
PRESERVATIVE
EMULSIFIER
FLAVOUR_ENHANCER
ALLERGEN
ULTRA_PROCESSED_INDICATOR
REGULATORY_REVIEW_REQUIRED
UNKNOWN_INGREDIENT

The system should NOT automatically classify an ingredient as harmful simply because it belongs to one of these categories.

These are:

"Things worth understanding"

not necessarily:

"Things to fear."

18. HIDDEN-SUGAR DETECTION

This is an important LabelLens feature.

Detect different forms and aliases of added sugars.

Examples may include:

sucrose
glucose syrup
fructose
maltose
dextrose
corn syrup
invert syrup
maltodextrin where relevant to the specific rule
etc.

Do not simply count every carbohydrate as sugar.

Clearly distinguish:

Total sugar

Added sugar

Sugar-containing ingredients

Naturally occurring sugars

When detected, show:

"Multiple sugar-containing ingredients detected"

and explain them.

19. ALLERGEN DETECTION

Create allergen detection.

The system should identify declared/common allergens from the ingredient list where possible.

Show a dedicated section:

"Allergen Information"

Possible status:

No common allergen detected

Potential allergen detected

Allergen information unclear

Contains / may contain statement detected

Always distinguish ingredient evidence from precautionary "may contain" statements.

20. NUTRITION ANALYSIS

If nutrition information is available from:

uploaded label

OCR

manual input

product database

extract:

Energy
Protein
Carbohydrates
Total sugars
Added sugars if available
Total fat
Saturated fat
Trans fat if available
Dietary fibre
Sodium
Salt where available

Display it using clean cards and visual indicators.

Do not invent nutrition values when they are not available.

21. PRODUCT HEALTH / LABEL SCORE

Create a LabelLens score, but make the logic transparent.

Do NOT present it as a medical or official FSSAI score.

Name it:

"LabelLens Insight Score"

or

"LabelLens Food Insight Score"

Show how the score was calculated.

Possible dimensions:

Ingredient transparency
Processing level
Added sugar indicators
Sodium indicators
Additive complexity
Allergen clarity
Regulatory match confidence
Nutrition quality where data is available

The score must be explainable.

Example:

"Your score is 72/100"

Then show:

Good ingredient transparency

No major regulatory concern detected
− Multiple sugar-containing ingredients
− High processing indicators

IMPORTANT:

Do not claim that this score represents official FSSAI certification.

22. PRODUCT ANALYSIS DASHBOARD

After analysis, create a premium dashboard.

Top section:

Product image
Product name
Brand
Overall LabelLens Insight Score
NOVA classification
Analysis confidence

Then:

Quick Verdict

Example:

"Generally understandable label with some ingredients worth reviewing."

Then cards:

Ingredient Summary

Total ingredients

Processing

NOVA classification

Sugar

Sugar-related findings

Additives

Number of identified additives

Allergens

Detected allergens

Regulatory

FSSAI-related findings

Confidence

Analysis confidence

23. INGREDIENT-BY-INGREDIENT VIEW

Create a beautiful expandable ingredient list.

Each ingredient should show:

Ingredient name
Category
Purpose
Simple explanation
Regulatory status
NOVA relevance
Potential concern
Confidence
Source

Example UI:

Lecithin
Emulsifier

"What does it do?"

"Helps ingredients such as oil and water mix together."

"Regulatory information"

"View source"

This should be expandable.

24. COLOR SYSTEM FOR INFORMATION

Use restrained semantic colors.

Green:
Positive / acceptable / verified

Amber:
Needs attention / uncertain

Red:
Important concern / verified restriction

Gray:
Unknown / insufficient information

Do not use red for every additive.

25. CONFIDENCE SYSTEM

Every AI/OCR-derived result should have a confidence value.

For example:

High confidence
Medium confidence
Low confidence

If low confidence:

"Please verify this ingredient manually."

Never pretend uncertain AI output is certain.

26. SOURCES AND EXPLAINABILITY

Every important regulatory or factual result should be traceable.

Add:

"Source"

"Regulation reference"

"Last verified"

"Data source"

Allow users to expand the evidence.

Example:

FSSAI Regulatory Reference
→ Regulation
→ Section
→ Ingredient
→ Condition
→ Source/version

This will make the project much stronger academically and professionally.

27. DISCLAIMER

Add a clear but non-scary disclaimer:

"LabelLens provides informational analysis based on available label data and referenced food-safety sources. It is not a substitute for professional medical, dietary, or regulatory advice. Regulatory information may change, so always verify the latest official requirements."

Do not make the disclaimer dominate the UI.

28. DATABASE ARCHITECTURE

Use a proper relational database.

Prefer Supabase/PostgreSQL if supported by the current Lovable project.

Suggested tables:

users
products
product_scans
scan_images
ocr_results
ingredient_extractions
ingredients
ingredient_aliases
ingredient_functions
fssai_regulations
fssai_ingredient_rules
nova_classifications
nutrition_facts
allergens
analysis_results
analysis_flags
data_sources
source_versions
admin_users
audit_logs

Create proper foreign keys.

Use indexes for:

ingredient names
INS numbers
aliases
product identifiers
regulation references

29. SECURITY

Implement:

Authentication

Authorization

Admin roles

Database row-level security where supported

Secure API keys

Server-side secrets

Input validation

File type validation

File size validation

Rate limiting where appropriate

Never expose secret API keys in frontend code.

30. ADMIN DASHBOARD

Create an admin dashboard.

Admin should be able to see:

Total users
Total scans
Successful OCR scans
Failed scans
Most scanned products
Most detected ingredients
Most common concerns
Unknown ingredients
Low-confidence analyses
Database freshness

Create knowledge-base management:

Ingredients
FSSAI rules
NOVA mappings
Aliases
Sources
Versions

Also create an:

"Unknown Ingredients Queue"

If LabelLens cannot confidently identify an ingredient, it enters this queue for admin review.

This is an excellent feature for making the system scalable.

31. SEARCH

Create global search.

Users should be able to search:

Ingredient name
INS number
Product name

Example:

"INS 621"

should show the corresponding ingredient information.

Search should support aliases.

32. HISTORY

Authenticated users should have:

Scan History

Each scan should show:

Product
Date
Score
NOVA classification
Key warnings
View Analysis

Allow:

Open
Delete
Compare

33. PRODUCT COMPARISON

Create a comparison feature.

Allow users to select two products.

Compare:

Overall insight score
NOVA
Sugar
Sodium
Additives
Allergens
Ingredient count
Processing indicators
Regulatory findings

Display side-by-side.

This can become one of LabelLens's strongest features.

34. AI CHAT / "ASK LABEL LENS"

Add an optional AI assistant on the analysis page.

Example user questions:

"Why is this ingredient used?"

"Is this product highly processed?"

"What does INS 322 mean?"

"Which ingredients should I pay attention to?"

"Compare this product with the previous one."

The assistant must answer ONLY using the available product analysis and trusted knowledge sources where possible.

Do not hallucinate.

If information is unavailable:

"I don't have enough verified information to answer that confidently."

35. SCAN PROCESS UI

When analysis starts, do not show a generic loading spinner.

Create an animated pipeline:

Uploading label...
↓
Reading text...
↓
Identifying ingredients...
↓
Checking ingredient database...
↓
Comparing regulatory information...
↓
Analyzing processing level...
↓
Generating explanation...
↓
Analysis complete.

This should make the AI process visually understandable.

36. ERROR STATES

Design professional error states.

Examples:

OCR_FAILED

"Couldn't read the ingredient list clearly."

NO_INGREDIENT_LIST

"We couldn't find a clear ingredient list."

LOW_CONFIDENCE

"Some ingredients may have been misread."

UNKNOWN_INGREDIENT

"We found an ingredient that isn't confidently identified yet."

DATABASE_UNAVAILABLE

"Ingredient verification is temporarily unavailable."

Do not crash the application.

37. MOBILE RESPONSIVENESS

The project must be fully responsive.

Prioritize:

Mobile
Tablet
Desktop

On mobile:

Bottom navigation can include:

Home
Scan
History
Explore
Profile

The scanning action should be extremely easy to access.

38. ACCESSIBILITY

Implement:

Proper semantic HTML

Keyboard navigation

Accessible contrast

ARIA labels

Focus states

Screen-reader friendly controls

Large enough touch targets

Reduced-motion support

39. PERFORMANCE

Optimize:

Image compression

Lazy loading

Database queries

Caching

Pagination

API calls

OCR processing

Large ingredient lists

Do not load the entire ingredient database into the browser.

Use server-side/database search.

40. AI ARCHITECTURE

Separate AI from deterministic rules.

Use:

DETERMINISTIC LAYER
for:

ingredient matching

aliases

INS numbers

FSSAI rule matching

thresholds

classification rules

confidence calculation

AI LAYER
for:

natural-language explanations

ingredient summaries

user questions

simplified descriptions

AI must NOT override verified regulatory rules.

This separation is extremely important.

41. ANALYSIS ENGINE

Implement this architecture:

OCR
→ Text Cleaning
→ Ingredient Parser
→ Entity Normalization
→ Knowledge Base Lookup
→ Regulatory Engine
→ Nutrition Engine
→ NOVA Engine
→ Concern Detection
→ Confidence Engine
→ AI Explanation Engine
→ Final Report

Make each module independent.

This should allow future replacement of OCR, AI models, or databases without rewriting the whole application.

42. API / BACKEND STRUCTURE

Create clean backend services such as:

/scan
/ocr
/parse-ingredients
/ingredients/search
/ingredients/:id
/fssai/check
/nova/classify
/nutrition/analyze
/analyze-product
/history
/compare
/admin/ingredients
/admin/fssai
/admin/sources

Do not put all logic inside one huge frontend component.

43. DATA SOURCE PRIORITY

Use this priority:

LEVEL 1
Official FSSAI regulatory information.

LEVEL 2
Trusted structured food datasets for product/ingredient enrichment.

LEVEL 3
LabelLens curated ingredient knowledge base.

LEVEL 4
AI-generated explanations based on the verified data.

AI-generated information must never silently become regulatory truth.

44. DATA CONFLICT HANDLING

If two sources disagree:

Do NOT silently select one.

Store:

source A
source B
conflict status

Prefer the authoritative regulatory source for regulatory claims.

Show:

"Sources differ"

when necessary.

45. PRODUCT IDENTIFICATION

If barcode information is available, support barcode scanning.

Potential flow:

Barcode
↓
Product database lookup
↓
Retrieve product information
↓
Verify against uploaded label
↓
Run LabelLens analysis

If barcode data and label data conflict:

show:

"Product information does not fully match the uploaded label."

Do not automatically assume either one is correct.

46. DATABASE SEEDING

Create seed/sample data so the complete UI works immediately.

Include representative sample ingredients such as:

Sugar

Sucrose

Glucose syrup

Lecithin / INS 322

MSG / INS 621

Citric acid

Sodium benzoate

Potassium sorbate

Artificial/natural food colours

Common allergens

BUT:

Clearly label sample records as demo/seed data.

Do not represent demo data as official regulatory data.

47. DEMO MODE

Create a demo mode so the project can be demonstrated even if external OCR/AI APIs are unavailable.

Demo flow:

Upload sample label
↓
Simulated OCR
↓
Ingredient extraction
↓
Database matching
↓
Analysis
↓
Dashboard

The UI should clearly distinguish:

"Demo Analysis"

from real analysis.

48. VISUAL DASHBOARD COMPONENTS

Use:

Score ring

Ingredient cards

NOVA badge

Risk/attention indicators

Nutrition cards

Expandable ingredient rows

Source drawer

Processing timeline

Comparison cards

Confidence indicators

Charts only where they genuinely improve understanding

Do not turn the application into a chart-heavy analytics dashboard.

49. LANDING PAGE SECTIONS

Build:

Hero
↓
Problem
↓
How LabelLens Works
↓
AI Scanner Preview
↓
Ingredient Intelligence
↓
FSSAI Verification
↓
NOVA Processing Analysis
↓
Product Comparison
↓
Why LabelLens
↓
Privacy/Security
↓
FAQ
↓
CTA
↓
Footer

50. BRANDING

Brand:

LABEL LENS

Possible visual concept:

A food-label scanner combined with a lens/AI concept.

Logo should be simple and modern.

Use the existing LabelLens branding direction wherever available.

Do not make it look like a generic nutrition app.

51. UI MICROCOPY

Prefer:

"Understand this ingredient"

instead of:

"Ingredient Details"

Prefer:

"What LabelLens found"

instead of:

"Analysis Output"

Prefer:

"Why is this used?"

instead of:

"Function"

Prefer:

"Things worth knowing"

instead of:

"Warnings"

Prefer:

"Verified information"

instead of:

"Official approval"

Use simple language throughout.

52. IMPORTANT LEGAL / SCIENTIFIC RULE

Never make claims such as:

"FSSAI approved product"

unless the database actually verifies the exact claim.

Never make claims such as:

"This ingredient is dangerous"

without appropriate evidence.

Never equate:

NOVA 4 = unsafe

Never equate:

Additive detected = harmful

Never equate:

Not found in database = banned

Never generate fake regulatory references.

Accuracy is more important than making the result look impressive.

53. DATA FRESHNESS

Display:

"Knowledge base last updated: [date]"

where appropriate.

Admin should be able to update regulatory data.

Build the architecture so future FSSAI amendments can be incorporated without changing the application logic.

54. SOURCE ATTRIBUTION

Create a dedicated source system.

Every important piece of external information should have:

source name
source type
reference
retrieval date
version
confidence

Create a "View Sources" interface.

This is especially important because LabelLens is an academic/research project.

55. RESEARCH / ACADEMIC MODE

Because this is also a major academic project, create an optional:

"Analysis Details"

section that can show:

Input
OCR result
Normalized ingredients
Database matches
Rules triggered
NOVA reasoning
Flags generated
Confidence
Sources

This makes the system explainable during project evaluation/viva.

56. BLOCK DIAGRAM IMPLEMENTATION

Map the existing block diagram into actual software modules.

For example:

INPUT
→ Camera / Image Upload / Manual Text

PREPROCESSING
→ Image Processing

OCR
→ Text Extraction

NLP / PARSER
→ Ingredient Extraction

DATABASE
→ Ingredient Knowledge Base

REGULATORY ENGINE
→ FSSAI Comparison

CLASSIFICATION ENGINE
→ NOVA

ANALYSIS ENGINE
→ Concern Detection

AI ENGINE
→ Natural Language Explanation

OUTPUT
→ LabelLens Dashboard

Do not create a completely different architecture from the block diagram.

57. CODE QUALITY

Use clean architecture.

Prefer:

components/
pages/
services/
lib/
hooks/
types/
utils/
database/
api/

Use reusable components.

Do not create huge monolithic files.

Use TypeScript if the project stack supports it.

Use clear naming.

Add comments only where useful.

58. FINAL PRODUCT QUALITY BAR

I want this to look like a serious startup-quality product, not a college template.

The final application should be:

Beautiful
Fast
Responsive
Explainable
Database-backed
AI-ready
Secure
Modular
Research-friendly
Scalable

It should be impressive during:

Project demonstration

Viva

Faculty evaluation

Portfolio presentation

GitHub showcase

Placement interviews

59. IMPLEMENTATION ORDER

Do not try to build everything as one giant uncontrolled implementation.

Build in phases:

PHASE 1
UI/UX foundation

PHASE 2
Authentication and database

PHASE 3
Ingredient knowledge base

PHASE 4
FSSAI regulatory layer

PHASE 5
OCR pipeline

PHASE 6
Ingredient parser

PHASE 7
NOVA classification

PHASE 8
Analysis engine

PHASE 9
AI explanation

PHASE 10
History and comparison

PHASE 11
Admin dashboard

PHASE 12
Security, performance and testing

PHASE 13
Final visual polish

After each phase, ensure the application still runs correctly.

60. DO NOT STOP AT THE UI

This is extremely important.

Do not respond by only creating mock cards and fake dashboards.

Where a real backend/database/API is required, implement the actual architecture.

If an external API requires credentials that cannot be provided immediately:

Create the service abstraction.

Create environment variable placeholders.

Create a safe mock/demo fallback.

Clearly separate mock data from production data.

Do not hard-code secret keys.

61. BEFORE FINISHING

Perform a complete project audit.

Check:

All pages work.

Navigation works.

Upload works.

Manual ingredient input works.

OCR architecture works.

Ingredient parsing works.

Ingredient normalization works.

Database queries work.

FSSAI matching architecture works.

NOVA classification works.

Analysis results are explainable.

History works.

Comparison works.

Admin works.

Authentication works.

Mobile layout works.

Error states work.

Loading states work.

No fake claims are displayed.

No secrets are exposed.

No broken buttons remain.

No placeholder text remains where functionality is expected.

62. FINAL INSTRUCTION TO LOVABLE

Use your full design, frontend, backend, database, AI integration, responsive UI, accessibility, and engineering capabilities to turn LabelLens into a complete working product.

Do not merely make a visually attractive prototype.

Build the architecture so that:

IMAGE
→ OCR
→ INGREDIENT EXTRACTION
→ NORMALIZATION
→ KNOWLEDGE BASE
→ FSSAI REGULATORY CHECK
→ NOVA CLASSIFICATION
→ NUTRITION ANALYSIS
→ CONCERN DETECTION
→ AI EXPLANATION
→ TRANSPARENT SCORE
→ USER REPORT

works as one coherent system.

Prioritize:

Correctness

Explainability

Data integrity

FSSAI-source traceability

Excellent UX

Scalability

Security

Visual polish

If a requirement cannot be implemented immediately because an external service/API/key is unavailable, create the correct production architecture and a clearly separated demo fallback rather than pretending the functionality is real.

The final result should feel like:

"An AI-powered food-label intelligence platform built for real consumers, backed by structured regulatory and ingredient knowledge."

Build LabelLens to this standard.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5ad91dcc-4c84-483b-89a2-b7f2012cad56).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
