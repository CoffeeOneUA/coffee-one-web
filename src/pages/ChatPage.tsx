import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../contexts/AuthContext';
import type { ChatMessage } from '../lib/supabase';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

const OFFER_STATUS_LABEL: Record<string, string> = {
  pending: 'Очікує відповіді',
  accepted: 'Прийнято',
  declined: 'Відхилено',
};

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { conversation, messages, loading, sendText, sendOffer, respondOffer } = useMessages(id);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentInitialOffer = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    const offer = searchParams.get('offer');
    if (offer && !sentInitialOffer.current && !loading) {
      sentInitialOffer.current = true;
      const amount = Number(offer);
      if (amount > 0) sendOffer(amount);
      searchParams.delete('offer');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, loading]);

  const latestOfferId = [...messages].reverse().find((m) => m.type === 'offer')?.id;

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    sendText(text);
    setText('');
  }

  function renderMessage(m: ChatMessage) {
    const mine = m.sender_id === user?.id;

    if (m.type === 'offer') {
      const actionable = m.id === latestOfferId && m.offer_status === 'pending' && !mine;
      return (
        <div key={m.id} className={`max-w-[75%] rounded-2xl p-4 border-2 ${mine ? 'ml-auto bg-coffee-blue-light border-coffee-blue' : 'bg-coffee-surface border-coffee-line'}`}>
          <div className="text-[11px] font-bold text-coffee-muted uppercase">{mine ? 'Ваша пропозиція' : 'Пропозиція ціни'}</div>
          <div className="text-xl font-extrabold text-coffee-dark mt-0.5">{Number(m.offer_amount_uah).toLocaleString('uk-UA')} ₴</div>
          <div
            className={`inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-md ${
              m.offer_status === 'accepted' ? 'bg-coffee-green-light text-coffee-green' : m.offer_status === 'declined' ? 'bg-coffee-red-light text-coffee-red' : 'bg-coffee-amber-light text-coffee-amber'
            }`}
          >
            {OFFER_STATUS_LABEL[m.offer_status ?? 'pending']}
          </div>
          {actionable && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => respondOffer(m.id, 'accepted')} className="flex-1 bg-coffee-green text-white font-bold rounded-lg py-2 text-sm">
                Прийняти
              </button>
              <button onClick={() => respondOffer(m.id, 'declined')} className="flex-1 bg-coffee-red-light text-coffee-red font-bold rounded-lg py-2 text-sm">
                Відхилити
              </button>
            </div>
          )}
          <div className="text-[10px] text-coffee-muted mt-1.5">{formatTime(m.created_at)}</div>
        </div>
      );
    }

    return (
      <div
        key={m.id}
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${mine ? 'ml-auto bg-coffee-blue text-white rounded-br-md' : 'bg-coffee-surface text-coffee-dark rounded-bl-md'}`}
      >
        <div>{m.body}</div>
        <div className={`text-[10px] mt-1 text-right ${mine ? 'text-white/70' : 'text-coffee-muted'}`}>{formatTime(m.created_at)}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto -mt-2">
      <div className="flex items-center gap-3 pb-4 border-b border-coffee-line mb-4">
        <Link to="/chats" className="text-coffee-blue font-bold text-sm shrink-0">← Назад</Link>
        <Link to={`/listing/${conversation?.listing_id}`} className="font-bold text-coffee-dark truncate hover:text-coffee-blue">
          {conversation?.listings?.title ?? 'Розмова'}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
        {loading ? (
          <div className="text-coffee-muted text-center py-10">Завантаження…</div>
        ) : messages.length === 0 ? (
          <div className="text-coffee-muted text-center py-10 text-sm">Напишіть перше повідомлення</div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 pt-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Повідомлення…"
          className="flex-1 bg-coffee-surface rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-coffee-blue"
        />
        <button type="submit" disabled={!text.trim()} className="w-11 h-11 rounded-full bg-coffee-blue text-white flex items-center justify-center disabled:opacity-50 shrink-0">
          ➤
        </button>
      </form>
    </div>
  );
}
