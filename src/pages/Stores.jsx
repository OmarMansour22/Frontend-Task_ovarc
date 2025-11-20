// src/pages/Stores.jsx
import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Loading from "./Loading";
import Table from "../components/Table/Table";
import { useSearchParams, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import TableActions from "../components/ActionButton/TableActions";

import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

const emptyStoreForm = {
  name: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  zip: "",
};

const Stores = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // 🔐 auth state

  const [stores, setStores] = useState([]);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [newStore, setNewStore] = useState(emptyStoreForm);
  const [editingStore, setEditingStore] = useState(null);
  const [editStoreForm, setEditStoreForm] = useState(emptyStoreForm);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    setSearchTerm(search);
  }, [searchParams]);

  // Fetch from backend / mock
  useEffect(() => {
    fetch(`${API_BASE_URL}/stores`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setStores(Array.isArray(data) ? data : [data]);
      })
      .catch((err) => {
        console.error("Error fetching stores:", err);
        setStores([]);
      });
  }, []);

  const buildFullAddress = (storeLike) => {
    const { address_1, address_2, city, state, zip } = storeLike;
    const parts = [
      address_1,
      address_2 || null,
      city && `${city}`,
      state && `${state} ${zip || ""}`.trim(),
    ].filter(Boolean);
    return parts.join(", ");
  };

  // Enrich with full_address for table & search
  const filteredStores = useMemo(() => {
    const enriched = stores.map((store) => ({
      ...store,
      full_address: store.full_address || buildFullAddress(store),
    }));

    if (!searchTerm.trim()) return enriched;

    const lower = searchTerm.toLowerCase();
    return enriched.filter((store) =>
      Object.values(store).some((value) =>
        String(value).toLowerCase().includes(lower)
      )
    );
  }, [stores, searchTerm]);

  const handleViewStoreInventory = (storeId) => {
    // Browsing inventory is allowed even if not logged in
    navigate(`/store/${storeId}`);
  };

  const onRowClick = (_e, row) => {
    handleViewStoreInventory(row.id);
  };

  // ---------- TABLE COLUMNS ----------
  const columns = useMemo(() => {
    const baseColumns = [
      { header: "Store Id", accessorKey: "id" },
      { header: "Name", accessorKey: "name" },
      { header: "Address", accessorKey: "full_address" },
    ];

    // Only show Actions column if logged in
    if (isAuthenticated) {
      baseColumns.push({
        header: "Actions",
        id: "actions",
        cell: ({ row }) => (
          <TableActions
            row={row}
            onEdit={() => openEditModal(row.original)}
            onDelete={() => deleteStore(row.original.id, row.original.name)}
          />
        ),
      });
    }

    return baseColumns;
  }, [stores, isAuthenticated]);

  // ---------- ADD STORE ----------
  const handleAddNew = async () => {
    if (!isAuthenticated) return; // safety check

    const { name, address_1, city, state, zip } = newStore;

    if (
      !name.trim() ||
      !address_1.trim() ||
      !city.trim() ||
      !state.trim() ||
      !zip.trim()
    ) {
      alert("Name, Address 1, City, State, and Zip are required.");
      return;
    }

    const maxId =
      stores.length > 0
        ? Math.max(...stores.map((s) => parseInt(s.id, 10) || 0))
        : 0;

    const payload = {
      id: String(maxId + 1),
      name: newStore.name.trim(),
      address_1: newStore.address_1.trim(),
      address_2: newStore.address_2.trim() || null,
      city: newStore.city.trim(),
      state: newStore.state.trim(),
      zip: newStore.zip.trim(),
    };

    payload.full_address = buildFullAddress(payload);

    try {
      const res = await fetch(`${API_BASE_URL}/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create store");

      const created = await res.json();
      setStores((prev) => [...prev, created]);

      setNewStore(emptyStoreForm);
      setShowAddModal(false);
    } catch (err) {
      console.error("Error creating store:", err);
      alert("Failed to create store. Please try again.");
    }
  };

  const deleteStore = async (id, name) => {
    if (!isAuthenticated) return; // safety check

    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/stores/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete store");

      setStores((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Error deleting store:", err);
      alert("Failed to delete store. Please try again.");
    }
  };

  // ---------- EDIT STORE ----------
  const openEditModal = (store) => {
    if (!isAuthenticated) return; // safety

    setEditingStore(store);
    setEditStoreForm({
      name: store.name || "",
      address_1: store.address_1 || "",
      address_2: store.address_2 || "",
      city: store.city || "",
      state: store.state || "",
      zip: store.zip || "",
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setEditingStore(null);
    setEditStoreForm(emptyStoreForm);
    setShowEditModal(false);
  };

  const handleUpdateStore = async () => {
    if (!isAuthenticated) return; // safety
    if (!editingStore) return;

    const { name, address_1, city, state, zip } = editStoreForm;

    if (
      !name.trim() ||
      !address_1.trim() ||
      !city.trim() ||
      !state.trim() ||
      !zip.trim()
    ) {
      alert("Name, Address 1, City, State, and Zip are required.");
      return;
    }

    const payload = {
      ...editingStore,
      name: editStoreForm.name.trim(),
      address_1: editStoreForm.address_1.trim(),
      address_2: editStoreForm.address_2.trim() || null,
      city: editStoreForm.city.trim(),
      state: editStoreForm.state.trim(),
      zip: editStoreForm.zip.trim(),
    };

    payload.full_address = buildFullAddress(payload);

    try {
      const res = await fetch(`${API_BASE_URL}/stores/${editingStore.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update store");

      const updated = await res.json();

      setStores((prev) =>
        prev.map((s) => (s.id === editingStore.id ? updated : s))
      );
      closeEditModal();
    } catch (err) {
      console.error("Error updating store:", err);
      alert("Failed to update store. Please try again.");
    }
  };

  return (
    <div className="py-6">
      {/* Header: only pass addNew if logged in, so button hides when logged out */}
      {isAuthenticated && (
        <Header
          title="Stores List"
          addNew={isAuthenticated ? () => setShowAddModal(true) : undefined}
        />
      )}

      {stores.length > 0 ? (
        <Table
          data={filteredStores}
          columns={columns}
          onRowClick={onRowClick}
        />
      ) : (
        <Loading />
      )}

      {/* ADD STORE MODAL (only openable if logged in) */}
      <Modal
        title="New Store"
        save={handleAddNew}
        cancel={() => {
          setShowAddModal(false);
          setNewStore(emptyStoreForm);
        }}
        show={showAddModal}
        setShow={setShowAddModal}
      >
        <StoreForm
          form={newStore}
          onChange={(field, value) =>
            setNewStore((prev) => ({ ...prev, [field]: value }))
          }
        />
      </Modal>

      {/* EDIT STORE MODAL (only reachable if logged in) */}
      <Modal
        title="Edit Store"
        save={handleUpdateStore}
        cancel={closeEditModal}
        show={showEditModal}
        setShow={setShowEditModal}
      >
        <StoreForm
          form={editStoreForm}
          onChange={(field, value) =>
            setEditStoreForm((prev) => ({ ...prev, [field]: value }))
          }
        />
      </Modal>
    </div>
  );
};

const StoreForm = ({ form, onChange }) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <label className="block text-gray-700 font-medium mb-1">
          Store Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="border border-gray-300 rounded p-2 w-full"
          placeholder="Enter Store Name"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-1">
          Address 1
        </label>
        <input
          type="text"
          value={form.address_1}
          onChange={(e) => onChange("address_1", e.target.value)}
          className="border border-gray-300 rounded p-2 w-full"
          placeholder='e.g. "79177 Main Drive"'
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-1">
          Address 2 (optional)
        </label>
        <input
          type="text"
          value={form.address_2}
          onChange={(e) => onChange("address_2", e.target.value)}
          className="border border-gray-300 rounded p-2 w-full"
          placeholder='e.g. "2nd Floor"'
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-gray-700 font-medium mb-1">City</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => onChange("city", e.target.value)}
            className="border border-gray-300 rounded p-2 w-full"
            placeholder="New Orleans"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">State</label>
          <input
            type="text"
            value={form.state}
            onChange={(e) => onChange("state", e.target.value)}
            className="border border-gray-300 rounded p-2 w-full"
            placeholder="LA"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Zip</label>
          <input
            type="text"
            value={form.zip}
            onChange={(e) => onChange("zip", e.target.value)}
            className="border border-gray-300 rounded p-2 w-full"
            placeholder="70142"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default Stores;
