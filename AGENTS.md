<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Operating instructions for coding agents. Read this file before every task.

**Working code only. Finish the job. Plausibility is not correctness.**

---

## 0. Non-negotiables

These override everything else in this file when in conflict.

1. **No flattery, no filler.** No "Great question", "You're absolutely right", "I'd be happy to". Start with the answer or the action.
2. **Disagree when you disagree.** If the user's premise is wrong, say so before doing the work.
3. **Never fabricate.** Not file paths, commit hashes, API names, package versions, test results, or library functions. If you don't know, read the file, run the command, or say "I don't know, let me check."
4. **Stop when confused.** If the task has two plausible interpretations that change the output, ask. Do not pick silently.
5. **Touch only what you must.** Every changed line must trace to the request. No drive-by refactors, reformatting, or "while I was in there" cleanups.
6. **Never use `any`.** See section 5.
7. **Never claim done without running verification.** See section 4.
8. **Never `useState` for forms.** Use uncontrolled inputs (`FormData`, native `name` attributes) and Valibot schemas for validation. See section 6.

---

## 1. Before writing code

- State your plan in one or two sentences before editing. For non-trivial work, give a numbered list of steps, each with a verification check.
- Read the files you will touch and the files that call them.
- Match existing patterns in the codebase, even if you would do it differently in a greenfield repo.
- Check `package.json` for the installed versions of Next.js, React, TypeScript, and key libraries before using any API. Do not assume the latest version's behavior.
- Surface assumptions out loud: "I'm assuming X, Y, Z. Tell me if that's wrong."
- If two approaches exist, present both with tradeoffs. Exception: trivial tasks where the diff fits in one sentence.

---

## 2. Simplicity first

- Write the minimum code that solves the stated problem.
- No features beyond what was asked.
- No abstractions for single-use code. No config options, flags, or hooks nobody requested.
- No error handling for impossible states. Handle failures that can actually happen.
- No "for future extensibility". That is a future decision.
- If the solution is 200 lines and could be 50, rewrite it before showing it.
- Prefer deleting code to adding code.

Test: would a senior engineer reading the diff call it overcomplicated? If yes, simplify.

---

## 3. Surgical changes

- Do not improve adjacent code, comments, formatting, or imports outside the task.
- Do not delete pre-existing dead code. Mention it in the summary instead.
- Do clean up orphans your own change created (unused imports, variables, functions).
- Match the project's style exactly: indentation, quotes, naming, file layout.
- Do not upgrade, add, or remove dependencies unless the task requires it. If it does, say so and justify it.

Test: every changed line traces to the request. If one doesn't, revert it.

---

## 4. Goal-driven execution and verification

Turn vague asks into verifiable goals before starting:

- "Add validation" becomes "Write tests for invalid inputs (empty, malformed, oversized), then make them pass."
- "Fix the bug" becomes "Write a failing test that reproduces the symptom, then make it pass."
- "Refactor X" becomes "Existing tests pass before and after, no public API changes."
- "Make it faster" becomes "Measure the current path, find the bottleneck, change it, show the measurement improved."

For every task:

1. State success criteria before writing code.
2. Run, in order: type check, lint, relevant tests, build (for anything touching routing, config, or server/client boundaries).
3. Read the full output. Do not skim errors or stack traces.
4. If verification fails, fix the cause, not the test or the check.
5. For UI changes, verify visually or via a browser test. Describe what changed.

Never report "done" from a plausible-looking diff. Never suppress an error to make it go away (`@ts-ignore`, `eslint-disable`, empty `catch`, deleting the failing test).

If a check cannot be run, say so explicitly and say which one.

---

## 5. TypeScript rules

### Strictness

