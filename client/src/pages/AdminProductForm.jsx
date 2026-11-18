import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../api/axios.js';
import Spinner from '../components/Spinner.jsx';
import { CATEGORIES } from '../utils/format.js';

const MAX_IMAGES = 5;
const MAX_MB = 5;
const empty = { name: '', description: '', price: '', stock: '', category: CATEGORIES[0], brand: '' };

const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40';

// Used for both "Add product" (/admin/products/new) and "Edit product" (/admin/products/:id/edit).
export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [existing, setExisting] = useState([]); // images already on the product: [{ key, url }]
  const [newFiles, setNewFiles] = useState([]); // newly chosen files: [{ file, preview }]
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/products/${id}`)
      .then(({ data: { product: p } }) => {
        setForm({ name: p.name, description: p.description, price: p.price, stock: p.stock, category: p.category, brand: p.brand });
        setExisting(p.images);
      })
      .catch((e) => {
        toast.error(getErrorMessage(e));
        navigate('/admin/products');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  // Free the temporary preview URLs when the page closes.
  useEffect(() => () => newFiles.forEach((f) => URL.revokeObjectURL(f.preview)), [newFiles]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onPickFiles = (e) => {
    const picked = [...e.target.files];
    e.target.value = '';
    const valid = [];
    for (const file of picked) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name}: only JPG, PNG or WebP`);
      } else if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`${file.name}: larger than ${MAX_MB} MB`);
      } else valid.push({ file, preview: URL.createObjectURL(file) });
    }
    if (existing.length + newFiles.length + valid.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images`);
      return;
    }
    setNewFiles([...newFiles, ...valid]);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) return toast.error('Name and description are required');
    if (Number(form.price) < 0 || form.price === '') return toast.error('Enter a valid price');
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0 || form.stock === '') return toast.error('Stock must be a whole number');

    // Images are files, so we send multipart/form-data instead of JSON.
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (isEdit) data.append('keepImages', JSON.stringify(existing.map((i) => i.key)));
    newFiles.forEach((f) => data.append('images', f.file));

    setSaving(true);
    try {
      await (isEdit ? api.put(`/products/${id}`, data) : api.post('/products', data));
      toast.success(isEdit ? 'Product updated' : 'Product created');
      navigate('/admin/products');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  const total = existing.length + newFiles.length;

  return (
    <section className="max-w-3xl pb-12">
      <Link to="/admin/products" className="text-sm font-medium text-brand-600 hover:underline">← Back to products</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{isEdit ? 'Edit product' : 'Add product'}</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        <label className="block text-sm font-medium text-slate-700">Name
          <input name="name" value={form.name} onChange={onChange} className={inputClass} maxLength={120} />
        </label>
        <label className="block text-sm font-medium text-slate-700">Description
          <textarea name="description" value={form.description} onChange={onChange} rows={4} className={inputClass} maxLength={2000} />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">Price (₹)
            <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={onChange} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">Stock
            <input name="stock" type="number" min="0" step="1" value={form.stock} onChange={onChange} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">Category
            <select name="category" value={form.category} onChange={onChange} className={inputClass}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">Brand
            <input name="brand" value={form.brand} onChange={onChange} className={inputClass} maxLength={60} />
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">Images <span className="font-normal text-slate-500">({total}/{MAX_IMAGES}, JPG/PNG/WebP, max {MAX_MB} MB each)</span></p>
          <div className="mt-2 flex flex-wrap gap-3">
            {existing.map((img) => (
              <Thumb key={img.key} src={img.url} onRemove={() => setExisting(existing.filter((i) => i.key !== img.key))} />
            ))}
            {newFiles.map((f) => (
              <Thumb key={f.preview} src={f.preview} isNew onRemove={() => setNewFiles(newFiles.filter((x) => x !== f))} />
            ))}
            {total < MAX_IMAGES && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-brand-500 hover:text-brand-600">
                <span className="text-2xl leading-none">+</span>Add image
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onPickFiles} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Link to="/admin/products" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</Link>
          <button disabled={saving} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </section>
  );
}

function Thumb({ src, onRemove, isNew }) {
  return (
    <div className="relative h-24 w-24">
      <img src={src} alt="" className="h-full w-full rounded-lg object-cover ring-1 ring-slate-200" />
      {isNew && <span className="absolute bottom-1 left-1 rounded bg-brand-600 px-1 text-[10px] font-semibold text-white">NEW</span>}
      <button type="button" onClick={onRemove} aria-label="Remove image" className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white shadow">✕</button>
    </div>
  );
}
