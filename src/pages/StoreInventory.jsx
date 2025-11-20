// src/pages/Inventory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Loading from "./Loading";
import Modal from "../components/Modal";
import Table from "../components/Table/Table";
import TableActions from "../components/ActionButton/TableActions";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

const Inventory = () => {
  const { storeId } = useParams();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  // UI state
  const [activeTab, setActiveTab] = useState("books");
  const [showModal, setShowModal] = useState(false);

  // Data state
  const [store, setStore] = useState(null);
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inline edit state (price)
  const [editingRowId, setEditingRowId] = useState(null); // inventory row id
  const [editPrice, setEditPrice] = useState("");

  // "Add to inventory" modal form
  const [modalBookId, setModalBookId] = useState("");
  const [modalPrice, setModalPrice] = useState("");

  // Search term inside this store
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

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
  const booksInStoreRaw = useMemo(() => {
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

  // Search filter within this store
  const booksInStore = useMemo(() => {
    if (!searchTerm.trim()) return booksInStoreRaw;

    const lower = searchTerm.toLowerCase();
    return booksInStoreRaw.filter((b) =>
      Object.values(b).some((v) => String(v).toLowerCase().includes(lower))
    );
  }, [booksInStoreRaw, searchTerm]);

  // Authors that have books in this store (authors tab)
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

  // ---------- DELETE (only if logged in) ----------
  const handleDeleteBookFromStore = async (row) => {
    if (!isAuthenticated) {
      alert("You must be signed in to modify the inventory.");
      return;
    }

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

  // ---------- INLINE EDIT PRICE (only if logged in) ----------
  const startEditPrice = (row) => {
    if (!isAuthenticated) {
      alert("You must be signed in to edit prices.");
      return;
    }
    setEditingRowId(row.inventoryId);
    setEditPrice(String(row.price ?? ""));
  };

  const cancelEditPrice = () => {
    setEditingRowId(null);
    setEditPrice("");
  };

  const saveEditPrice = async (row) => {
    if (!isAuthenticated) {
      alert("You must be signed in to edit prices.");
      return;
    }

    const inventoryId = row.inventoryId;
    const parsedPrice = Number(editPrice);

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
      price: parsedPrice,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${inventoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update price");

      const updated = await res.json();

      setInventory((prev) =>
        prev.map((item) =>
          String(item.id) === String(inventoryId) ? updated : item
        )
      );
      setEditingRowId(null);
      setEditPrice("");
    } catch (err) {
      console.error("Error updating price:", err);
      alert("Failed to update price. Please try again.");
    }
  };

  // ---------- TABLE COLUMNS ----------
  const bookColumns = useMemo(() => {
    const cols = [
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
              className={isAuthenticated ? "cursor-pointer" : "text-gray-500"}
              onClick={
                isAuthenticated ? () => startEditPrice(row.original) : undefined
              }
              title={
                isAuthenticated
                  ? "Click to edit price"
                  : "Sign in to edit price"
              }
            >
              {row.original.price}
            </span>
          ),
      },
    ];

    // Only show Actions column if logged in
    if (isAuthenticated) {
      cols.push({
        header: "Actions",
        id: "actions",
        cell: ({ row }) => (
          <TableActions
            row={row}
            onEdit={
              editingRowId === row.original.inventoryId
                ? cancelEditPrice
                : () => startEditPrice(row.original)
            }
            onDelete={() => handleDeleteBookFromStore(row.original)}
          />
        ),
      });
    }

    return cols;
  }, [editingRowId, editPrice, isAuthenticated]);

  const authorColumns = useMemo(
    () => [
      { header: "Author", accessorKey: "name" },
      { header: "Books in Store", accessorKey: "booksCount" },
    ],
    []
  );

  // ---------- Modal controls (Add inventory – only if logged in) ----------
  const openModal = () => {
    if (!isAuthenticated) {
      alert("You must be signed in to add inventory.");
      return;
    }
    setModalBookId("");
    setModalPrice("");
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const handleAddToInventory = async () => {
    if (!isAuthenticated) {
      alert("You must be signed in to add inventory.");
      return;
    }

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
      closeModal();
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
      <div className="flex mb-4 w-full justify-center items-center gap-4">
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

      {/* Header: Add to inventory only when logged in */}
      {isAuthenticated && (
        <Header
          addNew={isAuthenticated ? openModal : undefined}
          title={`Store Inventory${store ? ` - ${store.name}` : ""}`}
          buttonTitle="Add to inventory"
        />
      )}

      {/* Search bar for books in this store */}
      {activeTab === "books" && (
        <div className="mt-4 mb-2 max-w-md">
          <input
            type="text"
            placeholder="Search books in this store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Books tab */}
      {activeTab === "books" ? (
        booksInStore.length > 0 ? (
          <div className="mt-2 overflow-x-auto">
            <Table data={booksInStore} columns={bookColumns} />
          </div>
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

      {/* Add inventory modal */}
      <Modal
        title="Add Book to Store Inventory"
        save={handleAddToInventory}
        cancel={closeModal}
        show={showModal}
        setShow={setShowModal}
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
    </div>
  );
};

export default Inventory;
