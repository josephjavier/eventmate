/**
 * lib/checklist-template.ts
 * Philippine wedding checklist template — hardcoded as a TypeScript constant.
 *
 * Loaded on demand via app/actions/checklist.ts loadTemplate().
 * NOT auto-inserted on event creation (D-13).
 * After loading, couples can delete any item or category freely (D-14).
 *
 * D-11: 14 supplier categories in order
 * D-12: Personal Tasks group with 3 sub-groups (Legal, Pre-wedding, Day-of)
 *       Honeymoon/post-wedding tasks are NOT included.
 */

export interface TemplateItem {
  category: string
  title: string
  item_type: "supplier_task" | "personal_task"
  sort_order: number
}

export const CHECKLIST_TEMPLATE: TemplateItem[] = [
  // ─── D-11: 14 Supplier Categories (sort_order 1–14) ─────────────────────────
  {
    category: "Photography",
    title: "Book photographer",
    item_type: "supplier_task",
    sort_order: 1,
  },
  {
    category: "Videography",
    title: "Book videographer",
    item_type: "supplier_task",
    sort_order: 2,
  },
  {
    category: "Venue / Reception Hall",
    title: "Book venue / reception hall",
    item_type: "supplier_task",
    sort_order: 3,
  },
  {
    category: "Catering",
    title: "Book catering",
    item_type: "supplier_task",
    sort_order: 4,
  },
  {
    category: "Hair & Make-up",
    title: "Book hair & make-up artist",
    item_type: "supplier_task",
    sort_order: 5,
  },
  {
    category: "Florist",
    title: "Book florist",
    item_type: "supplier_task",
    sort_order: 6,
  },
  {
    category: "Host / Emcee",
    title: "Book host / emcee",
    item_type: "supplier_task",
    sort_order: 7,
  },
  {
    category: "Wedding Gown / Barong",
    title: "Book wedding gown / barong",
    item_type: "supplier_task",
    sort_order: 8,
  },
  {
    category: "Cake & Dessert",
    title: "Book cake & dessert",
    item_type: "supplier_task",
    sort_order: 9,
  },
  {
    category: "Invitations & Printing",
    title: "Book invitations & printing",
    item_type: "supplier_task",
    sort_order: 10,
  },
  {
    category: "Sound System",
    title: "Book sound system",
    item_type: "supplier_task",
    sort_order: 11,
  },
  {
    category: "Lights & Décor",
    title: "Book lights & décor",
    item_type: "supplier_task",
    sort_order: 12,
  },
  {
    category: "Transportation",
    title: "Book transportation",
    item_type: "supplier_task",
    sort_order: 13,
  },
  {
    category: "Wedding Coordinator",
    title: "Book wedding coordinator",
    item_type: "supplier_task",
    sort_order: 14,
  },

  // ─── D-12: Personal Tasks — Legal Documents (sort_order 100–103) ─────────────
  {
    category: "Personal Tasks",
    title: "Marriage license application",
    item_type: "personal_task",
    sort_order: 100,
  },
  {
    category: "Personal Tasks",
    title: "CENOMAR (PSA)",
    item_type: "personal_task",
    sort_order: 101,
  },
  {
    category: "Personal Tasks",
    title: "Birth certificates (PSA)",
    item_type: "personal_task",
    sort_order: 102,
  },
  {
    category: "Personal Tasks",
    title: "Baptismal certificates",
    item_type: "personal_task",
    sort_order: 103,
  },

  // ─── D-12: Personal Tasks — Pre-wedding Milestones (sort_order 110–112) ──────
  {
    category: "Personal Tasks",
    title: "Pre-Cana / marriage counseling seminar",
    item_type: "personal_task",
    sort_order: 110,
  },
  {
    category: "Personal Tasks",
    title: "Prenuptial agreement (if needed)",
    item_type: "personal_task",
    sort_order: 111,
  },
  {
    category: "Personal Tasks",
    title: "Prenuptial photoshoot",
    item_type: "personal_task",
    sort_order: 112,
  },

  // ─── D-12: Personal Tasks — Day-of Items (sort_order 120–124) ────────────────
  {
    category: "Personal Tasks",
    title: "Prepare vows",
    item_type: "personal_task",
    sort_order: 120,
  },
  {
    category: "Personal Tasks",
    title: "Wedding rings",
    item_type: "personal_task",
    sort_order: 121,
  },
  {
    category: "Personal Tasks",
    title: "Secondary sponsors list",
    item_type: "personal_task",
    sort_order: 122,
  },
  {
    category: "Personal Tasks",
    title: "Entourage assignments (principal sponsors, bridesmaids, groomsmen, flower girls, ring bearers)",
    item_type: "personal_task",
    sort_order: 123,
  },
]
