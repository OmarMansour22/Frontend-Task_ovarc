# 📚 OVARC React Project

A small library & store management frontend built with **Vite + React + Tailwind**, supporting:

- Swappable **Mock API / Real Backend** via environment variables
- CRUD for **Books, Authors, Stores, Store Inventory**
- Sorting, searching, inline editing, and modal-based forms
- Simple **email/password authentication** with **Formik + Yup** validation
- Basic authorization: only logged-in users can modify data (add / edit / delete)

---

## 🚀 Tech Stack

- **Vite** – Fast dev server & bundler  
- **React + React Router v6** – SPA routing  
- **Tailwind CSS** – Utility-first styling  
- **Formik + Yup** – Forms & validation (Login / Register)  
- **Context API** – Simple client-side auth state (`AuthContext`)  
- **Mock JSON Server** – Optional mock backend during development  

---

## 🔧 Installation

```bash
npm install
````

---

## 🛠 Running the Project

### ▶️ Mode 1: Using the **Real Backend**

Make sure your `.env` file contains:

```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8080
VITE_MOCK_API_URL=http://localhost:4000
```

Then start the frontend:

```bash
npm run dev
```

The frontend will now call the **real backend API** at `VITE_API_URL`.

---

### ▶️ Mode 2: Using the **Mock Server**

Set in `.env`:

```env
VITE_USE_MOCK=true
VITE_API_URL=http://localhost:8080
VITE_MOCK_API_URL=http://localhost:4000
```

Start the mock server (JSON server):

```bash
npm run mock
```

Then in another terminal, start the frontend:

```bash
npm run dev
```

Now the app talks to the **mock JSON server** instead of the real backend.

---

### 🔁 API Switching Logic

All API calls go through a single config:

```js
// src/config/apiConfig.js
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const MOCK_URL = import.meta.env.VITE_MOCK_API_URL || "http://localhost:4000";
const REAL_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const API_BASE_URL = USE_MOCK ? MOCK_URL : REAL_URL;

export const apiFetch = (path, options = {}) => {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, options);
};
```

Every page imports:

```js
import { API_BASE_URL } from "../config/apiConfig";
```

so you don’t repeat this logic everywhere.

---

## 📁 Project Structure

```text
src/
  components/
    Header.jsx
    Modal.jsx
    Topbar.jsx
    Sidelist/
    Table/
      Table.jsx
    ActionButton/
      TableActions.jsx
    BooksTable.jsx
  context/
    AuthContext.jsx
  pages/
    Home.jsx
    Books.jsx
    Authors.jsx
    Stores.jsx
    Inventory.jsx      
    BrowseBooks.jsx
    BrowseAuthors.jsx
    BrowseStores.jsx
    Login.jsx
    Register.jsx
    NotFound.jsx
  config/
    apiConfig.js
  assets/
    usr.png
  main.jsx
  App.jsx
data/
  books.json
  authors.json
  stores.json
  inventory.json
