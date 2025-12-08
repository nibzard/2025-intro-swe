'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ReportSchema = z.object({
  topicId: z.string().uuid().optional(),
  replyId: z.string().uuid().optional(),
  reportType: z.enum(['spam', 'harassment', 'inappropriate', 'misinformation', 'other']),
  description: z.string().max(1000).optional(),
}).refine(data => data.topicId || data.replyId, {
  message: 'Morate odabrati temu ili odgovor za prijavu',
});

export async function submitReport(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Morate biti prijavljeni' };
  }

  try {
    const data = ReportSchema.parse({
      topicId: formData.get('topicId') || undefined,
      replyId: formData.get('replyId') || undefined,
      reportType: formData.get('reportType'),
      description: formData.get('description') || undefined,
    });

    // Check if user already reported this content
    const existingQuery = (supabase as any)
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('status', 'pending');

    if (data.topicId) {
      existingQuery.eq('topic_id', data.topicId);
    } else {
      existingQuery.eq('reply_id', data.replyId);
    }

    const { data: existing } = await existingQuery.single();

    if (existing) {
      return { success: false, error: 'Vec ste prijavili ovaj sadrzaj' };
    }

    // Create report
    const { error } = await (supabase as any)
      .from('reports')
      .insert({
        reporter_id: user.id,
        topic_id: data.topicId || null,
        reply_id: data.replyId || null,
        report_type: data.reportType,
        description: data.description || null,
      });

    if (error) {
      console.error('Report error:', error);
      return { success: false, error: 'Greska pri slanju prijave' };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Doslo je do greske' };
  }
}

export async function getReports(status?: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { reports: [], error: 'Neautorizirano' };
  }

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile as any).role !== 'admin') {
    return { reports: [], error: 'Neautorizirano' };
  }

  let query = (supabase as any)
    .from('reports')
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(username, avatar_url),
      topic:topics(id, title, slug),
      reply:replies(id, content, topic_id)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: reports, error } = await query;

  if (error) {
    return { reports: [], error: 'Greska pri dohvacanju prijava' };
  }

  return { reports: reports || [] };
}

export async function updateReportStatus(
  reportId: string,
  status: 'reviewed' | 'resolved' | 'dismissed',
  adminNotes?: string
) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Neautorizirano' };
  }

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile as any).role !== 'admin') {
    return { success: false, error: 'Neautorizirano' };
  }

  const { error } = await (supabase as any)
    .from('reports')
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes || null,
    })
    .eq('id', reportId);

  if (error) {
    return { success: false, error: 'Greska pri azuriranju prijave' };
  }

  return { success: true };
}
