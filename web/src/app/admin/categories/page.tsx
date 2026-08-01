"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/admin/modal";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import CategoryForm from "@/components/admin/category-form";
import type { AdminCategory } from "@/lib/category";
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  type AdminCategoryInput,
} from "@/lib/admin/categories";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const data = await fetchAdminCategories();
        if (!cancelled) {
          setCategories(data);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function reload() {
    setReloadKey((k) => k + 1);
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(category: AdminCategory) {
    setEditing(category);
    setModalOpen(true);
  }

  async function handleSubmit(input: AdminCategoryInput) {
    if (editing) {
      await updateAdminCategory(editing.id, input);
    } else {
      await createAdminCategory(input);
    }
    setModalOpen(false);
    reload();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAdminCategory(deleteTarget.id);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">Categories</h1>
          <p className="mt-1 text-sm text-slate">Organize products into categories.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate/15">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate/15 bg-paper-soft text-xs uppercase tracking-wide text-slate dark:bg-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Sort Order</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {status === "loading" && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate">
                  Loading…
                </td>
              </tr>
            )}
            {status === "error" && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate">
                  Couldn’t load categories. Try refreshing the page.
                </td>
              </tr>
            )}
            {status === "ready" && categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate">
                  No categories yet.
                </td>
              </tr>
            )}
            {status === "ready" &&
              categories.map((category) => (
                <tr key={category.id} className="border-b border-slate/10 last:border-0">
                  <td className="px-4 py-3 text-ink dark:text-paper">{category.name}</td>
                  <td className="px-4 py-3 text-slate">{category.sortOrder}</td>
                  <td className="px-4 py-3 text-slate">{category.productCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(category)}
                        aria-label={`Edit ${category.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate transition hover:bg-paper-soft hover:text-ink dark:hover:bg-ink dark:hover:text-paper"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget(category);
                          setDeleteError("");
                        }}
                        disabled={category.productCount > 0}
                        title={
                          category.productCount > 0
                            ? `${category.productCount} product(s) use this category`
                            : undefined
                        }
                        aria-label={`Delete ${category.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Category" : "Add Category"}
      >
        <CategoryForm initial={editing} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={
          deleteError || `Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`
        }
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }}
        loading={deleting}
      />
    </div>
  );
}
