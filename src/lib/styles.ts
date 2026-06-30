/**
 * Premium design system theme styles for the BG-Jeck web application.
 * Centralizing these Tailwind classes ensures absolute design parity
 * and high consistency across Create, Update, Details, and List routes.
 */
export const themeStyles = {
  // 1. Glassmorphic Hero Headers
  glassHeader:
    "relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/60 to-zinc-950/20 border border-zinc-800/80 p-6 shadow-md backdrop-blur-md",
  glassHeaderOverlay:
    "absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-50",
  glassHeaderIconContainer:
    "p-1.5 bg-primary/10 rounded-md border border-primary/20",

  // 2. Customer Cards & Status Pills
  customerInfoBar:
    "flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl shadow-md gap-4 backdrop-blur-md print:bg-white print:border-zinc-300 print:shadow-none",
  activeBadge:
    "pl-1.5 pr-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 print:bg-transparent print:border-black print:text-black",
  inactiveBadge:
    "pl-1.5 pr-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wider uppercase bg-zinc-800 text-zinc-400 border-zinc-700 print:bg-transparent print:border-black print:text-zinc-600",

  // 3. Pulsing Transaction Type Badges
  badgeIn:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2.5 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider",
  badgeOut:
    "bg-rose-500/10 text-rose-400 border-rose-500/20 px-2.5 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider",

  // 4. General Dashboard Grid Cards
  cardBase:
    "bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl h-full flex flex-col relative overflow-hidden print:bg-white print:border-zinc-300 print:shadow-none rounded-xl",
  accentBarBlue:
    "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400/50 print:hidden",
  accentBarEmerald:
    "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400/50 print:hidden",
  accentBarPrimary:
    "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 print:hidden",
  accentBarZinc:
    "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-500 to-zinc-400/50 print:hidden",

  // 5. Ledger Summary Card Blocks
  ledgerCardBase:
    "p-3 bg-zinc-950/40 border border-zinc-800 transition-all rounded-xl flex flex-col justify-between h-20 shadow-inner print:border-zinc-300 print:bg-transparent",
  ledgerCardEmerald: "hover:border-emerald-500/20",
  ledgerCardPurple: "hover:border-purple-500/20",
  ledgerCardRose: "hover:border-rose-500/20",
  ledgerCardAmber: "hover:border-amber-500/20",
  ledgerCardBlue: "hover:border-blue-500/20",

  // 6. Action Button Alignment
  actionButtonBase:
    "h-9 border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer text-xs font-semibold",
  actionButtonDelete:
    "h-9 text-xs font-semibold transition-all border border-transparent border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 cursor-pointer",

  // 7. Premium Datagrid / Details Table Row & Headers
  tableHeaderRow: "bg-zinc-950/50 print:bg-zinc-100",
  tableRowInteractive:
    "border-b border-zinc-800/80 last:border-b-0 hover:bg-zinc-900/40 transition-colors group print:hover:bg-transparent print:border-zinc-200",
};
