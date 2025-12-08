'use client';

import { useState } from 'react';
import { Shield, UserX, Search, Ban, UserCheck } from 'lucide-react';
import { updateUserRole, deleteUser, banUser, unbanUser } from '../actions';
import { sanitizeSearchQuery } from '@/lib/utils/sanitize';
import { Avatar } from '@/components/ui/avatar';
import { toast } from 'sonner';

type User = {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'student' | 'admin';
  reputation: number;
  created_at: string;
  is_banned?: boolean;
  banned_at?: string | null;
  ban_reason?: string | null;
};

export function UserManagementClient({ users }: { users: User[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [showBanDialog, setShowBanDialog] = useState<string | null>(null);

  const sanitizedSearchTerm = sanitizeSearchQuery(searchTerm);
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(sanitizedSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(sanitizedSearchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(sanitizedSearchTerm.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: 'student' | 'admin') => {
    const action = newRole === 'admin' ? 'postaviti administratorom' : 'ukloniti admin ulogu';
    if (!confirm(`Jeste li sigurni da zelite ${action} ovom korisniku?`)) {
      return;
    }

    setLoading(userId);
    try {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        toast.success(`Uloga uspjesno promijenjena`);
        window.location.reload();
      } else {
        toast.error(result.error || 'Doslo je do greske');
      }
    } catch (e: any) {
      toast.error(e.message || 'Doslo je do greske');
    }
    setLoading(null);
  };

  const handleBanUser = async (userId: string) => {
    setLoading(userId);
    try {
      const result = await banUser(userId, banReason || undefined);
      setShowBanDialog(null);
      setBanReason('');

      if (result.success) {
        toast.success('Korisnik uspjesno baniran');
        window.location.reload();
      } else {
        toast.error(result.error || 'Doslo je do greske');
      }
    } catch (e: any) {
      toast.error(e.message || 'Doslo je do greske');
    }
    setLoading(null);
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm('Jeste li sigurni da zelite ukloniti ban ovom korisniku?')) {
      return;
    }

    setLoading(userId);
    try {
      const result = await unbanUser(userId);
      if (result.success) {
        toast.success('Ban uspjesno uklonjen');
        window.location.reload();
      } else {
        toast.error(result.error || 'Doslo je do greske');
      }
    } catch (e: any) {
      toast.error(e.message || 'Doslo je do greske');
    }
    setLoading(null);
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (
      !confirm(
        `Jeste li sigurni da zelite TRAJNO obrisati korisnika "${username}"? Ova akcija se ne moze ponistiti!`
      )
    ) {
      return;
    }

    setLoading(userId);
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        toast.success('Korisnik uspjesno obrisan');
        window.location.reload();
      } else {
        toast.error(result.error || 'Doslo je do greske');
      }
    } catch (e: any) {
      toast.error(e.message || 'Doslo je do greske');
    }
    setLoading(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Search Bar */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pretrazi korisnike..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 h-11 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Korisnik
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                Email
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                Reputacija
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 sm:px-6 py-6 sm:py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  Nema pronadenih korisnika
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    user.is_banned ? 'bg-red-50 dark:bg-red-900/20' : ''
                  }`}
                >
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.avatar_url}
                        alt={user.username}
                        username={user.username}
                        size="md"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.full_name || user.username}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-xs sm:text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}
                      >
                        {user.role === 'admin' && <Shield className="h-3 w-3" />}
                        {user.role === 'admin' ? 'Admin' : 'Student'}
                      </span>
                      {user.is_banned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 w-fit">
                          <Ban className="h-3 w-3" />
                          Baniran
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-xs sm:text-sm text-gray-900 dark:text-white">
                      {user.reputation}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1 sm:gap-2 flex-wrap">
                      {/* Role change button */}
                      <button
                        onClick={() =>
                          handleRoleChange(
                            user.id,
                            user.role === 'admin' ? 'student' : 'admin'
                          )
                        }
                        disabled={loading === user.id}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={user.role === 'admin' ? 'Ukloni admin ulogu' : 'Postavi administratorom'}
                      >
                        <Shield className="h-3 w-3" />
                        <span className="hidden lg:inline">
                          {user.role === 'admin' ? 'Ukloni Admin' : 'Postavi Admin'}
                        </span>
                      </button>

                      {/* Ban/Unban button */}
                      {user.role !== 'admin' && (
                        user.is_banned ? (
                          <button
                            onClick={() => handleUnbanUser(user.id)}
                            disabled={loading === user.id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Ukloni ban"
                          >
                            <UserCheck className="h-3 w-3" />
                            <span className="hidden lg:inline">Ukloni Ban</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowBanDialog(user.id)}
                            disabled={loading === user.id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Baniraj korisnika"
                          >
                            <Ban className="h-3 w-3" />
                            <span className="hidden lg:inline">Baniraj</span>
                          </button>
                        )
                      )}

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        disabled={loading === user.id}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Trajno obrisi korisnika"
                      >
                        <UserX className="h-3 w-3" />
                        <span className="hidden lg:inline">Obrisi</span>
                      </button>
                    </div>

                    {/* Ban reason info */}
                    {user.is_banned && user.ban_reason && (
                      <div className="mt-1 text-xs text-red-600 dark:text-red-400 text-left">
                        Razlog: {user.ban_reason}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ban Dialog */}
      {showBanDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Ban className="w-5 h-5 text-orange-500" />
              Baniraj korisnika
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Razlog bana (opcionalno)
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Unesite razlog bana..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowBanDialog(null);
                  setBanReason('');
                }}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Odustani
              </button>
              <button
                onClick={() => handleBanUser(showBanDialog)}
                disabled={loading === showBanDialog}
                className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {loading === showBanDialog ? 'Baniranje...' : 'Baniraj'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
