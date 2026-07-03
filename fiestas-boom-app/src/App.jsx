import React, { useState, useEffect } from 'react';
import ChatWidget from './components/ChatWidget';
import ManagerPanel from './components/ManagerPanel';
import { processMessage } from './api';
import { Sun, Moon } from 'lucide-react';
import './index.css';

const STORAGE_KEY = 'fiestasboom_react_history';

function App() {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: '¡Hola! 👋 Soy BoomBot, tu asistente de Fiestas Boom. ¿En qué puedo ayudarte hoy?',
      time: new Date().toISOString()
    }
  ]);
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    // Apply theme to document element
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error loading history", e);
    }
  }, []);

  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleQuickOption = async (actionId, text) => {
    if (actionId === 'call') {
      const userMsg = { type: 'user', text: "Quiero hablar con un asesor", time: new Date().toISOString() };
      const botMsg = { 
        type: 'bot', 
        text: '¡Claro que sí! Puedes comunicarte directamente con nuestro equipo de ventas a través de WhatsApp o llamada telefónica al número: 0967901203.\\n\\n¡Estaremos felices de atenderte!',
        time: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg, botMsg]);
      return;
    }
    
    if (actionId === 'gallery') {
      const userMsg = { type: 'user', text: "Quiero ver la galería de fotos", time: new Date().toISOString() };
      const botMsg = { 
        type: 'bot', 
        isGallery: true,
        text: '¡Claro! Aquí tienes algunas fotos de nuestros mejores eventos:',
        time: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg, botMsg]);
      return;
    }
    
    handleSendMessage(text);
  };

  const handleSendMessage = async (text) => {
    if (!text || text.length < 5) {
      showToast('⚠️ Escribe un mensaje más detallado para que pueda analizarlo.');
      return;
    }

    const dateRegex = /\\b\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?\\b/;
    const match = text.match(dateRegex);
    if (match) {
      const partes = match[0].split(/[/-]/);
      let dia = parseInt(partes[0]);
      let mes = parseInt(partes[1]);
      if (mes > 12 && dia <= 12) { let temp = dia; dia = mes; mes = temp; }
      const anio = partes[2] ? (partes[2].length === 2 ? 2000 + parseInt(partes[2]) : parseInt(partes[2])) : new Date().getFullYear();
      const inputDate = new Date(anio, mes - 1, dia);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (inputDate < today) {
         showToast('⚠️ La fecha mencionada parece ser en el pasado. Ingresa una fecha futura.');
         return;
      }
    }

    const userMsg = { type: 'user', text, time: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const parsedResponse = await processMessage(text, history);
      
      const botMsg = { 
        type: 'bot', 
        text: parsedResponse.respuesta_cliente || 'Lo siento, no pude procesar la respuesta.', 
        parsed: parsedResponse,
        time: new Date().toISOString() 
      };

      setMessages(prev => [...prev, botMsg]);
      
      const historyItem = {
        text,
        parsed: parsedResponse,
        time: new Date().toISOString()
      };
      saveHistory([historyItem, ...history].slice(0, 20));

    } catch (err) {
      console.error(err);
      if (err.message.includes("high demand") || err.message.includes("overloaded")) {
        const fallbackMsg = {
          type: 'bot',
          text: 'Lo sentimos, nuestros agentes están ocupados. Intenta de nuevo más tarde.',
          parsed: {
            tipo_mensaje: "Fallback",
            prioridad: "No determinada",
            urgencia: "No determinada",
            reclamo_repetido: false,
            respuesta_cliente: "Lo sentimos, nuestros agentes están ocupados. Intenta de nuevo más tarde.",
            recomendacion_interna: "Revisar cuotas de API por alta demanda."
          },
          time: new Date().toISOString()
        };
        setMessages(prev => [...prev, fallbackMsg]);
        saveHistory([{text, parsed: fallbackMsg.parsed, time: fallbackMsg.time}, ...history].slice(0, 20));
      } else {
        setMessages(prev => [...prev, { type: 'bot', text: `❌ Error de conexión: ${err.message}`, time: new Date().toISOString() }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
    setMessages([{
      type: 'bot',
      text: '¡Hola! 👋 Soy BoomBot, tu asistente de Fiestas Boom. ¿En qué puedo ayudarte hoy?',
      time: new Date().toISOString()
    }]);
    showToast('🗑️ Conversación y panel limpiados');
  };

  return (
    <>
      <button onClick={toggleTheme} className="theme-toggle-btn" title="Cambiar tema">
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="app-container">
        {/* Balloon Background Animation */}
        <div className="balloons-bg">
          <div className="balloon">🎈</div>
          <div className="balloon">🎉</div>
          <div className="balloon">✨</div>
          <div className="balloon">🎈</div>
          <div className="balloon">🎊</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
          <ChatWidget 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            onQuickOption={handleQuickOption}
            isTyping={isTyping} 
          />
        </div>
        
        <div style={{ zIndex: 1 }}>
          <ManagerPanel 
            history={history} 
            onClearHistory={handleClearHistory} 
          />
        </div>

        {toast && (
          <div className="toast show">
            {toast}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
