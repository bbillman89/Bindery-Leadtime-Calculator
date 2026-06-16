# Preproduction Materials List — Business Logic Reference

## Overview

`preproduction-materials.html` is a digital version of the Preproduction Materials List form. It captures all materials, hardware, and production department requirements for a bindery job, then automatically determines which of four lead time tiers the job qualifies for. The form can be printed or saved as a PDF directly from the browser.

---

## Lead Time Tiers

| Tier | Name | Lead Time |
|------|------|-----------|
| Tier 1 | Fast Track | 15 Work Days |
| Tier 2 | Standard | 25 Work Days |
| Tier 3 | Complex | 40 Work Days |
| Tier 4 | TBD | To be determined |

The tier displayed on the form is the **minimum tier that accommodates all conditions selected**. Each condition below specifies the minimum tier it triggers. The form always assigns the highest required tier.

---

## Tier Qualification Rules

### 1. Order Quantity

| Quantity | Minimum Tier |
|----------|-------------|
| 100 or fewer | Tier 1 |
| 101–250 | Tier 2 |
| 251–1,000 | Tier 3 |
| Over 1,000 | **Tier 4** |

### 2. Material Availability Status

Each material (Leather, Fabric, and all Hardware & Components) carries an availability status. The status of the "worst" (least available) active material drives tier escalation.

| Status | Minimum Tier |
|--------|-------------|
| In-house and available | Tier 1 |
| Ordered — in-stock at vendor | Tier 2 |
| Ordered — NOT yet in-stock at vendor | **Tier 4** |

> **Note:** A single material marked "Ordered — NOT yet in-stock" immediately pushes the job to Tier 4, regardless of all other conditions.

### 3. Production Departments

| Department Needed | Minimum Tier |
|------------------|-------------|
| Deboss | Tier 1 (no escalation — allowed at all tiers) |
| Offset Print | Tier 2 |
| Sewing | Tier 2 |
| Metal Work — Tippin Only | Tier 2 |
| Metal Work — Full | Tier 3 |
| Flatbed Print | Tier 3 |
| Wood Shop | Tier 3 |

### 4. Interior Components — Corner Boards

| Condition | Minimum Tier |
|-----------|-------------|
| Standard boards, 1–4 panels | Tier 1 |
| Standard boards, 5+ panels | Tier 3 |
| Non-standard boards (any quantity) | Tier 3 |

### 5. Interior Components — Pockets

| Condition | Minimum Tier |
|-----------|-------------|
| Standard pockets | Tier 1 |
| Non-standard pockets | Tier 3 |

### Tier 4 — "Anything outside Tier 1–3 conditions"

Tier 4 is triggered by:
- Order quantity exceeding 1,000 units
- Any material ordered and NOT yet in-stock at the vendor

Tier 4 lead time is determined case-by-case ("TBD") and must be assessed manually.

---

## Form Sections

### Job Header
- **Job Order #** — identifier for the job
- **Order Quantity** — drives quantity-based tier logic; numeric input only
- **Date Received** — when the job was received
- **Due Date** — customer's requested delivery date

### Cover Materials

**Leather and Fabric** are treated as full card sections with expanded fields because they are the primary cover materials and require vendor tracking.

**Leather fields:** Vendor, Product Line, Family, Color, Decoration, Qty (Yards/Meters)

**Fabric fields:** Color/Style, Size, Vendor

When either is marked as **Ordered (any status)**, an order tracking sub-section appears with: Date Ordered, PO #, Date Received.

### Hardware & Components

A table listing all bindery hardware components. Each row can be toggled active (included in job) or inactive (not needed). Only active rows are printed.

**Components tracked:**
- Magnets
- Elastic Cords / Loops
- Eyelets
- O-Rings
- Ring Binder
- Bands
- Clips
- Romark
- Rivets
- Plastic Sleeves
- Snaps
- Screw Posts
- Custom Hardware

**Row color coding (on screen):**
- White — In-house and available
- Yellow — Ordered, in-stock at vendor
- Red — Ordered, NOT yet in-stock

### Production Departments

Six departments are tracked. Each has a **Needed** checkbox and a **Completed** checkbox for production tracking.

- **Deboss** — checkbox; does not escalate tier
- **Offset Print** — checkbox; escalates to Tier 2
- **Flatbed Print** — checkbox; escalates to Tier 3
- **Sewing** — checkbox; escalates to Tier 2
- **Wood Shop** — checkbox; escalates to Tier 3
- **Metal Work** — three-way radio (None / Tippin Only / Full Metal Work)
  - None: no escalation
  - Tippin Only: escalates to Tier 2
  - Full Metal Work: escalates to Tier 3

On print, departments that are not needed are hidden automatically.

### Interior Components

- **Corner Boards** — toggleable; when active shows Panel Count (1–4 or 5+) and Type (Standard/Non-Standard). 5+ panels or non-standard forces Tier 3.
- **Pockets** — toggleable; when active shows Type (Standard/Non-Standard). Non-standard forces Tier 3.
- **Tabs** — checkbox for job tracking; does not affect tier.

Ring Binder, Eyelets, and Screw Posts are captured in the Hardware & Components table.

### Lead Time Assessment

Displays the calculated tier in a color-coded banner that updates live as the form is filled in. Shows the tier name, lead time in work days, and a list of all qualifying factors that contributed to the tier assignment.

| Color | Tier |
|-------|------|
| Green | Tier 1 — Fast Track |
| Blue | Tier 2 — Standard |
| Yellow | Tier 3 — Complex |
| Red | Tier 4 — TBD |

### Notes

Free-text area for special instructions, open questions, or additional context.

### Sign-Off

- Checkbox confirming all order components are in-house and ready for production scheduling
- Material Handler signature line
- Date line

---

## Tier Determination Algorithm

The tier is calculated by starting at Tier 1 and escalating based on each condition encountered. The final tier is always the highest tier triggered by any single condition. Pseudo-logic:

```
tier = 1

if qty > 1000              → tier = 4 (immediate)
if qty > 250               → tier = max(tier, 3)
if qty > 100               → tier = max(tier, 2)

for each active material:
  if status == "not-in-stock"      → tier = 4 (immediate)
  if status == "ordered-in-stock"  → tier = max(tier, 2)

if flatbed print needed    → tier = max(tier, 3)
if wood shop needed        → tier = max(tier, 3)
if full metal work needed  → tier = max(tier, 3)
if tippin metal work       → tier = max(tier, 2)
if offset print needed     → tier = max(tier, 2)
if sewing needed           → tier = max(tier, 2)

if corner boards active:
  if 5+ panels             → tier = max(tier, 3)
  if non-standard          → tier = max(tier, 3)

if pockets active:
  if non-standard          → tier = max(tier, 3)

return tier
```

---

## PDF / Print Output

Click **Save as PDF** in the toolbar to open the browser print dialog. Select "Save as PDF" as the destination. The print stylesheet:

- Removes the toolbar and all interactive buttons
- Hides unchecked/inactive materials and hardware rows
- Hides production departments not needed for the job
- Removes input borders so fields look like plain text
- Preserves the color-coded Tier badge
- Sets page size to 11" × 17"
- Adds a printed date stamp in the footer

---

## File Structure

| File | Purpose |
|------|---------|
| `preproduction-materials.html` | Main form — self-contained, no external dependencies |
| `preproduction-materials-README.md` | This document — business logic reference |
| `reference/BIS.html` | Menu Construction Sheet (separate tool, for reference) |
| `Lead Time Definition.xlsx` | Source spreadsheet for tier definitions |
| `PREPRODUCTION MATERIALS LIST.docx` | Original paper form this tool digitizes |
