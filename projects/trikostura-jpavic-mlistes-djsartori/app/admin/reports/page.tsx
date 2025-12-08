import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReportActions } from './report-actions';
import { Flag, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

const REPORT_TYPE_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Uznemiravanje',
  inappropriate: 'Neprikladan sadrzaj',
  misinformation: 'Dezinformacije',
  other: 'Ostalo',
};

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Na cekanju', color: 'text-yellow-600 bg-yellow-100', icon: Clock },
  reviewed: { label: 'Pregledano', color: 'text-blue-600 bg-blue-100', icon: AlertTriangle },
  resolved: { label: 'Rijeseno', color: 'text-green-600 bg-green-100', icon: CheckCircle },
  dismissed: { label: 'Odbaceno', color: 'text-gray-600 bg-gray-100', icon: XCircle },
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile as any).role !== 'admin') {
    redirect('/forum');
  }

  // Get reports
  let query = (supabase as any)
    .from('reports')
    .select(`
      *,
      topic:topics(id, title, slug),
      reply:replies(id, content, topic_id)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: reports, error: reportsError } = await query;

  // Fetch reporter info separately if reports exist
  if (reports && reports.length > 0) {
    const reporterIds = [...new Set(reports.map((r: any) => r.reporter_id))];
    const { data: reporters } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', reporterIds);

    // Attach reporter info to reports
    reports.forEach((report: any) => {
      report.reporter = reporters?.find((r: any) => r.id === report.reporter_id) || null;
    });
  }

  // Get counts by status
  const { data: allReports } = await (supabase as any)
    .from('reports')
    .select('status');

  const counts = {
    all: allReports?.length || 0,
    pending: allReports?.filter((r: any) => r.status === 'pending').length || 0,
    reviewed: allReports?.filter((r: any) => r.status === 'reviewed').length || 0,
    resolved: allReports?.filter((r: any) => r.status === 'resolved').length || 0,
    dismissed: allReports?.filter((r: any) => r.status === 'dismissed').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
          <Flag className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Prijave sadrzaja</h1>
          <p className="text-sm text-gray-500">{counts.pending} na cekanju</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/reports">
          <Button variant={!status ? 'default' : 'outline'} size="sm">
            Sve ({counts.all})
          </Button>
        </Link>
        <Link href="/admin/reports?status=pending">
          <Button variant={status === 'pending' ? 'default' : 'outline'} size="sm">
            Na cekanju ({counts.pending})
          </Button>
        </Link>
        <Link href="/admin/reports?status=reviewed">
          <Button variant={status === 'reviewed' ? 'default' : 'outline'} size="sm">
            Pregledano ({counts.reviewed})
          </Button>
        </Link>
        <Link href="/admin/reports?status=resolved">
          <Button variant={status === 'resolved' ? 'default' : 'outline'} size="sm">
            Rijeseno ({counts.resolved})
          </Button>
        </Link>
        <Link href="/admin/reports?status=dismissed">
          <Button variant={status === 'dismissed' ? 'default' : 'outline'} size="sm">
            Odbaceno ({counts.dismissed})
          </Button>
        </Link>
      </div>

      {/* Reports list */}
      {reports && reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report: any) => {
            const statusInfo = STATUS_LABELS[report.status] || STATUS_LABELS.pending;
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                          {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                        </span>
                      </div>

                      <div className="text-sm mb-2">
                        <span className="text-gray-500">Prijavio: </span>
                        <span className="font-medium">{report.reporter?.username}</span>
                        <span className="text-gray-400 mx-2">•</span>
                        <span className="text-gray-500">
                          {new Date(report.created_at).toLocaleDateString('hr-HR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {report.topic && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-500">Tema: </span>
                          <Link
                            href={`/forum/topic/${report.topic.slug}`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {report.topic.title}
                          </Link>
                        </div>
                      )}

                      {report.reply && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-500">Odgovor: </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {report.reply.content.substring(0, 150)}
                            {report.reply.content.length > 150 && '...'}
                          </span>
                        </div>
                      )}

                      {report.description && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <span className="text-gray-500">Opis: </span>
                          {report.description}
                        </div>
                      )}

                      {report.admin_notes && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                          <span className="text-blue-600 dark:text-blue-400">Admin biljeske: </span>
                          {report.admin_notes}
                        </div>
                      )}
                    </div>

                    <ReportActions report={report} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Flag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              {status ? `Nema prijava sa statusom "${STATUS_LABELS[status]?.label || status}"` : 'Nema prijava'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
