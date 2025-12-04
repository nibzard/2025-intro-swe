'use client';

import { useState } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { createCategory, updateCategory, deleteCategory } from '../actions';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order_index: number;
};

type CategoryFormData = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
};

export function CategoryManagementClient({
  categories,
}: {
  categories: Category[];
}) {
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    icon: '💬',
    color: '#3B82F6',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = editingCategory
      ? await updateCategory(editingCategory.id, formData)
      : await createCategory(formData);

    setLoading(false);

    if (result.success) {
      setShowForm(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '💬',
        color: '#3B82F6',
      });
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '💬',
      color: category.color || '#3B82F6',
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This will also delete all topics in this category. This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    const result = await deleteCategory(categoryId);
    setLoading(false);

    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '💬',
      color: '#3B82F6',
    });
  };

  return (
    <div className="space-y-6">
      {/* Create Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Category
        </button>
      )}

      {/* Category Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {editingCategory ? 'Edit Category' : 'Create Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-2xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No categories yet
            </div>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="text-4xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg"
                      style={{ backgroundColor: (category.color || '#3B82F6') + '20' }}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {category.name}
                        </h3>
                        <span
                          className="px-2 py-0.5 text-xs rounded"
                          style={{
                            backgroundColor: (category.color || '#3B82F6') + '20',
                            color: category.color || '#3B82F6',
                          }}
                        >
                          /{category.slug}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(category)}
                      disabled={loading}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      disabled={loading}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
