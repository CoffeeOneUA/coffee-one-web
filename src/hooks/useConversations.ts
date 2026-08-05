import { useState, useEffect, useCallback } from 'react';
import { supabase, type Conversation } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useConversations() {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setConversations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('conversations')
      .select('*, listings(id, title, photos, price_uah)')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });
    setConversations(data ?? []);
    setLoading(false);
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`conversations_${user.id}_${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `buyer_id=eq.${user.id}` },
        fetchAll,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `seller_id=eq.${user.id}` },
        fetchAll,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchAll]);

  const unreadTotal = conversations.reduce((sum, c) => {
    if (!user) return sum;
    return sum + (c.buyer_id === user.id ? c.buyer_unread : c.seller_unread);
  }, 0);

  return { conversations, loading, unreadTotal, refetch: fetchAll };
}

export async function getOrCreateConversation(listingId: string, sellerId: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', user.id)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
    .select('id')
    .single();

  if (error || !created) return null;
  return created.id;
}
