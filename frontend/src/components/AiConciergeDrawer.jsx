import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Utensils,
  Calendar,
  ChevronDown,
  RotateCcw,
  Zap,
} from 'lucide-react';

const QUICK_PROMPTS = [
  'Recommend authentic North Indian vegetarian dishes',
  'What is the best Dum Biryani and Dal Makhani?',
  'Check available tables for 4 at 8 PM tonight',
  'Explain the 60% pre-order deposit discount',
];

const AiConciergeDrawer = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeToolStatus, setActiveToolStatus] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Namaste! I am your **Personal Dining Concierge** at **Chatori Gali**.\n\nWhether you're craving rich North Indian tandoori feasts, hearty Amritsari kulchas, slow-cooked Dal Bukhara, or fragrant Awadhi biryanis, I am here to help you discover allergen-safe dishes, calculate pre-order deposits, and check live table availability.\n\nWhat delicious feast can I help you plan today?",
      suggestedActions: [
        { label: '🍛 North Indian Specials', prompt: 'Recommend the best North Indian tandoor dishes and curries' },
        { label: '🥗 Pure Veg & High Protein', prompt: 'Show me healthy vegetarian and paneer dishes with high protein' },
        { label: '📅 Check Table Slots', prompt: 'Are tables available for 4 people tonight at 7:30 PM?' },
      ],
    },
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, activeToolStatus]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isStreaming) return;

    setInputMessage('');
    const newHistory = [...messages, { role: 'user', content: text }];
    setMessages(newHistory);
    setIsStreaming(true);
    setActiveToolStatus('✨ Preparing your dining recommendations...');

    // Prepare an empty assistant response bubble
    const assistantIndex = newHistory.length;
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '',
        suggestedActions: [],
      },
    ]);

    try {
      const response = await fetch('http://localhost:5000/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          message: text,
          chatHistory: newHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() || ''; // Keep partial block

        for (const block of blocks) {
          if (!block.trim()) continue;
          const lines = block.split(/\r?\n/);
          const eventLine = lines.find((l) => l.startsWith('event:'));
          const dataLine = lines.find((l) => l.startsWith('data:'));
          const eventType = eventLine ? eventLine.replace('event:', '').trim() : '';
          const rawData = dataLine ? dataLine.replace('data:', '').trim() : '';

          if (rawData === '[DONE]') continue;

          try {
            const data = JSON.parse(rawData);

            if (eventType === 'status') {
              setActiveToolStatus(data.message);
            } else if (eventType === 'token') {
              accumulatedText += data.chunk;
              setMessages((prev) =>
                prev.map((msg, idx) =>
                  idx === assistantIndex ? { ...msg, content: accumulatedText } : msg
                )
              );
            } else if (eventType === 'actions') {
              setMessages((prev) =>
                prev.map((msg, idx) =>
                  idx === assistantIndex
                    ? { ...msg, suggestedActions: data.actions || [] }
                    : msg
                )
              );
            }
          } catch (e) {
            // non-json line
          }
        }
      }
    } catch (err) {
      console.error('Chat stream error:', err);
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === assistantIndex
            ? {
                ...msg,
                content:
                  msg.content ||
                  "I apologize, but I encountered an error connecting to the AI dining engine. Please try again.",
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      setActiveToolStatus('');
    }
  };

  const handleActionClick = (action) => {
    if (action.prompt) {
      handleSendMessage(action.prompt);
    } else if (action.type === 'book_table') {
      navigate('/book/660c1b000000000000000001', {
        state: { guestsCount: action.payload?.guestsCount, timeSlot: action.payload?.timeSlot },
      });
      setIsOpen(false);
    } else if (action.type === 'preorder') {
      navigate('/book/660c1b000000000000000001', {
        state: { preselectedItem: action.payload?.dishId },
      });
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        id="ai-concierge-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={styles.floatingTrigger}
        title="Open AI Dining Concierge"
      >
        <span style={styles.pulseDot} />
        <Sparkles size={20} color="#000" />
        <span style={styles.triggerLabel}>AI Concierge</span>
      </button>

      {/* Slide-out Drawer */}
      {isOpen && (
        <div style={styles.drawerBackdrop} onClick={() => setIsOpen(false)}>
          <div style={styles.drawerCard} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={styles.header}>
              <div style={styles.headerInfo}>
                <div style={styles.avatar}>
                  <Bot size={22} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={styles.title}>
                    Chatori Gali Concierge
                    <span style={styles.badge}>Live Assistant</span>
                  </h3>
                  <div style={styles.subtitle}>
                    <span style={styles.onlineDot} /> Online • Ready to Assist
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() =>
                    setMessages([
                      {
                        role: 'assistant',
                        content: 'How can I assist you with your dining plans today?',
                      },
                    ])
                  }
                  style={styles.iconBtn}
                  title="Clear conversation"
                >
                  <RotateCcw size={16} />
                </button>
                <button onClick={() => setIsOpen(false)} style={styles.iconBtn} title="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Concierge Services Banner */}
            <div style={styles.architecturePill}>
              <Sparkles size={14} color="var(--primary)" />
              <span>Instant Table Bookings • Personalized Recommendations • Dietary & Allergen Guide</span>
            </div>

            {/* Messages Scroll Area */}
            <div style={styles.messagesList}>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    ...styles.messageRow,
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {m.role === 'assistant' && (
                    <div style={styles.msgAvatar}>
                      <Bot size={16} color="var(--primary)" />
                    </div>
                  )}

                  <div
                    style={{
                      ...styles.bubble,
                      ...(m.role === 'user' ? styles.userBubble : styles.assistantBubble),
                    }}
                  >
                    {/* Render message content or thinking dots if empty & streaming */}
                    {!m.content && isStreaming && idx === messages.length - 1 ? (
                      <div style={styles.thinkingContainer}>
                        <span style={styles.thinkingDot} />
                        <span style={{ ...styles.thinkingDot, animationDelay: '0.2s' }} />
                        <span style={{ ...styles.thinkingDot, animationDelay: '0.4s' }} />
                      </div>
                    ) : (
                      <div style={styles.messageContent}>
                        {m.content.split('\n').map((line, li) => {
                          if (!line.trim()) return <div key={li} style={{ height: '0.4rem' }} />;
                          // Bold parsing
                          const parts = line.split(/(\*\*.*?\*\*)/g);
                          return (
                            <p key={li} style={{ margin: '0.2rem 0', lineHeight: '1.45' }}>
                              {parts.map((p, pi) => {
                                if (p.startsWith('**') && p.endsWith('**')) {
                                  return <strong key={pi}>{p.slice(2, -2)}</strong>;
                                }
                                return p;
                              })}
                            </p>
                          );
                        })}
                      </div>
                    )}

                    {/* Suggested Action Chips */}
                    {m.suggestedActions && m.suggestedActions.length > 0 && (
                      <div style={styles.actionsGrid}>
                        {m.suggestedActions.map((action, ai) => (
                          <button
                            key={ai}
                            onClick={() => handleActionClick(action)}
                            style={styles.actionChip}
                          >
                            <Utensils size={12} color="var(--primary)" />
                            <span>{action.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {m.role === 'user' && (
                    <div style={styles.userMsgAvatar}>
                      <User size={16} color="#000" />
                    </div>
                  )}
                </div>
              ))}

              {/* Single Live Streaming Indicator */}
              {isStreaming && (
                <div style={styles.streamingIndicatorRow}>
                  <div style={styles.pulseDot} />
                  <span style={styles.streamingText}>{activeToolStatus || '✨ Preparing your dining recommendations...'}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Suggestions */}
            {messages.length < 3 && (
              <div style={styles.quickPromptsRow}>
                {QUICK_PROMPTS.map((prompt, pi) => (
                  <button
                    key={pi}
                    onClick={() => handleSendMessage(prompt)}
                    style={styles.promptBtn}
                    disabled={isStreaming}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div style={styles.inputArea}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask about dishes, allergens, table slots, or 60% deposit..."
                style={styles.input}
                disabled={isStreaming}
              />
              <button
                onClick={() => handleSendMessage()}
                style={{
                  ...styles.sendBtn,
                  opacity: !inputMessage.trim() || isStreaming ? 0.5 : 1,
                }}
                disabled={!inputMessage.trim() || isStreaming}
              >
                <Send size={16} color="#000" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  floatingTrigger: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.75rem 1.25rem',
    borderRadius: 'var(--radius-full)',
    background: 'linear-gradient(135deg, #d4af37, #f3e5ab)',
    border: 'none',
    color: '#000',
    fontWeight: '700',
    fontSize: '0.9rem',
    boxShadow: '0 8px 24px rgba(212, 175, 55, 0.4)',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 8px #10b981',
    animation: 'pulse 1.5s infinite',
  },
  triggerLabel: {
    letterSpacing: '0.02em',
  },
  drawerBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawerCard: {
    width: '100%',
    maxWidth: '470px',
    height: '100%',
    background: 'rgba(20, 34, 50, 0.98)',
    borderLeft: '1.5px solid rgba(255, 215, 0, 0.35)',
    boxShadow: '-12px 0 45px rgba(0, 0, 0, 0.75)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  header: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#101c2a',
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255, 215, 0, 0.15)',
    border: '1.5px solid rgba(255, 215, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '1.05rem',
    fontWeight: '800',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    margin: 0,
  },
  badge: {
    fontSize: '0.65rem',
    padding: '0.2rem 0.55rem',
    borderRadius: '4px',
    background: '#ffd700',
    color: '#142232',
    fontWeight: '800',
    border: '1px solid #ffd700',
    letterSpacing: '0.04em',
  },
  subtitle: {
    fontSize: '0.76rem',
    color: '#cbd5e1',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginTop: '0.2rem',
  },
  onlineDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 8px #10b981',
  },
  iconBtn: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 215, 0, 0.25)',
    color: '#f8fafc',
    borderRadius: 'var(--radius-sm)',
    padding: '0.45rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  architecturePill: {
    background: 'rgba(255, 215, 0, 0.08)',
    borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
    padding: '0.55rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.55rem',
    fontSize: '0.74rem',
    color: '#ffd700',
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.15rem',
  },
  messageRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
  },
  msgAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255, 215, 0, 0.15)',
    border: '1.5px solid rgba(255, 215, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },
  userMsgAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#ffd700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: '14px',
    padding: '0.95rem 1.15rem',
    fontSize: '0.9rem',
    lineHeight: '1.55',
  },
  assistantBubble: {
    background: '#1a2c40',
    border: '1.5px solid rgba(255, 215, 0, 0.25)',
    color: '#f8fafc',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
  },
  userBubble: {
    background: 'linear-gradient(135deg, #ffd700, #f59e0b)',
    border: '1px solid #ffd700',
    color: '#142232',
    fontWeight: '600',
    boxShadow: '0 4px 16px rgba(255, 215, 0, 0.3)',
  },
  messageContent: {
    wordBreak: 'break-word',
    color: 'inherit',
  },
  thinkingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0.35rem 0.2rem',
  },
  thinkingDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#ffd700',
    display: 'inline-block',
    animation: 'pulse 1.2s infinite ease-in-out',
  },
  actionsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.95rem',
  },
  actionChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    background: 'rgba(255, 215, 0, 0.12)',
    border: '1.5px solid rgba(255, 215, 0, 0.45)',
    borderRadius: 'var(--radius-full)',
    padding: '0.4rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#ffd700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  streamingIndicatorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.55rem',
    fontSize: '0.82rem',
    color: '#ffd700',
    paddingLeft: '2.5rem',
  },
  streamingText: {
    fontStyle: 'italic',
    fontWeight: '600',
  },
  quickPromptsRow: {
    padding: '0.65rem 1.25rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.45rem',
    borderTop: '1px solid rgba(255, 215, 0, 0.15)',
    background: 'rgba(10, 18, 30, 0.5)',
  },
  promptBtn: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: 'var(--radius-full)',
    padding: '0.35rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  inputArea: {
    padding: '1rem 1.25rem',
    borderTop: '1px solid rgba(255, 215, 0, 0.2)',
    display: 'flex',
    gap: '0.75rem',
    background: '#101c2a',
  },
  input: {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1.5px solid rgba(255, 215, 0, 0.3)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.75rem 1rem',
    color: '#ffffff',
    fontSize: '0.88rem',
    outline: 'none',
  },
  sendBtn: {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-sm)',
    background: '#ffd700',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default AiConciergeDrawer;
