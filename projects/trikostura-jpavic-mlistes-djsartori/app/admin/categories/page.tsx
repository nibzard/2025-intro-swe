import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CategoryManagementClient } from './category-management-client';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Upravljanje Kategorijama
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
          Kreirajte, uređujte i organizujte kategorije foruma
        </p>
      </div>

      <CategoryManagementClient categories={categories || []} />
    </div>
  );
}
