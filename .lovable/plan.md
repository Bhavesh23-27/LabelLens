# Fix the nullable FSSAI status type

## One micro-step
In the local `scan-screen.tsx`, change `statusColour` so its parameter accepts the status value produced by optional chaining:

```ts
function statusColour(
  status: NonNullable<MatchResult["match"]>["fssai"] | undefined,
) {
```

Keep this call unchanged:

```tsx
statusColour(item.match?.fssai)
```

The function's existing fallback branch will then style unmatched ingredients, while known ingredients retain their FSSAI-specific styling.

## Test
Run:

```powershell
npm run typecheck
```

Expected result: TypeScript finishes with zero errors. Reply `DONE` after it passes.