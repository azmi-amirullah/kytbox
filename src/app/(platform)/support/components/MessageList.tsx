import { SupportMessage } from '@/types/support';
import { formatDistanceToNow } from 'date-fns';
import { LuUser } from 'react-icons/lu';
import { userRoleSchema } from '@/lib/validation.schemas';

interface MessageListProps {
  messages: SupportMessage[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  return (
    <div className='space-y-6'>
      {messages.map((msg) => {
        const isMe = msg.sender_id === currentUserId;
        const isAdmin = userRoleSchema.parse(msg.profiles?.role) === 'admin';

        return (
          <div
            key={msg.id}
            className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              {isAdmin ? (
                <span className='text-xs font-bold'>K</span>
              ) : (
                <LuUser className='w-4 h-4 text-muted-foreground' />
              )}
            </div>

            <div
              className={`flex flex-col max-w-[80%] ${
                isMe ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`flex items-baseline gap-2 mb-1 ${
                  isMe ? 'flex-row-reverse' : ''
                }`}
              >
                <span className='text-sm font-medium'>
                  {isMe
                    ? 'You'
                    : isAdmin
                      ? 'Kytbox Support'
                      : msg.profiles?.username}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {formatDistanceToNow(new Date(msg.created_at))} ago
                </span>
              </div>

              <div
                className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
                  isMe
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-muted rounded-tl-none'
                }`}
              >
                {msg.message}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