- `strict: true` must be on. Do not loosen `tsconfig` to make an error go away.
- Prefer also enabling `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, and `noFallthroughCasesInSwitch` when starting a project. Do not enable them in an existing project without being asked.

### Banned

- **`any`**: never, including in tests, mocks, and catch clauses. Use `unknown` and narrow, a generic, or a precise type.
- **`@ts-ignore`** and **`@ts-nocheck`**: never. `@ts-expect-error` only with a comment explaining why, and only when no typed fix exists.
- **Non-null assertion (`!`)**: avoid. Narrow with a check or throw a descriptive error. Allowed only when an invariant is guaranteed and a comment states it.
- **`as` type assertions to silence errors**: avoid. Never `as unknown as T`. Assertions are allowed only after real validation, or for `as const` and `satisfies`-style narrowing.
- **`enum`**: prefer string literal unions or `as const` objects. Avoid `const enum`.
- **`Function`, `Object`, `{}` as types**: use specific signatures or `Record<string, unknown>`.
- **Default exports** for non-framework files: use named exports. Next.js requires default exports for `page`, `layout`, `route` handlers config, etc. Keep those.

### Prefer

- **`unknown` over `any`** for untrusted data, then narrow with type guards or a schema.
- **Validate at boundaries.** All external data (API responses, `request.json()`, `searchParams`, form data, env vars, `localStorage`, webhooks) is `unknown` until parsed with a schema library already in the project (Zod, Valibot, etc.). Infer types from the schema: `type User = z.infer<typeof UserSchema>`.
- **`satisfies`** to check a value against a type without widening it.
- **Discriminated unions** for state: `{ status: 'loading' } | { status: 'error'; error: Error } | { status: 'success'; data: T }`. No parallel booleans like `isLoading` + `isError` + `data?`.
- **Exhaustive checks**: in `switch` over unions, add a `default` branch that assigns to `never`.
- **`readonly`** and `as const` for data that should not mutate. Use `ReadonlyArray<T>` for function params that don't mutate.
- **`import type`** for type-only imports (`verbatimModuleSyntax` or `consistent-type-imports` lint rule).
- **`interface`** for object shapes that may be extended; **`type`** for unions, intersections, mapped, and utility types. Follow whichever the project already uses.
- **Utility types** (`Pick`, `Omit`, `Partial`, `Required`, `ReturnType`, `Awaited`) over duplicating shapes.
- **Explicit return types** on exported functions and public module APIs. Let inference work for local variables and callbacks.
- **Branded types** for IDs that must not be mixed (`UserId` vs `OrderId`) when the project already has a pattern for it.
- **Narrowing over casting**: `typeof`, `in`, `instanceof`, user-defined guards (`x is T`), assertion functions.
- **`catch (e: unknown)`**: narrow with `e instanceof Error` before reading `.message`.
- **`Promise<T>` return types** on async functions. Never leave floating promises: `await`, `return`, or `void` with a comment.
- **`Record<K, V>`** with a literal union for K when keys are known. Avoid index signatures when keys are finite.
- **Generics**: constrain them (`T extends object`). Do not use a generic when a concrete type works.

### Naming and style

- Follow the repo's naming. Default: `camelCase` for values, `PascalCase` for types/components, `SCREAMING_SNAKE_CASE` only for true constants.
- No `I` prefix on interfaces, no `T` prefix on types.
- Prefer `unknown`-returning parsers over functions that return `T` by trust.
- Prefer `===` and `!==`. Use `??` and `?.` instead of `||` and manual null checks when the intent is nullish.

---

## 6. React rules

### Components

- Function components only. No class components in new code.
- One component per file unless tiny and private to that file.
- Props: define an explicit `type Props = {...}`. No `React.FC`. Destructure in the signature.
- Keep components small and single-purpose. Extract when a component has more than one reason to change.
- No business logic in JSX. Compute above the return.
- Never define a component inside another component's body. It remounts on every render and destroys state.
- Do not mutate props or state. Create new objects and arrays.

### State

- Keep state minimal. If a value can be derived from props or other state during render, derive it. Do not store it in state and sync with an effect.
- Put state as low as possible, and lift only when two siblings need it.
- Use `useReducer` or a discriminated union when state transitions are related.
- Use the functional updater (`setX(prev => ...)`) when the next value depends on the previous.
- Use `key` to reset component state, not an effect that clears it.
- Do not put server data into client state. Use the data layer already in the project (server components, TanStack Query, SWR, etc.).

### Effects

- Effects are for synchronizing with external systems (DOM APIs, subscriptions, timers, network on the client). Not for deriving state, not for handling events, not for chaining state updates.
- User actions belong in event handlers, not effects.
- Every effect with a subscription, timer, or listener returns a cleanup.
- Dependency arrays must be complete. Never disable `react-hooks/exhaustive-deps`. If the lint rule is annoying, the design is wrong.
- Fetching in effects needs abort/ignore handling to avoid race conditions. Prefer a data library or a server component over a raw `useEffect` fetch.

### Lists and keys

- Stable, unique `key` from the data (an ID). Never use array index as key for lists that reorder, insert, or delete. Never use `Math.random()`.

### Hooks

- Custom hooks start with `use` and encapsulate one concern.
- Do not call hooks conditionally or in loops.
- Check whether the React Compiler is enabled before adding memoization (see section 8).

### Forms and events

- **Never use `useState` to handle forms.** Use uncontrolled inputs with native `name` attributes and extract values via `new FormData(e.currentTarget)`. Controlled inputs re-render on every keystroke and storing form input values in component state is strictly forbidden.
- **Valibot for all form validation.** Always define a Valibot schema (e.g. in `src/lib/schemas/`) and validate form submissions at the boundary with `v.safeParse(Schema, ...)`.
- Type event handlers precisely (`React.FormEvent<HTMLFormElement>`, `React.ChangeEvent<HTMLInputElement>`), not `any`.

### Error handling

- Add error boundaries around independently failing UI regions. In Next.js App Router use `error.tsx`.
- Do not swallow errors in `catch`. Surface, log, or rethrow with context.

---

## 7. Next.js rules

Check the installed Next.js version first. Behavior differs between 13, 14, 15, and 16 (caching defaults, async request APIs, `params` typing). Do not assume.

### Server vs client

- **Default to Server Components.** Add `'use client'` only for state, effects, event handlers, browser APIs, or client-only libraries.
- Push `'use client'` to the smallest leaf possible. Do not mark a whole page or layout as client to use one `useState`.
- Do not import server-only code into client components. Mark secrets-touching modules with `import 'server-only'`.
- Props passed from server to client components must be serializable. No functions, class instances, or Dates you expect to stay Dates.
- Never read `process.env.X` in client code unless it is prefixed `NEXT_PUBLIC_` and genuinely public. Never put secrets in `NEXT_PUBLIC_` vars.
- Validate env vars at startup with a schema. Do not scatter `process.env.X!` through the code.

### Data fetching and caching

- Fetch data in Server Components, as close to where it is used as possible. Avoid client-side waterfalls.
- Parallelize independent requests with `Promise.all`. Do not `await` sequentially when requests don't depend on each other.
- Start fetches early, await late, to avoid request waterfalls.
- Deduplicate repeated reads in one render pass with React `cache()` for non-`fetch` data sources.
- Be explicit about caching on every `fetch`: `cache`, `next.revalidate`, or `next.tags`, according to the installed version's defaults.
- Use `revalidateTag` / `revalidatePath` after mutations. Do not rely on stale cache.
- Use Suspense boundaries with `loading.tsx` or `<Suspense>` to stream slow parts. Do not block the whole page on the slowest query.
- In newer versions, `params`, `searchParams`, `cookies()`, and `headers()` are async. Await them. Reading them opts the route into dynamic rendering. Do it only where needed.

### Mutations and APIs

- Use Server Actions or Route Handlers consistently with what the repo already does.
- **Treat every Server Action and Route Handler as a public endpoint.** Authenticate, authorize, and validate input in each one. Do not rely on the UI hiding a button.
- Return typed, serializable results from actions. Do not throw raw errors to the client.
- Use `useActionState` / `useFormStatus` / `useOptimistic` (React 19) for pending and optimistic UI when available.

### Routing and rendering

- Use `next/link` for internal navigation, not `<a>`.
- Use `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`) in App Router, not `next/router`.
- `useSearchParams` in a client component needs a Suspense boundary or it de-opts the route.
- Prefer static rendering and ISR where data allows. Use `generateStaticParams` for known dynamic routes.
- Set `metadata` / `generateMetadata` on pages. Include title, description, and Open Graph where public.
- Use `notFound()` and `redirect()` from the framework. Do not return fake 200 responses for missing data.
- Use `middleware` (or `proxy`, per version) only for cheap, edge-safe logic. No heavy imports, no database calls.

### Assets

- **Images:** always `next/image`, with `width`/`height` or `fill` + `sizes`. Add `priority` only to the LCP image. Configure `remotePatterns` for remote hosts.
- **Fonts:** `next/font`. Never load fonts through a `<link>` in the head or a CSS `@import`.
- **Scripts:** `next/script` with the right `strategy` (`afterInteractive`, `lazyOnload`). No raw `<script>` tags for third parties.

---

## 8. Performance rules

- Measure before optimizing. Do not add memoization, dynamic imports, or caching without a reason you can state. State the measurement or the specific symptom.
- For any function use object based param passing and not a single unnammed parament,

### Bundle and loading

- Import only what you use. Avoid barrel-file imports from large libraries (`import { x } from 'lodash'`). Use `lodash-es`, per-module imports, or `optimizePackageImports` in the Next config.
- Dynamic import (`next/dynamic`, `React.lazy`) for heavy, below-the-fold, or interaction-gated components (charts, editors, modals, maps).
- Disable SSR (`ssr: false`) only for components that truly cannot render on the server, and only inside a client component.
- Do not add a dependency for something a few lines of code or the platform can do. Check bundle size before adding one.
- Keep server-only heavy libraries out of client bundles.
- Never ship a source map or dev-only code in production output.

### Rendering

- **Check whether the React Compiler is enabled.** If it is, do not add `useMemo`, `useCallback`, or `React.memo` by default. If it is not, use them only where profiling shows a problem or where referential stability is required (effect deps, memoized child props, context values).
- Context values must be memoized or stable. Split contexts by update frequency. Do not put fast-changing state in a context consumed by many components.
- Subscribe to the smallest slice of state (selectors in Zustand, Redux, Jotai, etc.). Do not subscribe components to the whole store.
- Use `useTransition` / `useDeferredValue` to keep input responsive during expensive updates.
- Virtualize long lists (hundreds of rows or more) with the library already in the project, or `react-window` / `@tanstack/react-virtual`.
- Avoid creating new object, array, or function literals in props of memoized children or in hook dependency arrays.
- Avoid layout thrash: batch DOM reads and writes. Do not read layout (`offsetHeight`, `getBoundingClientRect`) inside render or in loops after writes.
- Debounce or throttle high-frequency handlers (scroll, resize, input-driven search). Prefer `IntersectionObserver` over scroll listeners.
- Prefer CSS (transform, opacity) for animations. Do not animate layout properties.

### Network and data

- Avoid request waterfalls. Parallelize independent calls, prefetch likely navigation targets, and fetch on the server when possible.
- Select only the fields you need from the database or API. No `SELECT *` and no over-fetching nested relations.
- Paginate or cursor-paginate unbounded lists. No unbounded queries.
- Avoid N+1 queries. Batch, join, or use a loader.
- Add indexes for columns used in `WHERE`, `JOIN`, and `ORDER BY` on large tables. State the migration.
- Use HTTP caching headers and `stale-while-revalidate` where appropriate.
- Cancel in-flight requests when no longer needed (`AbortController`).

### Core Web Vitals

- **LCP:** preload / `priority` the hero image, no render-blocking requests, server-render above-the-fold content.
- **CLS:** reserve space for images, embeds, and async content. Set explicit dimensions.
- **INP:** keep handlers fast, defer non-urgent work, break up long tasks, avoid heavy synchronous work on click.

---

## Function parameters: named object params

Every function takes a single destructured object. No positional parameters, and no single unnamed parameter.

### Rules

- Define an explicit named type for the params and destructure in the signature.
- Name the type `<FunctionName>Params` (e.g. `GetUserParams`). Export it when callers outside the file need it.
- Apply this to single-parameter functions too: `getUser({ id })`, not `getUser(id)`.
- Optional params are optional properties on the object. Set defaults in the destructuring: `{ limit = 20 }`.
- Do not mix positional and object params (`fn(id, { force })`). Everything goes in the object.
- Do not use `...args` or `arguments`. Name each input.
- Do not pass `undefined` or `null` as placeholders for skipped params. Omit the key.
- Keep call sites readable. Pass named properties, or spread a pre-built object, never an anonymous bag of values.
- Return types stay explicit on exported functions (see TypeScript rules).

### Good

```ts
type CreateOrderParams = {
  userId: UserId;
  items: ReadonlyArray<OrderItem>;
  couponCode?: string;
};

