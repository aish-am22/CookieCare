# Ask AI — UI Revert Summary

## What Was Reverted (Frontend Layout Only)

### AskAILawyer.tsx — UI Changes Reverted

1. **❌ Removed:** `showAdvancedOptions` state and collapsible "Advanced Options" section
   - Web Discovery Proxies is now **visible by default** again (as section "3. Web Discovery Proxies")
   - No longer collapsed or hidden

2. **❌ Removed:** Inline "Sources Used" section below answer
   - Sources are no longer displayed in a 2-column grid below the main answer

3. **✅ Restored:** Original right-side "Verified Sources Drawer" panel
   - Fixed width `w-80` panel on the right side
   - Shows "Verified Sources Drawer" header
   - Shows `{matchedSources.length} Hit` counter
   - Empty state: "Statutory provisions, court transcript records, and verified circular maps will manifest when research is initiated."
   - When sources exist: displays them in the right drawer with original styling

4. **✅ Restored:** Original section numbering
   - 1. Target Jurisdictions
   - 2. Custom Knowledge Base
   - 3. Web Discovery Proxies (no longer in Advanced Options)
   - 4. Output Framework Format

5. **✅ Restored:** Original 3-column layout
   - Left panel: controls and settings
   - Middle panel: main answer area
   - Right panel: sources drawer (always visible)

---

## What Was Preserved (Backend + Functional Improvements)

### Backend Files — 100% Unchanged

All backend improvements remain fully functional:

✅ **`backend/src/agents/askLawyerAgent.ts`**
- Jurisdiction awareness (jurisdictions injected into system prompt)
- Output format control (Brief Summary / Full IRAC / CREAC with structured instructions)
- Document-grounded system prompt with explicit grounding rules
- Source metadata return: `{ text: string, sources?: Array<{id, title, file_id, excerpt}> }`

✅ **`backend/src/agents/legalAgent.ts`**
- `askLawyer()` accepts `jurisdictions` and `outputFormat` parameters
- Passes source metadata to agent

✅ **`backend/src/services/jobQueue.ts`**
- Extracts `jurisdiction` and `outputFormat` from payload
- Passes them to orchestrator
- Returns `{ text, sources }` instead of just `{ text }`

### Frontend Functional Logic — Preserved

✅ **Sources handling logic in AskAILawyer.tsx**
- SSE job completion handler still extracts `sources` from `job.result.sources`
- Still populates `matchedSources` state when backend returns sources
- Sources now display in the **original right-side drawer** instead of inline

✅ **Payload construction**
- Frontend still sends `jurisdiction`, `outputFormat`, `webContext`, `documents` to backend
- All functional wiring intact

---

## Current State After Revert

### UI Layout
```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER                                   │
├──────────────┬────────────────────────────────┬─────────────────┤
│ LEFT PANEL   │   MAIN AREA                    │  RIGHT PANEL    │
│              │                                 │                 │
│ 1. Jurisd-   │   [Prompt Input]               │  VERIFIED       │
│    ictions   │                                 │  SOURCES        │
│              │   [Stepper/Status]             │  DRAWER         │
│ 2. Knowledge │                                 │                 │
│    Base      │   [Answer Display]             │  {X} Hit        │
│              │                                 │                 │
│ 3. Web       │                                 │  [Source cards  │
│    Discovery │                                 │   when          │
│    Proxies   │                                 │   available]    │
│              │                                 │                 │
│ 4. Output    │                                 │  [Empty state   │
│    Format    │                                 │   placeholder]  │
│              │                                 │                 │
└──────────────┴────────────────────────────────┴─────────────────┘
```

### Behavior
- **Jurisdictions:** ✅ Functional — sent to backend, affects answer
- **Knowledge Base:** ✅ Functional — documents retrieved via RAG
- **Web Discovery:** ❌ Still non-functional backend-wise, but **visible in UI** (not collapsed)
- **Output Format:** ✅ Functional — controls answer structure (IRAC/CREAC/Brief)
- **Sources Display:** ✅ Functional — populates in right drawer when backend returns sources

---

## Summary

**UI:** Reverted to original 3-column layout with permanent right-side sources drawer and visible Web Discovery section.

**Backend:** All improvements preserved — jurisdiction awareness, output format control, document grounding, source metadata return.

**Net Result:** Original Ask AI visual appearance + new improved backend behavior.

---

## Files Changed in This Revert

| File | Change |
|------|--------|
| `src/components/AskAILawyer.tsx` | Reverted UI simplification changes. Restored original layout with right drawer and visible Web Discovery. Sources handling logic preserved. |

**Diagnostics:** ✅ Clean (0 TypeScript errors)

---

## Testing Verification

After this revert, the Ask AI feature should:
- ✅ Look like the original UI (3-column layout, right drawer, Web Discovery visible)
- ✅ Behave with new improvements (jurisdiction-aware, format-controlled, document-grounded answers)
- ✅ Display sources in the right drawer when backend returns them
- ✅ Send jurisdiction and outputFormat to backend correctly
