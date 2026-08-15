/**
 * Demo mode fixtures. Clearly separated from production data: every analysis
 * started from here is tagged `isDemo` and labelled "Demo Analysis" in the UI.
 */
export type DemoLabel = {
  id: string;
  productName: string;
  brand: string;
  category: string;
  text: string;
  ocrConfidence: number;
};

export const DEMO_LABELS: DemoLabel[] = [
  {
    id: "choco-wafer",
    productName: "Chocolate Cream Wafer",
    brand: "Demo Foods",
    category: "Biscuits & wafers",
    ocrConfidence: 0.88,
    text: `INGREDIENTS: Refined wheat flour (maida) 32%, Sugar, Edible vegetable oil (palm oil), Cocoa solids, Milk solids, Invert sugar syrup, Glucose syrup, Emulsifier (Lecithin - INS 322), Raising agent (INS 500(ii)), Iodised salt, Artificial flavouring substances.
ALLERGEN INFORMATION: Contains wheat, milk and soy. May contain traces of peanuts and tree nuts.
NUTRITION INFORMATION (per 100 g): Energy 498 kcal, Protein 5.2 g, Carbohydrate 62.4 g, Total Sugars 34.1 g, Total Fat 25.3 g, Saturated Fat 12.8 g, Trans Fat 0.1 g, Dietary Fibre 1.8 g, Sodium 210 mg.`,
  },
  {
    id: "masala-noodles",
    productName: "Masala Instant Noodles",
    brand: "Demo Kitchen",
    category: "Instant noodles",
    ocrConfidence: 0.81,
    text: `INGREDIENTS: Refined wheat flour, Edible vegetable oil (palm oil), Iodised salt, Wheat gluten, Thickener (INS 412), Acidity regulator (INS 330), Flavour enhancer (Monosodium Glutamate - INS 621), Sugar, Maltodextrin, Nature identical flavouring substances, Anticaking agent (INS 551), Colour (INS 150d).
NUTRITION INFORMATION (per 100 g): Energy 452 kcal, Protein 9.1 g, Carbohydrate 58.6 g, Total Sugars 4.2 g, Total Fat 19.4 g, Saturated Fat 9.2 g, Dietary Fibre 2.4 g, Sodium 1180 mg.`,
  },
  {
    id: "diet-soda",
    productName: "Zero Sugar Lemon Soda",
    brand: "Demo Beverages",
    category: "Carbonated beverage",
    ocrConfidence: 0.93,
    text: `INGREDIENTS: Carbonated water, Acidity regulator (Citric acid - INS 330), Preservative (Sodium benzoate - INS 211), Artificial sweetener (Sucralose - INS 955), Artificial sweetener (Aspartame - INS 951), Nature identical flavouring substances, Colour (Caramel colour - INS 150d).
NUTRITION INFORMATION (per 100 ml): Energy 1 kcal, Protein 0 g, Carbohydrate 0.1 g, Total Sugars 0 g, Total Fat 0 g, Sodium 22 mg.
Contains a source of phenylalanine.`,
  },
  {
    id: "oat-muesli",
    productName: "Fruit & Nut Oat Muesli",
    brand: "Demo Grains",
    category: "Breakfast cereal",
    ocrConfidence: 0.9,
    text: `INGREDIENTS: Rolled oats 58%, Whole wheat flakes, Raisins, Almonds, Cashew nuts, Sugar, Ascorbic acid (INS 300).
ALLERGEN INFORMATION: Contains wheat and tree nuts.
NUTRITION INFORMATION (per 100 g): Energy 372 kcal, Protein 11.2 g, Carbohydrate 62.1 g, Total Sugars 12.4 g, Total Fat 7.6 g, Saturated Fat 1.2 g, Dietary Fibre 9.8 g, Sodium 18 mg.`,
  },
];

export const SAMPLE_PASTE = DEMO_LABELS[0]!.text;
