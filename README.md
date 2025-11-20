
# 📚 OVARC React Project

A small library/store management frontend built with **Vite + React + Tailwind**, supporting mock API or real backend API via a simple environment variable.

This project includes pages for **Books**, **Authors**, **Stores**, and **Store Inventory**, with full CRUD actions, sorting, searching, inline editing, and modal workflows — all interchangeable between real backend or a mock server.

---

## 🚀 Tech Stack

* **Vite** — Fast development environment
* **React Router v6** — Client-side routing
* **Tailwind CSS** — Styling
* **Mock Service + Real Backend Toggle** — Swap between mock and backend using env variables

---

## 🔧 Installation

```bash
npm install
```

---

## 🛠 Running the Project

### ▶️ **Mode 1: Run using the REAL backend**

Make sure `.env` contains:

```
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8080
VITE_MOCK_API_URL=http://localhost:4000
```

Start normally:

```bash
npm run dev
```

Your frontend will now call the **real backend API**.

---

### ▶️ **Mode 2: Run using the MOCK server**

Make sure `.env` contains:

```
VITE_USE_MOCK=true
VITE_API_URL=http://localhost:8080
VITE_MOCK_API_URL=http://localhost:4000
```

Start mock server:

```bash
npm run mock
```

Then start frontend:

```bash
npm run dev
```

Now the frontend will use the **mock JSON server** for all data.

---

### API Switching Logic

The entire app uses a unified config:

```js
// src/config/apiConfig.js
export const API_BASE_URL = USE_MOCK ? MOCK_URL : REAL_URL;
```

Every page simply does:

```js
import { API_BASE_URL } from "../config/apiConfig";
```

No duplicate logic.

---

## 📁 Project Structure

```
src/
  pages/
    Books.jsx
    Authors.jsx
    Stores.jsx
    Inventory.jsx
    StoreDetails.jsx
  components/
    Table/
    TableActions/
    Modal/
    Header/
  config/
    apiConfig.js
  assets/
  styles/
data/ (mock JSON data)
```

---

## 🧩 Features by Page

### 🏬 **Stores Page**

* Displays all stores
* Row acts as a link to store details
* Sorting & Searching

---

### 📘 **Books Page**

* List of all books
* Shows pages, author name, availability
* Inline edit for title
* Delete action
* Sorting + search

---

### ✍️ **Authors Page**

* List of authors
* Add new author (modal)
* Edit author (modal)
* Delete author
* Search + sort

---

### 📦 **Store Inventory Page**

Fully functional inventory management:

#### Books Tab

* View all books available in that store
* Columns: **Book Id, Name, Pages, Author, Price, Actions**
* Inline or modal edit for price
* Delete removes the book from inventory
* Sorting on all columns
* Live search bar

#### Authors Tab

* Groups books by author
* Shows how many books each author has in the store

#### Add to Inventory

* Modal form
* Choose a book + set a price

---

## 🔍 Search & Sorting

The list tables support:

* Typing to search by **any field**
* Clicking a column header sorts ascending/descending
* Works for both authors, books, stores, and inventory

All implemented inside the reusable `<Table />` component.

---

## 🧪 Mock API Data

Located in `data/`:

* `books.json`
* `authors.json`
* `stores.json`
* `inventory.json`

Mock server auto-watches them.

---

## 📦 Production Build

```bash
npm run build
```

---

## ✔️ Summary

This project includes:

* Full CRUD support for books, authors, stores, and inventory
* Sorting & searching everywhere
* Modal and inline editing
* Ability to switch between backend & mock server
* Clean React Router page structure
* Tailwind UI


