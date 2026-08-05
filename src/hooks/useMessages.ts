import { useState, useEffect, useCallback } from 'react';
import { supabase, type ChatMessage, type Conversation } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useMessages(conversationId: string | undefined) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    const [{ data: conv }, { data: msgs }] = await Promise.all([
      supabase.from('conversations').select('*, listings(id, title, photos, price_uah)').eq('id', conversationId).maybeSingle(),
      supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }),
    ]);
    setConversation(conv ?? null);
    setMessages(msgs ?? []);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!conversationId || !user) return;
    (async () => {
      const { data: conv } = await supabase.from('conversations').select('buyer_id, seller_id').eq('id', conversationId).maybeSingle();
      if (!conv) return;
      const field = conv.buyer_id === user.id ? 'buyer_unread' : 'seller_unread';
      await supabase.from('conversations').update({ [field]: 0 }).eq('id', conversationId);
    })();
  }, [conversationId, user?.id]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages_${conversationId}_${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]));
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  async function sendText(body: string) {
    if (!conversationId || !user || !body.trim()) return;
    await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: user.id, type: 'text', body: body.trim() });
  }

  async function sendOffer(amountUah: number) {
    if (!conversationId || !user || !amountUah) return;
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      type: 'offer',
      offer_amount_uah: amountUah,
      offer_status: 'pending',
    });
  }

  async function respondOffer(messageId: string, status: 'accepted' | 'declined') {
    await supabase.from('messages').update({ offer_status: status }).eq('id', messageId);
  }

  return { conversation, messages, loading, sendText, sendOffer, respondOffer };
}
