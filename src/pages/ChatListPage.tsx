import { Link } from 'react-router-dom';
import { useConversations } from '../hooks/useConversations';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '../components/Icon';

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

export default function ChatListPage() {
  const { user } = useAuth();
  const { conversations, loading } = useConversations();

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-coffee-dark tracking-tight mb-5">Повідомлення</h1>

      {loading ? (
        <div className="text-coffee-muted text-center py-16">Завантаження…</div>
      ) : conversations.length === 0 ? (
        <div className="bg-coffee-surface rounded-2xl p-14 text-center">
          <div className="flex justify-center mb-3"><Icon name="message" size={44} color="var(--color-coffee-muted)" /></div>
          <div className="font-extrabold text-coffee-dark text-lg mb-1">Повідомлень поки немає</div>
          <div className="text-coffee-muted text-sm">Тут з'являться листування щодо ваших оголошень</div>
        </div>
      ) : (
        <div className="bg-coffee-surface rounded-2xl overflow-hidden divide-y divide-coffee-line">
          {conversations.map((c) => {
            const isBuyer = c.buyer_id === user?.id;
            const unread = isBuyer ? c.buyer_unread : c.seller_unread;
            const photo = c.listings?.photos?.[0];
            return (
              <Link key={c.id} to={`/chats/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-coffee-chip transition-colors">
                <div className="w-13 h-13 w-[52px] h-[52px] rounded-xl bg-coffee-blue-light overflow-hidden shrink-0 flex items-center justify-center">
                  {photo ? <img src={photo} className="w-full h-full object-cover" alt="" /> : <Icon name="coffeeCup" size={22} color="var(--color-coffee-blue-dark)" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-coffee-dark truncate">{c.listings?.title ?? 'Оголошення'}</span>
                    <span className="text-[11px] text-coffee-muted shrink-0">{formatTime(c.last_message_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className={`text-sm truncate ${unread > 0 ? 'font-semibold text-coffee-dark' : 'text-coffee-muted'}`}>
                      {isBuyer ? 'Ви покупець · ' : 'Ви продавець · '}{c.last_message ?? 'Розмову розпочато'}
                    </span>
                    {unread > 0 && (
                      <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-coffee-blue text-white text-[11px] font-bold flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
