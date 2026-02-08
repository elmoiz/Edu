import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const Chat = ({ messages, onSendMessage, currentUser }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-hide">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-2 ${msg.sender._id === currentUser._id ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              msg.sender._id === currentUser._id
                ? 'bg-primary'
                : msg.role === 'teacher'
                ? 'bg-secondary'
                : 'bg-dark-light'
            }`}>
              {msg.sender.username[0]}
            </div>
            <div className={`max-w-[70%] ${
              msg.sender._id === currentUser._id ? 'items-end' : 'items-start'
            }`}>
              <div className={`px-3 py-2 rounded-2xl text-sm ${
                msg.sender._id === currentUser._id
                  ? 'bg-primary text-white rounded-tr-sm'
                  : msg.role === 'teacher'
                  ? 'bg-secondary/20 text-secondary border border-secondary/30 rounded-tl-sm'
                  : 'bg-dark-light text-gray-200 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
              <span className="text-xs text-gray-500 mt-1 block">
                {msg.sender.username} • {formatTime(msg.createdAt)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="اكتب رسالتك..."
          className="flex-1 bg-dark-light border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="p-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default Chat;