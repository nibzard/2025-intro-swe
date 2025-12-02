'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Profile } from '@/lib/types';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTopics: 0,
    totalResponses: 0,
    totalCategories: 0,
  });

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'admin')) {
      router.push('/forum');
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (usersData) {
      setUsers(usersData as Profile[]);
    }

    // Fetch statistics
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: topicCount } = await supabase
      .from('topics')
      .select('*', { count: 'exact', head: true });

    const { count: responseCount } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true });

    const { count: categoryCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    setStats({
      totalUsers: userCount || 0,
      totalTopics: topicCount || 0,
      totalResponses: responseCount || 0,
      totalCategories: categoryCount || 0,
    });

    setLoading(false);
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
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

        {/* Navigation */}
        <div className="flex gap-4 mb-8">
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Upravljanje korisnicima
          </Link>
          <Link
            href="/admin/categories"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Upravljanje kategorijama
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-2">Ukupno korisnika</h3>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-2">Ukupno tema</h3>
            <p className="text-3xl font-bold">{stats.totalTopics}</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-2">Ukupno odgovora</h3>
            <p className="text-3xl font-bold">{stats.totalResponses}</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-2">Ukupno kategorija</h3>
            <p className="text-3xl font-bold">{stats.totalCategories}</p>
          </div>
        </div>

        {/* Recent Users */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Nedavno registrirani korisnici</h2>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Ime</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Uloga</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Registriran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">{user.full_name || 'N/A'}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          user.role === 'admin'
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(user.created_at).toLocaleDateString('hr-HR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
