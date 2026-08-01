"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Modal from "@/components/admin/modal";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import ProductForm from "@/components/admin/product-form";
import { PRODUCT_STATUSES } from "@/lib/product";
import type { AdminProduct, ProductStatus } from "@/lib/product";
import type { AdminCategory } from "@/lib/category";
import { fetchAdminCategories } from "@/lib/admin/categories";
import {
  fetchAdminProducts,
  fetchAdminProduct,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  type AdminProductInput,
} from "@/lib/admin/products";

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<ProductStatus, string> = {
  ACTIVE: "bg-success/10 text-success",
  INACTIVE: "bg-slate/10 text-slate",
  OUT_OF_STOCK: "bg-red-500/10 text-red-500",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("");

  const [categories, setCategories] = useState<AdminCategory[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Debounce search input before it drives the API query.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    fetchAdminCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const data = await fetchAdminProducts({
          search,
          categoryId: categoryFilter,
          status: statusFilter,
          page,
          pageSize: PAGE_SIZE,
        });
        if (!cancelled) {
          setProducts(data.items);
          setTotal(data.total);
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
  }, [search, categoryFilter, statusFilter, page, reloadKey]);

  function reload() {
    setReloadKey((k) => k + 1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function openAdd() {
    setFormMode("add");
    setEditingProduct(null);
    setFormLoading(false);
    setModalOpen(true);
  }

  async function openEdit(product: AdminProduct) {
    setFormMode("edit");
    setEditingProduct(null);
    setFormLoading(true);
    setModalOpen(true);
    try {
      const full = await fetchAdminProduct(product.id);
      setEditingProduct(full);
    } catch {
      setEditingProduct(product);
    } finally {
      setFormLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
  }

  async function handleSubmit(input: AdminProductInput) {
    if (formMode === "edit" && editingProduct) {
      await updateAdminProduct(editingProduct.id, input);
    } else {
      await createAdminProduct(input);
    }
    closeModal();
    reload();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAdminProduct(deleteTarget.id);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">Products</h1>
          <p className="mt-1 text-sm text-slate">Manage your store&apos;s product catalog.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-slate/20 px-4 py-2">
          <Search size={16} className="text-slate" />
          <input
            type="search"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate/60"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate/20 bg-transparent px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:text-paper"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ProductStatus | "");
            setPage(1);
          }}
          className="rounded-lg border border-slate/20 bg-transparent px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:text-paper"
        >
          <option value="">All Statuses</option>
          {PRODUCT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate/15">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate/15 bg-paper-soft text-xs uppercase tracking-wide text-slate dark:bg-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {status === "loading" && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate">
                  Loading…
                </td>
              </tr>
            )}
            {status === "error" && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate">
                  Couldn’t load products. Try refreshing the page.
                </td>
              </tr>
            )}
            {status === "ready" && products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate">
                  No products found.
                </td>
              </tr>
            )}
            {status === "ready" &&
              products.map((product) => (
                <tr key={product.id} className="border-b border-slate/10 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                      <span className="font-medium text-ink dark:text-paper">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate">{product.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate">{product.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[product.status]}`}
                    >
                      {PRODUCT_STATUSES.find((s) => s.value === product.status)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        aria-label={`Edit ${product.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate transition hover:bg-paper-soft hover:text-ink dark:hover:bg-ink dark:hover:text-paper"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget(product);
                          setDeleteError("");
                        }}
                        aria-label={`Delete ${product.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
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

      {status === "ready" && total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate">
          <span>
            Page {page} of {totalPages} ({total} product{total === 1 ? "" : "s"})
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-full border border-slate/20 px-3 py-1.5 transition hover:border-brand hover:text-brand disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-full border border-slate/20 px-3 py-1.5 transition hover:border-brand hover:text-brand disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={formMode === "edit" ? "Edit Product" : "Add Product"}
        widthClassName="max-w-2xl"
      >
        {formLoading ? (
          <p className="text-sm text-slate">Loading…</p>
        ) : (
          <ProductForm
            key={editingProduct?.id ?? "new"}
            initial={editingProduct}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
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
