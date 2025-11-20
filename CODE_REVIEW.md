Notes for Code Review

1. Feature-Based Structure Recommendation

- It would be better and more scalable to switch to a "feature-based folder structure" instead of the current component-based grouping.
- A feature-based structure organizes code by domain (e.g., `books/`, `stores/`, `authors/`) instead of UI elements.
- This makes the project easier to maintain, especially as it grows.
- Each feature can contain its own:

  - components
  - pages
  - hooks
  - utils
  - services (API calls)

- Example recommended structure:

  ```
  src/
    features/
      books/
        pages/
        components/
        hooks/
        services/
      stores/
        pages/
        components/
        services/
      authors/
        components/
    shared/
      components/
      hooks/
      utils/
  ```

---

2. Important Notes on Current Structure

- Components are currently grouped mainly by type (Cards, Tables, Buttons), which makes it harder to scale when features grow.
- Some components that belong to a specific domain (like `BookCard`, `BooksTable`) are placed inside general folders instead of a dedicated “Books” module.
- Reusable UI elements (Button, Modal, Layout, etc.) could be moved into a `shared/` or `common/` folder to separate them from domain-specific components.
- Adding `index.js` barrel files inside folders can simplify imports and make the structure cleaner.
- Pages are flat inside `/pages`, but they could be grouped under feature folders for improved organization.
- Hooks folder exists, but hooks related to specific features should ideally live inside their respective feature folders.

---

3. Books page (`Books.jsx`)

Issues / Risks

- All data-fetching logic is inside the page component; no reuse and harder to test.
- No error UI for failed fetches (only `console.error`).
- Local state is the only source of truth for IDs (new ID via `Math.max(...ids) + 1`), which will not scale once a real backend is used.
- Input validation is minimal; `alert` and `window.confirm` give poor UX and are hard to style.
- Search is implemented with `Object.values(book)` which can unintentionally search on internal fields and is inefficient for large datasets.
- Mixing responsibilities: the page handles fetching, filtering, CRUD logic and modal UI all in one component (violates SRP).
- Edit does not work correctly.

Suggested improvements

- Extract data fetching into a reusable hook, e.g. `useBooks()` / `useAuthors()` or a small data service layer.
- Show proper loading and error states (error message component) instead of only logging to the console.
- Replace `window.alert` / `window.confirm` with a custom confirmation / validation UI (modal or inline error text).
- Restrict search to specific fields (e.g. title, author, pages) instead of `Object.values`.
- Extract “add new book” form into its own component to keep the page component smaller and more readable.

---

4. Authors page (`Authors.jsx`)

Issues / Risks

- Same as Books: fetching is done directly in the component and errors are not surfaced to the user.
- `useMemo` dependencies for `columns` are wrong: it uses `[[editingRowId, editName]]` which creates a new array every render and defeats memoisation. Should be `[editingRowId, editName]`.
- Name parsing logic (`split(" ")` into first and last name) is fragile and will break on names with multiple spaces.
- ID generation is `authors.length + 1`, which will create duplicates when rows are deleted or data comes from a backend.
- Validation is incomplete: there is a hidden error message (`span` with `hidden`) but no logic to show it.
- Business logic (parsing names, CRUD, filtering) is tightly coupled to the component instead of being reusable.
- Edit does not work correctly.

Suggested improvements

- Fix the `useMemo` dependency array for `columns` to `[editingRowId, editName]`.
- Extract name parsing into a small helper function with better handling for multiple-word last names.
- Use a more robust ID strategy (backend-generated IDs or a UUID for mocked data).
- Implement visible validation feedback instead of a permanently hidden error `<span>`.
- As with Books, move data fetching and CRUD logic into a dedicated hook/service to make the page component primarily about rendering.
- Consider aligning the pattern with the Books page (either both use a shared generic table, or both use feature-specific tables) for consistency.

---
