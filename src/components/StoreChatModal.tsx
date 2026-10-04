import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Retailer } from '../types';
import { subscribeMessages, sendMessage } from '../services/firebaseService';

interface StoreChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  retailer: Retailer;
  customerId: string;
  customerName: string;
  senderRole: 'customer' | 'retailer';
  orderId?: string;
}

export const StoreChatModal: React.FC<StoreChatModalProps> = ({
  isOpen,
  onClose,
  retailer,
  customerId,
  customerName,
  senderRole,
  orderId
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !retailer.id) return;

    const unsub = subscribeMessages(retailer.id, customerId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsub();
  }, [isOpen, retailer.id, customerId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendMessage({
        retailerId: retailer.id,
        customerId,
        customerName,
        sender: senderRole,
        text: textToSend,
        orderId
      });
    } catch (err: any) {
      alert(`Failed to send message: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    'Is fresh milk & paneer available right now?',
    'Can you please keep my order ready by 6:00 PM?',
    'Do you have 5 kg Basmati Rice in stock?',
    'I have arrived at your shop counter.'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col h-[620px] max-h-[92vh] overflow-hidden z-10 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <img
              src={retailer.logoUrl || 'https://via.placeholder.com/40'}
              alt={retailer.shopName}
              className="w-10 h-10 rounded-full object-cover border border-outline-variant/30"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-headline-sm text-[16px] text-on-surface font-bold leading-tight">
                  {retailer.shopName}
                </h3>
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              </div>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                Direct Store Chat • {retailer.ownerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-surface-container-lowest">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center mx-auto text-secondary">
                <span className="material-symbols-outlined text-[26px]">chat</span>
              </div>
              <div>
                <p className="font-label-md text-label-md font-bold text-on-surface">
                  Start a conversation with {retailer.shopName}
                </p>
                <p className="font-body-sm text-body-sm max-w-xs mx-auto text-on-surface-variant mt-0.5">
                  Ask questions about stock availability, pickup timings, or custom product requests.
                </p>
              </div>

              {senderRole === 'customer' && (
                <div className="pt-2 flex flex-col gap-1.5 text-left max-w-sm mx-auto">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase">Suggested Questions:</span>
                  {quickPrompts.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInputText(q)}
                      className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-body-sm font-medium border border-outline-variant/30 text-left transition"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender === senderRole;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-on-surface-variant px-1 mb-0.5 font-medium">
                    {isMe ? 'You' : m.sender === 'retailer' ? retailer.shopName : m.customerName}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-xs font-body-sm text-body-sm leading-relaxed ${
                      isMe
                        ? 'bg-primary text-on-primary rounded-br-xs'
                        : 'bg-surface-container text-on-surface rounded-bl-xs border border-outline-variant/20'
                    }`}
                  >
                    <p>{m.text}</p>
                    <span
                      className={`text-[9px] block text-right mt-1 opacity-70`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-surface-container-low border-t border-outline-variant/20 flex gap-2">
          <input
            type="text"
            placeholder={`Message ${retailer.shopName}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-secondary"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition disabled:opacity-40 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
