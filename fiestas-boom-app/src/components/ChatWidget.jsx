import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown, X, Send, Calendar, Image as ImageIcon, Headphones, MessageSquare } from 'lucide-react';
import './ChatWidget.css';

export default function ChatWidget({ messages, onSendMessage, onQuickOption, isTyping }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim().length > 0) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const renderText = (text) => {
    if (typeof text !== 'string') return text;
    
    const lines = text.split(/\\n|\n/);
    return lines.map((line, i) => {
      // Basic bold parsing: **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <React.Fragment key={i}>
          {renderedParts}
          {i !== lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="chat-widget">
      {/* HEADER */}
      <div className="chat-header">
        <div className="header-actions">
          <ChevronDown size={20} className="action-icon" />
          <X size={20} className="action-icon" />
        </div>
        
        <div className="header-content">
          <div className="logo-container">
            <img src="/fotos/logo/logo.png" alt="Fiestas Boom Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
          <div className="brand-info">
            <h2>Fiestas Boom 🎉</h2>
            <p>Tu mejor fiesta, nuestro compromiso.</p>
            <div className="status">
              <span className="status-dot"></span>
              En línea
            </div>
          </div>
        </div>
        <div className="header-bg-decor"></div>
      </div>

      {/* MESSAGES */}
      <div className="chat-body">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-row ${msg.type === 'user' ? 'user' : 'bot'}`}>
            {msg.type === 'bot' && (
              <div className="bot-avatar">
                <img src="/fotos/logo/logo.png" alt="BoomBot" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              </div>
            )}
            <div className="message-content">
              <div className="bubble">
                {renderText(msg.text)}
                
                {/* GALLERY INJECTION */}
                {msg.isGallery && (
                  <div className="gallery-grid">
                    <img src="/fotos/eventos/2107dad2-e735-478a-9d3f-dc5a6a71d834.png" alt="Evento 1" />
                    <img src="/fotos/eventos/d485bb32-4891-4528-801b-042165c1b05c.png" alt="Evento 2" />
                    <img src="/fotos/eventos/e0fc7a6a-7f8a-48e1-8d6f-e3604d2d8f11.png" alt="Evento 3" />
                    <img src="/fotos/eventos/ffc7a539-591b-4d12-9b86-8b1307e73e81.png" alt="Evento 4" />
                  </div>
                )}
              </div>
              <div className="time">
                {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {msg.type === 'user' && <span className="read-receipt">✓✓</span>}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message-row bot">
            <div className="bot-avatar">
              <img src="/fotos/logo/logo.png" alt="BoomBot" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            <div className="message-content">
              <div className="bubble typing">
                <span>Escribiendo...</span>
                <div className="dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

        {messages.length === 1 && !isTyping && (
          <div className="quick-options">
            <p>O elige una opción rápida:</p>
            <div className="options-grid">
              <button className="option-btn" onClick={() => onQuickOption('chat', "Quiero cotizar un evento")}>
                <div className="icon-wrapper"><MessageSquare size={20} /></div>
                <div className="option-text">
                  <strong>Cotizar un evento</strong>
                  <span>Quiero una cotización</span>
                </div>
              </button>
              <button className="option-btn" onClick={() => onQuickOption('chat', "Quiero ver sus paquetes")}>
                <div className="icon-wrapper"><Calendar size={20} /></div>
                <div className="option-text">
                  <strong>Ver paquetes</strong>
                  <span>Conoce nuestros paquetes</span>
                </div>
              </button>
              <button className="option-btn" onClick={() => onQuickOption('gallery')}>
                <div className="icon-wrapper"><ImageIcon size={20} /></div>
                <div className="option-text">
                  <strong>Galería</strong>
                  <span>Ver fotos de eventos</span>
                </div>
              </button>
              <button className="option-btn" onClick={() => onQuickOption('call')}>
                <div className="icon-wrapper"><Headphones size={20} /></div>
                <div className="option-text">
                  <strong>Hablar con asesor</strong>
                  <span>Contacto humano</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="chat-footer">
        <form onSubmit={handleSubmit} className="input-form">
          <input 
            type="text" 
            placeholder="Escribe tu mensaje..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={!input.trim()}>
            <Send size={20} />
          </button>
        </form>
        <div className="watermark">
          Desarrollado con 💜 para Fiestas Boom
        </div>
      </div>
    </div>
  );
}