```

---

## 🔐 Authentication & Authorization

The app uses a very simple **client-side auth**:

* State is managed via **`AuthContext`** (`src/context/AuthContext.jsx`)
* User object is stored in **React context** and persisted in `localStorage`
* **No real backend auth** – this is a front-end demo

### What authentication does

* On initial load, **no user is logged in**
* `Topbar`:

  * Shows a **“Sign in”** button when not authenticated
  * Shows **user avatar + email + Logout button** when authenticated
* If you are **not logged in**:

  * You can still **browse**:

    * Books
    * Authors
    * Stores
    * Store Inventory
  * But you **cannot add / edit / delete**:

    * No “Add” button for:

      * Authors page
      * Books page
      * Stores page
      * Store Inventory
    * No “Edit” / “Delete” actions on:

      * Authors table
      * Books table
      * Stores table
      * Store Inventory table
* Once **logged in**, all admin-style actions reappear:

  * Add / Edit / Delete authors
  * Add / Edit / Delete books
  * Add / Edit / Delete stores
  * Add / Edit (price) / Delete store inventory entries

The UI checks `isAuthenticated` from `AuthContext` to conditionally:

* Render action buttons and “Add” CTAs
* Guard modal opening and API calls (extra safety)

---

## 🧾 Forms & Validation (Formik + Yup)

Authentication forms use **Formik + Yup**:

### Login (`/login`)

* Fields:

  * `email` – required, valid email
  * `password` – required, min length constraint
* Validation:

  * Implemented via Yup schema
* On success:

  * Calls `login({ email })` from `AuthContext`
  * Saves user in context + `localStorage`
  * Redirects to home (`/`)

### Register (`/register`)

* Fields:

  * `email`
  * `password`
* Validation:

  * Email: must be valid & required
  * Password: minimum length requirement
* On submit:

  * Stores the user credentials locally (demo only)
  * Optionally auto-logs in the user
  * Redirects to home

> ⚠️ This is **not production authentication** — it’s only for the coding task to demonstrate form handling, validation, and conditional UI.

---

## 🧑‍💻 How to Register & Login (Demo Flow)

1. **Start the app** (mock or real backend as described above)
2. Go to **`/register`** or click **“Create account”** from the Login page:

   * Enter a valid email & password
   * Submit the form
3. After registration, you can log in from **`/login`**:

   * Use the same email/password combo
4. Once logged in:

   * Topbar will show:

     * User avatar
     * Your email
     * Logout button
   * Admin functionality is enabled:

     * “Add Author”, “Add Book”, “Add Store”, “Add to Inventory”
     * Edit / Delete buttons in tables

Logout simply clears the user from context and `localStorage`, and the UI goes back to browse-only mode.

---

## 🧩 Features by Page

### 🏬 Stores Page (`/stores`)

* Displays all stores with a computed full address
* Clicking a row navigates to **Store Inventory** (`/store/:storeId`)
* **Search**: filter stores by any field
* **Sorting**: handled by the reusable `Table` component
* **Authenticated only**:

  * Add new store (modal)
  * Edit store (modal)
  * Delete store

---

### 📘 Books Page (`/books`)

* List of all books
* Columns include:

  * Id, Name, ISBN, Language, Pages, Format, Author
* Uses `BooksTable` component to join books with authors
* **Search**:

  * Filter by any field (name, ISBN, language, etc.)
* **Sorting**:

  * Via the generic `Table` component
* **Authenticated only**:

  * Add Book (modal with full form)
  * Edit Book (modal)
  * Delete Book

---

### ✍️ Authors Page (`/author`)

* List of authors with:

  * Id, Name, Email, Nationality
* **Search + sort**
* **Authenticated only**:

  * “Add Author” button
  * Edit Author (modal)
  * Delete Author
* When not logged in:

  * Actions column is hidden
  * “Add Author” button is hidden

---

### 📦 Store Inventory Page (`/store/:storeId`)

This page is the core of the inventory requirement.

#### Tabs

* **Books** tab:

  * Shows all books available in the selected store
  * Columns: **Book Id, Name, Pages, Author, Price, Actions**
  * **Search**: search within this store only
  * **Sorting**: via `Table`
  * **Price editing**:

    * Inline editing on click (when logged in)
    * PUT request updates the inventory record
  * **Delete**:

    * Removes the book from this store inventory only

* **Authors** tab:

  * Groups inventory by author
  * Shows:

    * Author name
    * Number of books for that author in this store

#### Add to Inventory

* “Add to inventory” button (in `Header`)
* **Authenticated only**

  * When clicked:

    * Opens modal
    * Choose a book from dropdown
    * Set price
    * POST to `/inventory`
  * When not logged in:

    * Button still visible if you want, but click will show a message
      *(or you can hide it; implementation supports guarding the action)*

---

## 🔍 Search & Sorting

All main list views support:

* **Search bar**:

  * Authors
  * Books
  * Stores
  * Store inventory (Books tab)
* **Sort by clicking column headers**:

  * Implemented in the shared `Table` component
  * Works for all pages using the table: Authors, Books, Stores, Inventory

Search is implemented via `useMemo()` per page, filtering by all values in the row.

---

## 🧪 Mock API Data

When using the mock server, data is served from `data/`:

* `books.json`
* `authors.json`
* `stores.json`
* `inventory.json`

You can tweak these files to change the initial dataset.

---

## 📦 Production Build

```bash
npm run build
```

Then serve `dist/` with any static server.

---

## ✔️ Summary

This project demonstrates:

* Vite + React + Tailwind front-end architecture
* Reusable table, modal, and header components
* **Environment-based API switching** between mock and backend
* CRUD operations for **Books, Authors, Stores, Inventory**
* Search & sorting across all entity lists
* Store inventory view per store with full book details and price management
* **Client-side Authentication** with:

  * `AuthContext`
  * `Login` & `Register` pages
  * `Formik + Yup` validation
  * UI-level authorization (browse vs. admin actions)

Feel free to clone, run, and adapt as needed.

