# LabelLens Block Diagram for Seminar PPT

## Goal
Create one clean, presentation-ready block diagram of the LabelLens system architecture, sized and styled for a PowerPoint slide.

## What the diagram shows (matches the real pipeline in src/lib/engine/)
Three input options feed one deterministic pipeline:

```text
Inputs                          LabelLens Pipeline                              Output
+---------------+   +--------------------------------------------------+   +-------------------+
| Photo (OCR)   |-->| Parse text  ->  Match knowledge base             |-->| Consumer report:  |
| Paste text    |-->| (FSSAI + NOVA)  ->  Regulatory rule check        |   | Insight Score     |
| Barcode scan  |-->| -> NOVA class  ->  Concerns & allergens          |   | NOVA class        |
+---------------+   | -> Insight Score  ->  AI plain-language          |   | Findings + sources|
                    |    explanation                                   |   +-------------------+
                    +--------------------------------------------------+
                            |
                    PostgreSQL knowledge base
                    (ingredients, FSSAI rules, NOVA, sources)
```

## Design
- Midnight Lab theme: dark navy background, electric-lime accents, Space Grotesk headings — consistent with the app and the planned PPT theme.
- One file: high-resolution PNG (1920x1080) at `/mnt/documents/LabelLens-Block-Diagram.png`, ready to drop into a slide.
- Clean boxes with arrows, short labels only (readable from the back of a classroom). No tiny paragraphs.

## Deliverable
- `/mnt/documents/LabelLens-Block-Diagram.png` — the slide-ready image.
- QA: view the image to check for text legibility and no overlaps before handing over.
