// src/pages/Inventory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Loading from "./Loading";
import Modal from "../components/Modal";
import Table from "../components/Table/Table";
import TableActions from "../components/ActionButton/TableActions";

import { API_BASE_URL } from "../config/api";

const Inventory = () => {
  const { storeId } = useParams();
  const [searchParams] = useSearchParams();

  // UI state
  const [activeTab, setActiveTab] = useState("books");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Data state
  const [store, setStore] = useState(null);
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inline price edit state (books table)
  const [editingRowId, setEditingRowId] = useState(null); // inventory row id
  const [editPrice, setEditPrice] = useState("");

  // Add-to-inventory modal form
  const [modalBookId, setModalBookId] = useState("");
  const [modalPrice, setModalPrice] = useState("");

  // Edit-inventory modal form (edit all inputs: book + price)
  const [editForm, setEditForm] = useState({
    inventoryId: null,
    book_id: "",
    price: "",
  });

  // Search & sort for books tab
  const [booksSearch, setBooksSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "asc", // "asc" | "desc"
  });

  // Sync tab from ?view= query param (books / authors)
  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "authors" || view === "books") {
      setActiveTab(view);
    }
  }, [searchParams]);

  // Fetch store, books, authors, inventory
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [storeRes, booksRes, authorsRes, inventoryRes] =
          await Promise.all([
            fetch(`${API_BASE_URL}/stores/${storeId}`),
            fetch(`${API_BASE_URL}/books`),
            fetch(`${API_BASE_URL}/authors`),
            fetch(`${API_BASE_URL}/inventory`),
          ]);

        if (
          !storeRes.ok ||
          !booksRes.ok ||
          !authorsRes.ok ||
          !inventoryRes.ok
        ) {
          throw new Error("Failed to fetch data");
        }

        const [storeData, booksData, authorsData, inventoryData] =
          await Promise.all([
            storeRes.json(),
            booksRes.json(),
            authorsRes.json(),
            inventoryRes.json(),
          ]);

        if (!isMounted) return;

        setStore(storeData);
        setBooks(Array.isArray(booksData) ? booksData : [booksData]);
        setAuthors(Array.isArray(authorsData) ? authorsData : [authorsData]);
        setInventory(
          Array.isArray(inventoryData) ? inventoryData : [inventoryData]
        );
      } catch (err) {
        console.error("Error loading inventory page data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [storeId]);

  // Books available in this store with joined data
  const booksInStore = useMemo(() => {
    const filteredInv = inventory.filter(
      (item) => String(item.store_id) === String(storeId)
    );

    return filteredInv.map((invRow) => {
      const book = books.find((b) => String(b.id) === String(invRow.book_id));
      const author = book
        ? authors.find((a) => String(a.id) === String(book.author_id))
        : null;

      return {
        inventoryId: invRow.id, // used for edit/delete
        id: book?.id ?? invRow.book_id,
        name: book?.name ?? "Unknown book",
        page_count: book?.page_count ?? "",
        author_name: author
          ? `${author.first_name} ${author.last_name}`
          : "Unknown author",
        price: invRow.price,
      };
    });
  }, [inventory, books, authors, storeId]);

  // Authors that have books in this store (for Authors tab)
  const authorsInStore = useMemo(() => {
    const filteredInv = inventory.filter(
      (item) => String(item.store_id) === String(storeId)
    );

    const bookIds = new Set(
      filteredInv.map((invRow) => String(invRow.book_id))
    );

    const authorMap = new Map(); // id -> { name, booksCount }

    books.forEach((book) => {
      if (bookIds.has(String(book.id))) {
        const author = authors.find(
          (a) => String(a.id) === String(book.author_id)
        );
        if (!author) return;

        const key = String(author.id);
        if (!authorMap.has(key)) {
          authorMap.set(key, {
            id: author.id,
            name: `${author.first_name} ${author.last_name}`,
            booksCount: 0,
          });
        }
        const entry = authorMap.get(key);
        entry.booksCount += 1;
      }
    });

    return Array.from(authorMap.values());
  }, [inventory, books, authors, storeId]);

  // SEARCH + SORT for the Books tab
  const sortedAndFilteredBooks = useMemo(() => {
    let data = [...booksInStore];

    // Search by id / name / author
    if (booksSearch.trim()) {
      const term = booksSearch.toLowerCase();
      data = data.filter(
        (b) =>
          String(b.id).toLowerCase().includes(term) ||
          String(b.name).toLowerCase().includes(term) ||
          String(b.author_name).toLowerCase().includes(term)
      );
    }

    // Sort by selected column
    if (sortConfig.key) {
      const { key, direction } = sortConfig;
      data.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        // numeric vs string
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        let cmp;

        if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
          cmp = aNum - bNum;
        } else {
          cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""));
        }

        return direction === "asc" ? cmp : -cmp;
      });
    }

    return data;
  }, [booksInStore, booksSearch, sortConfig]);

  // Actions: Delete inventory row (remove book from store)
  const handleDeleteBookFromStore = async (row) => {
    const { inventoryId, name } = row;
    if (
      !window.confirm(
        `Are you sure you want to remove "${name}" from this store?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${inventoryId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete inventory item");

      setInventory((prev) =>
        prev.filter((item) => String(item.id) !== String(inventoryId))
      );
      if (editingRowId === inventoryId) {
        setEditingRowId(null);
        setEditPrice("");
      }
    } catch (err) {
      console.error("Error deleting inventory item:", err);
      alert("Failed to remove book from store. Please try again.");
    }
  };

  // Inline PRICE edit (click on price cell)
  const startEditPrice = (row) => {
    setEditingRowId(row.inventoryId);
    setEditPrice(String(row.price ?? ""));
  };

  const cancelEditPrice = () => {
    setEditingRowId(null);
    setEditPrice("");
  };

  const saveEditPrice = async (row) => {
    const inventoryId = row.inventoryId;
    const parsedPrice = Number(editPrice);

    if (Number.isNaN(parsedPrice)) {
      alert("Price must be a valid number");
      return;
    }

    // Try to find by id OR by (book_id, store_id)
    const existing = inventory.find(
      (item) =>
        String(item.id) === String(inventoryId) ||
        (String(item.book_id) === String(row.id) &&
          String(item.store_id) === String(storeId))
    );

    if (!existing) {
      console.error("Inventory record not found for:", {
        inventoryId,
        row,
        inventory,
      });
      alert(
        "Inventory record not found – check that your inventory data has an 'id' field."
      );
      return;
    }

    const payload = {
      ...existing,
      price: parsedPrice,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${existing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update price");

      const updated = await res.json();

      setInventory((prev) =>
        prev.map((item) =>
          String(item.id) === String(updated.id) ? updated : item
        )
      );
      setEditingRowId(null);
      setEditPrice("");
    } catch (err) {
      console.error("Error updating price:", err);
      alert("Failed to update price. Please try again.");
    }
  };

  // OPEN EDIT MODAL (edit all inputs: book + price)
  const openEditModal = (row) => {
    const inv = inventory.find(
      (item) => String(item.id) === String(row.inventoryId)
    );
    if (!inv) {
      alert("Inventory record not found");
      return;
    }
    setEditForm({
      inventoryId: inv.id,
      book_id: String(inv.book_id),
      price: String(inv.price ?? ""),
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditForm({
      inventoryId: null,
      book_id: "",
      price: "",
    });
  };

  const handleSaveEditModal = async () => {
    const { inventoryId, book_id, price } = editForm;
    if (!inventoryId) return;

    if (!book_id || !price) {
      alert("Please select a book and enter a price.");
      return;
    }

    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice)) {
      alert("Price must be a valid number");
      return;
    }

    const existing = inventory.find(
      (item) => String(item.id) === String(inventoryId)
    );
    if (!existing) {
      alert("Inventory record not found");
      return;
    }

    const payload = {
      ...existing,
      book_id: Number(book_id),
      price: parsedPrice,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${inventoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update inventory item");

      const updated = await res.json();

      setInventory((prev) =>
        prev.map((item) =>
          String(item.id) === String(inventoryId) ? updated : item
        )
      );
      closeEditModal();
    } catch (err) {
      console.error("Error updating inventory item:", err);
      alert("Failed to update inventory item. Please try again.");
    }
  };

  // Columns for Books tab
  const bookColumns = useMemo(
    () => [
      { header: "Book Id", accessorKey: "id" },
      { header: "Name", accessorKey: "name" },
      { header: "Pages", accessorKey: "page_count" },
      { header: "Author", accessorKey: "author_name" },
      {
        header: "Price",
        id: "price",
        cell: ({ row }) =>
          editingRowId === row.original.inventoryId ? (
            <input
              type="number"
              step="0.01"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              onBlur={() => saveEditPrice(row.original)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  saveEditPrice(row.original);
                } else if (e.key === "Escape") {
                  cancelEditPrice();
                }
              }}
              className="border border-gray-300 rounded p-1 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <span
              className="cursor-pointer"
              onClick={() => startEditPrice(row.original)}
              title="Click to edit price (inline)"
            >
              {row.original.price}
            </span>
          ),
      },
      {
        header: "Actions",
        id: "actions",
        cell: ({ row }) => (
          <TableActions
            row={row}
            // Edit button -> popup to edit all inputs
            onEdit={() => openEditModal(row.original)}
            // Delete button -> remove from store
            onDelete={() => handleDeleteBookFromStore(row.original)}
          />
        ),
      },
    ],
    [editingRowId, editPrice]
  );

  // Columns for Authors tab (simple)
  const authorColumns = useMemo(
    () => [
      { header: "Author", accessorKey: "name" },
      { header: "Books in Store", accessorKey: "booksCount" },
    ],
    []
  );

  // Modal controls: ADD
  const openAddModal = () => {
    setModalBookId("");
    setModalPrice("");
    setShowAddModal(true);
  };
  const closeAddModal = () => setShowAddModal(false);

  // Add book to inventory (store)
  const handleAddToInventory = async () => {
    if (!modalBookId || !modalPrice) {
      alert("Please select a book and enter a price.");
      return;
    }

    const payload = {
      store_id: Number(storeId),
      book_id: Number(modalBookId),
      price: Number(modalPrice),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add inventory record");

      const created = await res.json();
      setInventory((prev) => [...prev, created]);
      closeAddModal();
    } catch (err) {
      console.error("Error adding inventory record:", err);
      alert("Failed to add book to store. Please try again.");
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="py-6">
      {/* Tabs */}
      <div className="flex mb-4 w-full justify-center items-center">
        <button
          onClick={() => setActiveTab("books")}
          className={`px-4 border-b-2 py-2 ${
            activeTab === "books"
              ? "border-b-main text-main"
              : "border-b-transparent text-gray-500"
          }`}
        >
          Books
        </button>
        <button
          onClick={() => setActiveTab("authors")}
          className={`px-4 border-b-2 py-2 ${
            activeTab === "authors"
              ? "border-b-main text-main"
              : "border-b-transparent text-gray-500"
          }`}
        >
          Authors
        </button>
      </div>

      <Header
        addNew={openAddModal}
        title={`Store Inventory${store ? ` - ${store.name}` : ""}`}
        buttonTitle="Add to inventory"
      />

      {/* Books tab */}
      {activeTab === "books" ? (
        booksInStore.length > 0 ? (
          <>
            {/* Search + Sort controls */}
            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <input
                type="text"
                placeholder="Search books in this store (by id, name, author)..."
                value={booksSearch}
                onChange={(e) => setBooksSearch(e.target.value)}
                className="border border-gray-300 rounded p-2 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-main"
              />

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-700">Sort by:</span>
                <select
                  value={sortConfig.key}
                  onChange={(e) =>
                    setSortConfig((prev) => ({
                      ...prev,
                      key: e.target.value,
                    }))
                  }
                  className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-main"
                >
                  <option value="id">Book Id</option>
                  <option value="name">Name</option>
                  <option value="page_count">Pages</option>
                  <option value="author_name">Author</option>
                  <option value="price">Price</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setSortConfig((prev) => ({
                      ...prev,
                      direction: prev.direction === "asc" ? "desc" : "asc",
                    }))
                  }
                  className="border border-gray-300 rounded px-3 py-2 text-sm hover:bg-gray-100"
                >
                  {sortConfig.direction === "asc" ? "Asc ↑" : "Desc ↓"}
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <Table data={sortedAndFilteredBooks} columns={bookColumns} />
            </div>
          </>
        ) : (
          <p className="text-gray-600 mt-4">No books found in this store.</p>
        )
      ) : // Authors tab
      authorsInStore.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <Table data={authorsInStore} columns={authorColumns} />
        </div>
      ) : (
        <p className="text-gray-600 mt-4">
          No authors with books in this store.
        </p>
      )}

      {/* ADD inventory modal */}
      <Modal
        title="Add Book to Store Inventory"
        save={handleAddToInventory}
        cancel={closeAddModal}
        show={showAddModal}
        setShow={setShowAddModal}
      >
        <div className="flex flex-col gap-4 w-full">
          <div>
            <label
              htmlFor="book_select"
              className="block text-gray-700 font-medium mb-1"
            >
              Select Book
            </label>
            <select
              id="book_select"
              className="border border-gray-300 rounded p-2 w-full"
              value={modalBookId}
              onChange={(e) => setModalBookId(e.target.value)}
            >
              <option value="">Select a book</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="price"
              className="block text-gray-700 font-medium mb-1"
            >
              Price
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              className="border border-gray-300 rounded p-2 w-full"
              placeholder="Enter Price (e.g., 29.99)"
              value={modalPrice}
              onChange={(e) => setModalPrice(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* EDIT inventory modal */}
      <Modal
        title="Edit Book in Store Inventory"
        save={handleSaveEditModal}
        cancel={closeEditModal}
        show={showEditModal}
        setShow={setShowEditModal}
      >
        <div className="flex flex-col gap-4 w-full">
          <div>
            <label
              htmlFor="edit_book_select"
              className="block text-gray-700 font-medium mb-1"
            >
              Select Book
            </label>
            <select
              id="edit_book_select"
              className="border border-gray-300 rounded p-2 w-full"
              value={editForm.book_id}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  book_id: e.target.value,
                }))
              }
            >
              <option value="">Select a book</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="edit_price"
              className="block text-gray-700 font-medium mb-1"
            >
              Price
            </label>
            <input
              id="edit_price"
              type="number"
              step="0.01"
              className="border border-gray-300 rounded p-2 w-full"
              placeholder="Enter Price (e.g., 29.99)"
              value={editForm.price}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  price: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;
