'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Types moved inline to avoid "use server" export restriction
type CreatePollData = {
  topicId: string;
  question: string;
  options: string[];
  allowMultipleChoices?: boolean;
  expiresAt?: Date;
}

type VotePollData = {
  pollId: string;
  optionIds: string[]; // Array to support multiple choice
}

/**
 * Create a poll for a topic
 */
export async function createPoll(data: CreatePollData) {
  const { topicId, question, options, allowMultipleChoices = false, expiresAt } = data;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Must be logged in to create a poll' };
  }

  // Validate inputs
  if (!question.trim()) {
    return { error: 'Poll question is required' };
  }

  if (options.length < 2) {
    return { error: 'Poll must have at least 2 options' };
  }

  if (options.length > 10) {
    return { error: 'Poll can have maximum 10 options' };
  }

  // Check if topic exists and user is the author
  const { data: topic, error: topicError } = await (supabase as any)
    .from('topics')
    .select('id, author_id')
    .eq('id', topicId)
    .single();

  if (topicError || !topic) {
    return { error: 'Topic not found' };
  }

  if ((topic as any).author_id !== user.id) {
    return { error: 'Only topic author can create a poll' };
  }

  // Check if poll already exists for this topic
  const { data: existingPoll } = await (supabase as any)
    .from('polls')
    .select('id')
    .eq('topic_id', topicId)
    .maybeSingle();

  if (existingPoll) {
    return { error: 'Topic already has a poll' };
  }

  // Create poll
  const { data: poll, error: pollError } = await (supabase as any)
    .from('polls')
    .insert({
      topic_id: topicId,
      question: question.trim(),
      allow_multiple_choices: allowMultipleChoices,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
    })
    .select()
    .single();

  if (pollError || !poll) {
    console.error('Error creating poll:', pollError);
    return { error: 'Failed to create poll' };
  }

  // Create poll options
  const pollOptions = options.map((option, index) => ({
    poll_id: (poll as any).id,
    option_text: option.trim(),
    position: index,
  }));

  const { error: optionsError } = await (supabase as any).from('poll_options').insert(pollOptions);

  if (optionsError) {
    console.error('Error creating poll options:', optionsError);
    // Rollback: delete the poll
    await (supabase as any).from('polls').delete().eq('id', (poll as any).id);
    return { error: 'Failed to create poll options' };
  }

  revalidatePath(`/forum/topic/*`);
  return { success: true, pollId: (poll as any).id };
}

/**
 * Vote on a poll
 */
export async function votePoll(data: VotePollData) {
  const { pollId, optionIds } = data;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Must be logged in to vote' };
  }

  // Get poll details
  const { data: poll, error: pollError } = await (supabase as any)
    .from('polls')
    .select('id, allow_multiple_choices, expires_at')
    .eq('id', pollId)
    .single();

  if (pollError || !poll) {
    return { error: 'Poll not found' };
  }

  // Check if poll has expired
  if ((poll as any).expires_at && new Date((poll as any).expires_at) < new Date()) {
    return { error: 'Poll has expired' };
  }

  // Validate option count
  if (!(poll as any).allow_multiple_choices && optionIds.length > 1) {
    return { error: 'This poll only allows one choice' };
  }

  if (optionIds.length === 0) {
    return { error: 'Must select at least one option' };
  }

  // Verify all option IDs belong to this poll
  const { data: options, error: optionsError } = await (supabase as any)
    .from('poll_options')
    .select('id')
    .eq('poll_id', pollId)
    .in('id', optionIds);

  if (optionsError || !options || options.length !== optionIds.length) {
    return { error: 'Invalid poll options' };
  }

  // Remove existing votes for this user on this poll (to allow vote changes)
  await (supabase as any).from('poll_votes').delete().eq('poll_id', pollId).eq('user_id', user.id);

  // Insert new votes
  const votes = optionIds.map((optionId) => ({
    poll_id: pollId,
    option_id: optionId,
    user_id: user.id,
  }));

  const { error: voteError } = await (supabase as any).from('poll_votes').insert(votes);

  if (voteError) {
    console.error('Error voting on poll:', voteError);
    return { error: 'Failed to submit vote' };
  }

  revalidatePath(`/forum/topic/*`);
  return { success: true };
}

/**
 * Get poll details with results
 */
export async function getPollDetails(pollId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: poll, error: pollError } = await (supabase as any)
    .from('polls')
    .select('id, topic_id, question, allow_multiple_choices, expires_at, created_at')
    .eq('id', pollId)
    .single();

  if (pollError || !poll) {
    return { error: 'Poll not found' };
  }

  // Get poll options with vote counts
  const { data: options, error: optionsError } = await (supabase as any)
    .from('poll_options')
    .select(
      `
      id,
      option_text,
      position,
      poll_votes (count)
    `
    )
    .eq('poll_id', pollId)
    .order('position');

  if (optionsError) {
    console.error('Error fetching poll options:', optionsError);
    return { error: 'Failed to fetch poll options' };
  }

  // Get total vote count
  const { count: totalVotes } = await (supabase as any)
    .from('poll_votes')
    .select('*', { count: 'exact', head: true })
    .eq('poll_id', pollId);

  // Get current user's votes
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userVotes: string[] = [];
  if (user) {
    const { data: votes } = await (supabase as any)
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id);

    userVotes = votes?.map((v: any) => v.option_id) || [];
  }

  return {
    poll,
    options: options || [],
    totalVotes: totalVotes || 0,
    userVotes,
  };
}

/**
 * Delete a poll (only by topic author)
 */
export async function deletePoll(pollId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Must be logged in' };
  }

  // Check if user is the topic author
  const { data: poll } = await (supabase as any)
    .from('polls')
    .select('topic_id, topics!inner(author_id)')
    .eq('id', pollId)
    .single();

  if (!poll || ((poll as any).topics as any).author_id !== user.id) {
    return { error: 'Only topic author can delete poll' };
  }

  const { error } = await (supabase as any).from('polls').delete().eq('id', pollId);

  if (error) {
    console.error('Error deleting poll:', error);
    return { error: 'Failed to delete poll' };
  }

  revalidatePath(`/forum/topic/*`);
  return { success: true };
}
