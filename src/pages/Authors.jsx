import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Loading from "./Loading";
import Table from "../components/Table/Table";
import { useSearchParams } from "react-router-dom";
import Modal from "../components/Modal";
import TableActions from "../components/ActionButton/TableActions";

import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

const Authors = () => {
  const { isAuthenticated } = useAuth();

  const [authors, setAuthors] = useState([]);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  // add / edit modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [newAuthor, setNewAuthor] = useState({
    first_name: "",
    last_name: "",
    email: "",
    nationality: "",
  });

  const [editingAuthor, setEditingAuthor] = useState(null);
  const [editAuthorForm, setEditAuthorForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    nationality: "",
  });

  // sync search from URL
  useEffect(() => {
    const search = searchParams.get("search") || "";
    setSearchTerm(search);
  }, [searchParams]);

  // initial fetch
  useEffect(() => {
    fetch(`${API_BASE_URL}/authors`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setAuthors(Array.isArray(data) ? data : [data]);
      })
      .catch((err) => {
        console.error("Error fetching authors:", err);
        setAuthors([]);
      });
  }, []);

  // search filter
  const filteredAuthors = useMemo(() => {
    if (!searchTerm.trim()) return authors;
    const lowerSearch = searchTerm.toLowerCase();
    return authors.filter((author) =>
      Object.values(author).some((value) =>
        String(value).toLowerCase().includes(lowerSearch)
      )
    );
  }, [authors, searchTerm]);

  // ---------- ADD AUTHOR ----------
  const openAddModal = () => {
    if (!isAuthenticated) return; // safety check
    setNewAuthor({
      first_name: "",
      last_name: "",
      email: "",
      nationality: "",
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const handleAddNew = async () => {
    const { first_name, last_name, email, nationality } = newAuthor;

    if (
      !first_name.trim() ||
      !last_name.trim() ||
      !email.trim() ||
      !nationality.trim()
    ) {
      alert(
        "All fields (first name, last name, email, nationality) are required"
      );
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/authors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: email.trim(),
          nationality: nationality.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to create author");

      const created = await res.json();
      setAuthors((prev) => [...prev, created]);
      setNewAuthor({
        first_name: "",
        last_name: "",
        email: "",
        nationality: "",
      });
      closeAddModal();
    } catch (err) {
      console.error("Error creating author:", err);
      alert("Failed to create author. Please try again.");
    }
  };

  // ---------- EDIT AUTHOR ----------
  const openEditModal = (author) => {
    if (!isAuthenticated) return; // safety
    setEditingAuthor(author);
    setEditAuthorForm({
      first_name: author.first_name || "",
      last_name: author.last_name || "",
      email: author.email || "",
      nationality: author.nationality || "",
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setEditingAuthor(null);
    setEditAuthorForm({
      first_name: "",
      last_name: "",
      email: "",
      nationality: "",
    });
    setShowEditModal(false);
  };

  const handleUpdateAuthor = async () => {
    if (!editingAuthor) return;

    const { first_name, last_name, email, nationality } = editAuthorForm;

    if (
      !first_name.trim() ||
      !last_name.trim() ||
      !email.trim() ||
      !nationality.trim()
    ) {
      alert(
        "All fields (first name, last name, email, nationality) are required"
      );
      return;
    }

    const payload = {
      ...editingAuthor,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim(),
      nationality: nationality.trim(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/authors/${editingAuthor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update author");

      const updated = await res.json();
      setAuthors((prev) =>
        prev.map((a) => (a.id === editingAuthor.id ? updated : a))
      );

      closeEditModal();
    } catch (err) {
      console.error("Error updating author:", err);
      alert("Failed to update author. Please try again.");
    }
  };

  // ---------- DELETE AUTHOR ----------
  const deleteAuthor = async (id, first_name, last_name) => {
    if (!isAuthenticated) return; // safety
    if (
      !window.confirm(
        `Are you sure you want to delete ${first_name} ${last_name}?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/authors/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete author");

      setAuthors((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Error deleting author:", err);
      alert("Failed to delete author. Please try again.");
    }
  };

  // ---------- TABLE COLUMNS ----------
  const columns = useMemo(() => {
    const baseColumns = [
      { header: "ID", accessorKey: "id" },
      {
        header: "Name",
        accessorFn: (row) => `${row.first_name} ${row.last_name}`,
        id: "name",
      },
      {
        header: "Email",
        accessorKey: "email",
      },
      {
        header: "Nationality",
        accessorKey: "nationality",
      },
    ];

    // Only show Actions column if user is logged in
    if (isAuthenticated) {
      baseColumns.push({
        header: "Actions",
        id: "actions",
        cell: ({ row }) => (
          <TableActions
            row={row}
            onEdit={() => openEditModal(row.original)}
            onDelete={() =>
              deleteAuthor(
                row.original.id,
                row.original.first_name,
                row.original.last_name
              )
            }
          />
        ),
      });
    }

    return baseColumns;
  }, [authors, isAuthenticated]);

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Header: only pass addNew if logged in */}
      {isAuthenticated && (
        <Header
          title="Authors List"
          addNew={isAuthenticated ? openAddModal : undefined}
        />
      )}

      {authors.length > 0 ? (
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-slate-100">
          <div className="">
            <Table data={filteredAuthors} columns={columns} />
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <Loading />
        </div>
      )}

      {/* ADD AUTHOR (only reachable when logged in, but still guarded by isAuthenticated above) */}
      <Modal
        title="New Author"
        save={handleAddNew}
        cancel={closeAddModal}
        show={showAddModal}
        setShow={setShowAddModal}
      >
        <div className="flex flex-col gap-4 w-full sm:grid sm:grid-cols-2 sm:gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">First Name</label>
            <input
              type="text"
              placeholder="First name"
              value={newAuthor.first_name}
              onChange={(e) =>
                setNewAuthor((prev) => ({
                  ...prev,
                  first_name: e.target.value,
                }))
              }
              className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Last Name</label>
            <input
              type="text"
              placeholder="Last name"
              value={newAuthor.last_name}
              onChange={(e) =>
                setNewAuthor((prev) => ({ ...prev, last_name: e.target.value }))
              }
              className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={newAuthor.email}
              onChange={(e) =>
                setNewAuthor((prev) => ({ ...prev, email: e.target.value }))
              }
              className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Nationality</label>
            <input
              type="text"
              placeholder="Nationality"
              value={newAuthor.nationality}
              onChange={(e) =>
                setNewAuthor((prev) => ({
                  ...prev,
                  nationality: e.target.value,
                }))
              }
              className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
        </div>
      </Modal>

      {/* EDIT AUTHOR */}
      <Modal
        title="Edit Author"
        save={handleUpdateAuthor}
        cancel={closeEditModal}
        show={showEditModal}
        setShow={setShowEditModal}
      >
        <div className="flex flex-col gap-4 w-full sm:grid sm:grid-cols-2 sm:gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">First Name</label>
            <input
              type="text"
              placeholder="First name"
              value={editAuthorForm.first_name}
              onChange={(e) =>
                setEditAuthorForm((prev) => ({
                  ...prev,
                  first_name: e.target.value,
                }))
              }
              className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Last Name</label>
            <input
              type="text"
              placeholder="Last name"
              value={editAuthorForm.last_name}
              onChange={(e) =>
                setEditAuthorForm((prev) => ({
                  ...prev,
                  last_name: e.target.value,
                }))
              }
              className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={editAuthorForm.email}
              onChange={(e) =>
                setEditAuthorForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Nationality</label>
            <input
              type="text"
              placeholder="Nationality"
              value={editAuthorForm.nationality}
              onChange={(e) =>
                setEditAuthorForm((prev) => ({
                  ...prev,
                  nationality: e.target.value,
                }))
              }
              className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Authors;