export async function createOrder({
  userId,
  items,
  couponCode,
}: CreateOrderParams): Promise<Order> {
  // ...
}

const order = await createOrder({ userId, items });
```

```ts
type GetUserParams = { id: UserId };

export function getUser({ id }: GetUserParams): Promise<User | null> {
  // ...
}
```

### Bad

```ts
export async function createOrder(
  userId: UserId,
  items: OrderItem[],
  couponCode?: string
) {}
export function getUser(id: UserId) {}
export function paginate(page = 1, limit = 20, sort?: string) {}
```

### Exceptions (signatures you do not control)

- React components: props are already a single object. Follow the Props rule in the React section.
- Next.js framework entry points: `page`, `layout`, `generateMetadata`, `generateStaticParams`, route handlers `(request, context)`, `middleware`. Match the framework signature exactly.
- Inline callbacks passed to built-ins and libraries that dictate the shape: `map`, `filter`, `reduce`, `sort`, `forEach`, event handlers, `Promise` executors, `setState` updaters, and `useEffect` callbacks.
- Overriding or implementing an external interface or library callback type.
- Zero-parameter functions.

When you wrap a framework or library callback, keep its signature at the boundary and call your own functions with an object inside:

```ts
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return getUserResponse({ id, request });
}
```

### Why

Named params make call sites self-documenting, make argument order irrelevant, and let you add optional fields without breaking existing callers. If a function with positional params already exists and the task does not touch it, leave it alone (see Surgical changes). Only convert it when you are already modifying its signature.

## 9. Security

- No secrets in code, logs, client bundles, or commits. Use env vars and the project's secret manager.
- Validate and sanitize all input on the server, even if the client validates.
- Never build SQL, shell commands, or file paths from raw user input. Use parameterized queries and an ORM's safe APIs.
- Never use `dangerouslySetInnerHTML` with unsanitized content. If unavoidable, sanitize with a vetted library and say why.
- Check authorization on every mutation and every sensitive read, not just authentication. Check ownership of the resource.
- Do not log PII, tokens, or full request bodies.
- Set cookies `httpOnly`, `secure`, and `sameSite` as appropriate. Do not store auth tokens in `localStorage`.
- Do not disable CSRF, CORS, or TLS checks to make something work.
- Do not add a dependency without checking it is maintained and necessary. Pin versions as the project does.

---

## 10. Accessibility

- Use semantic HTML (`button`, `a`, `nav`, `main`, `label`, `ul`) before reaching for `div` + ARIA.
- Every interactive element is keyboard reachable and has a visible focus state. No `div onClick`.
- Every input has an associated `<label>`. Every image has meaningful `alt` (or `alt=""` if decorative).
- Do not rely on color alone to convey meaning. Maintain contrast.
- Manage focus on route changes, modals, and dialogs. Use the project's existing dialog primitive.
- Respect `prefers-reduced-motion`.

---

## 11. Testing

- Test behavior, not implementation. Query by role, label, or text, not by class names or internal state.
- Use the test framework already in the repo. Do not add a second one.
- A bug fix includes a regression test that fails before the fix and passes after.
- Do not mock what you can run for real. Mock at network and time boundaries only.
- No snapshot tests for large trees. Assert specific things.
- Tests must be deterministic. No real timers, random data, or network calls without control.
- Never delete or weaken a test to make it pass. If a test is wrong, explain why before changing it.
- Typed mocks: no `as any` in tests either.

---

## 12. Git and commits

- Do not commit, push, or open PRs unless asked.
- Commit message: subject under 72 characters in imperative mood, body explains why. No "update file", "fix bug", or "changes".
- One logical change per commit.
- Never force-push, rewrite shared history, or skip hooks (`--no-verify`) without explicit instruction.
- Do not commit generated files, build output, `.env` files, or lockfile changes unrelated to the task.

---

## 13. Communication

- Direct, not diplomatic. "This won't scale because X" beats "That's an interesting approach, but...".
- Concise by default: two or three short paragraphs unless asked for depth. No restating the question, no ceremonial closing.
- When a question has a clear answer, give it. When it doesn't, say so and give your best read on the tradeoffs.
- No excessive bullets, no unprompted headers, no emoji in chat responses.
- End each task with a short summary: what changed, what was verified (and how), what was not verified, and anything noticed but intentionally left alone.
- Report failures plainly. Do not bury a failing check in a success message.

---

## 14. When to ask, when to proceed

**Ask first when:**

- The request has two plausible interpretations and the choice materially changes the output.
- The change touches something load-bearing: auth, payments, database schema or migrations, public APIs, build config, CI.
- You need a credential, secret, or production resource you don't have.
- The literal request conflicts with the user's stated goal.
- The change is destructive or irreversible (deleting data, dropping tables, rewriting history).

**Proceed without asking when:**

- The task is trivial and reversible (typo, rename a local, add a log line).
- The ambiguity can be resolved by reading the code or running a command.
- The user already answered the question earlier in the session.

---

## 15. Session hygiene

- After two failed attempts at the same problem, stop. Summarize what you learned and ask for direction instead of looping.
- Prefer targeted file reads and single-test runs while iterating. Run the full suite once at the end.
- Do not paste large files or full logs back to the user. Quote the relevant lines.

---

## 16. Project context

Fill this in per project. Keep it specific. Delete what doesn't apply.

### Stack

- Node version:
- TypeScript version:
- Next.js version and router (App / Pages):
- React version (and React Compiler on/off):
- Package manager:
- Styling (Tailwind, CSS Modules, etc.):
- Data layer (ORM, query library, state library):
- Validation library:
- Deployment target:

### Commands

- Install: `TODO`
- Dev: `TODO`
- Build: `TODO`
- Test (all): `TODO`
- Test (single file): `TODO`
- Lint: `TODO`
- Typecheck: `TODO`
- Format: `TODO`

### Layout

- Source lives in: `TODO`
- Tests live in: `TODO`
- Shared components: `TODO`
- Do not modify: `TODO` (generated code, vendored deps, legacy areas)

### Conventions

- Naming: `TODO`
- Import aliases: `TODO`
- Error handling pattern: `TODO`
- API / action response shape: `TODO`
- Testing pattern: `TODO`

### Forbidden

- `TODO`: things that look reasonable but break this project.

---

## 17. Project learnings

When the user corrects your approach, append a one-line rule here before ending the session. Write it concretely ("Always use X for Y"), never abstractly. If a line already covers it, tighten that line instead. Remove lines when the underlying issue goes away.
