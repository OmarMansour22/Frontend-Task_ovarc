// src/pages/Books.jsx
import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Loading from "./Loading";
import BooksTable from "../components/BooksTable";
import { useSearchParams } from "react-router-dom";
import Modal from "../components/Modal";
import { API_BASE_URL } from "../config/api";

const BASE_URL = API_BASE_URL;

const emptyBookForm = {
  author_id: "",
  name: "",
  isbn: "",
  language: "",
  page_count: "",
  format: "",
};

const Books = () => {
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [bookForm, setBookForm] = useState(emptyBookForm);
  const [editingBookId, setEditingBookId] = useState(null);

  // sync search from URL
  useEffect(() => {
    const search = searchParams.get("search") || "";
    setSearchTerm(search);
  }, [searchParams]);

  // fetch books + authors from mock server
  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/books`).then((r) => r.json()),
      fetch(`${BASE_URL}/authors`).then((r) => r.json()),
    ])
      .then(([booksData, authorsData]) => {
        setBooks(Array.isArray(booksData) ? booksData : [booksData]);
        setAuthors(Array.isArray(authorsData) ? authorsData : [authorsData]);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setBooks([]);
        setAuthors([]);
      });
  }, []);

  // search filter
  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim()) return books;
    const lower = searchTerm.toLowerCase();
    return books.filter((book) =>
      Object.values(book).some((v) => String(v).toLowerCase().includes(lower))
    );
  }, [books, searchTerm]);

  // open create modal
  const openCreateModal = () => {
    setBookForm(emptyBookForm);
    setEditingBookId(null);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setBookForm(emptyBookForm);
  };

  // open edit modal with selected book
  const openEditModal = (book) => {
    setEditingBookId(book.id);
    setBookForm({
      author_id: book.author_id ?? "",
      name: book.name ?? "",
      isbn: book.isbn ?? "",
      language: book.language ?? "",
      page_count: book.page_count ?? "",
      format: book.format ?? "",
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingBookId(null);
    setBookForm(emptyBookForm);
  };

  const handleFormChange = (field, value) => {
    setBookForm((prev) => ({ ...prev, [field]: value }));
  };

  // create new book
  const handleCreateBook = async () => {
    const { author_id, name, isbn, language, page_count, format } = bookForm;

    if (!author_id || !name || !isbn || !language || !page_count || !format) {
      alert("All fields are required");
      return;
    }

    const payload = {
      author_id: Number(author_id),
      name,
      isbn,
      language,
      page_count: Number(page_count),
      format,
    };

    try {
      const res = await fetch(`${BASE_URL}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create book");

      const created = await res.json();
      setBooks((prev) => [...prev, created]);
      closeCreateModal();
    } catch (err) {
      console.error("Error creating book:", err);
      alert("Failed to create book. Please try again.");
    }
  };

  // update existing book
  const handleUpdateBook = async () => {
    if (!editingBookId) return;

    const { author_id, name, isbn, language, page_count, format } = bookForm;

    if (!author_id || !name || !isbn || !language || !page_count || !format) {
      alert("All fields are required");
      return;
    }

    const existing = books.find((b) => String(b.id) === String(editingBookId));
    if (!existing) {
      alert("Book not found");
      return;
    }

    const payload = {
      ...existing,
      author_id: Number(author_id),
      name,
      isbn,
      language,
      page_count: Number(page_count),
      format,
    };

    try {
      const res = await fetch(`${BASE_URL}/books/${editingBookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update book");

      const updated = await res.json();

      setBooks((prev) =>
        prev.map((b) => (String(b.id) === String(editingBookId) ? updated : b))
      );
      closeEditModal();
    } catch (err) {
      console.error("Error updating book:", err);
      alert("Failed to update book. Please try again.");
    }
  };

  // delete book – receives the whole book object from BooksTable
  const deleteBook = async (book) => {
    const id = book.id;
    const name = book.name;

    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/books/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete book");

      setBooks((prevBooks) =>
        prevBooks.filter((b) => String(b.id) !== String(id))
      );
    } catch (err) {
      console.error("Error deleting book:", err);
      alert("Failed to delete book. Please try again.");
    }
  };

  return (
    <div className="py-6">
      <Header addNew={openCreateModal} title="Books List" />

      {books.length > 0 ? (
        <BooksTable
          books={filteredBooks}
          authors={authors}
          onEdit={openEditModal}
          onDelete={deleteBook}
        />
      ) : (
        <Loading />
      )}

      {/* Create Book Modal */}
      <Modal
        title="New Book"
        save={handleCreateBook}
        cancel={closeCreateModal}
        show={showCreateModal}
        setShow={setShowCreateModal}
      >
        <BookForm
          authors={authors}
          form={bookForm}
          onChange={handleFormChange}
        />
      </Modal>

      {/* Edit Book Modal */}
      <Modal
        title="Edit Book"
        save={handleUpdateBook}
        cancel={closeEditModal}
        show={showEditModal}
        setShow={setShowEditModal}
      >
        <BookForm
          authors={authors}
          form={bookForm}
          onChange={handleFormChange}
        />
      </Modal>
    </div>
  );
};

const BookForm = ({ authors, form, onChange }) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <label className="block text-gray-700 font-medium mb-1">
          Book Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="border border-gray-300 rounded p-2 w-full"
          placeholder="Enter Book Name"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-1">ISBN</label>
        <input
          type="text"
          value={form.isbn}
          onChange={(e) => onChange("isbn", e.target.value)}
          className="border border-gray-300 rounded p-2 w-full"
          placeholder="e.g. 247489521-3"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-1">Language</label>
        <input
          type="text"
          value={form.language}
          onChange={(e) => onChange("language", e.target.value)}
          className="border border-gray-300 rounded p-2 w-full"
          placeholder="e.g. English"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-1">
          Number of Pages
        </label>
        <input
          type="number"
          value={form.page_count}
          onChange={(e) => onChange("page_count", e.target.value)}
          className="border border-gray-300 rounded p-2 w-full"
          placeholder="Enter Page Count"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-1">Format</label>
        <input
          type="text"
          value={form.format}
          onChange={(e) => onChange("format", e.target.value)}
          className="border border-gray-300 rounded p-2 w-full"
          placeholder="e.g. paperback, hardcover, ebook"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-1">Author</label>
        <select
          value={form.author_id}
          onChange={(e) => onChange("author_id", e.target.value)}
          className="border border-gray-300 rounded p-2 w-full"
          required
        >
          <option value="" disabled>
            Select an Author
          </option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.first_name} {author.last_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Books;
