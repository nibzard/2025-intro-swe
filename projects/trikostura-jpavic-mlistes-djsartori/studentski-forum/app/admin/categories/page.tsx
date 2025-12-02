'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Category } from '@/lib/types';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'admin')) {
      router.push('/forum');
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchCategories();
    }
  }, [profile]);

  const fetchCategories = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (data) {
      setCategories(data as Category[]);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!formData.name.trim() || !formData.slug.trim()) {
      setError('Naziv i slug su obavezni');
      setSubmitting(false);
      return;
    }

    if (editingCategory) {
      // Update existing category
      const { error } = await supabase
        .from('categories')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          slug: formData.slug.trim(),
        })
        .eq('id', editingCategory.id);

      if (error) {
        setError('Greška pri ažuriranju kategorije');
      } else {
        resetForm();
        fetchCategories();
      }
    } else {
      // Create new category
      const { error } = await supabase
        .from('categories')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          slug: formData.slug.trim(),
        });

      if (error) {
        setError('Greška pri kreiranju kategorije. Slug možda već postoji.');
      } else {
        resetForm();
        fetchCategories();
      }
    }

    setSubmitting(false);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug,
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovu kategoriju? Sve teme u ovoj kategoriji će također biti obrisane.')) {
      return;
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (!error) {
      fetchCategories();
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', slug: '' });
    setEditingCategory(null);
    setShowForm(false);
    setError('');
  };

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Učitavanje...</div>
        </div>
      </>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:text-blue-700">
            ← Nazad na admin panel
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Upravljanje kategorijama</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            {showForm ? 'Zatvori' : 'Nova kategorija'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingCategory ? 'Uredi kategoriju' : 'Nova kategorija'}
            </h2>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Naziv kategorije
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  placeholder="Npr. Programiranje"
                  required
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium mb-2">
                  Slug (URL)
                </label>
                <input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  placeholder="programiranje"
                  required
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Koristit će se u URL-u: /forum/category/{formData.slug || 'slug'}
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Opis (opcionalno)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 min-h-24"
                  placeholder="Kratki opis kategorije..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Spremanje...' : editingCategory ? 'Ažuriraj' : 'Kreiraj'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  Odustani
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Naziv</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Slug</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Opis</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Kreirana</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {category.slug}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {category.description || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(category.created_at).toLocaleDateString('hr-HR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        Uredi
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                      >
                        Obriši
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-gray-600 dark:text-gray-400">
          Ukupno kategorija: {categories.length}
        </div>
      </div>
    </>
  );
}
