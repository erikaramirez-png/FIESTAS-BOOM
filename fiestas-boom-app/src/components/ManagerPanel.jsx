import React from 'react';
import './ManagerPanel.css';
import { Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function ManagerPanel({ history, onClearHistory }) {
  if (history.length === 0) {
    return (
      <div className="manager-panel empty">
        <div className="panel-header">
          <h3>Panel Gerencial (Interno)</h3>
        </div>
        <div className="empty-state">
          <p>Las evaluaciones de los mensajes aparecerán aquí en tiempo real.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-panel">
      <div className="panel-header">
        <h3>Panel Gerencial (Interno)</h3>
        <button onClick={onClearHistory} className="clear-btn" title="Limpiar historial">
          <Trash2 size={16} /> Limpiar
        </button>
      </div>

      <div className="history-list">
        {history.map((item, idx) => {
          const parsed = item.parsed;
          const isError = !parsed || parsed.tipo_mensaje === 'Error de Parseo';
          
          if (isError) {
            return (
              <div key={idx} className="history-card error">
                <div className="card-header">
                  <span className="client-msg">"{item.text}"</span>
                  <span className="time">{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="error-alert">
                  <AlertTriangle size={14} /> Mensaje no procesado correctamente.
                </div>
              </div>
            );
          }

          const isRepetido = parsed.reclamo_repetido === true || parsed.reclamo_repetido === "true";
          const priorityClass = (parsed.prioridad || '').toLowerCase().trim();
          const urgencyClass = (parsed.urgencia || '').toLowerCase().trim();

          return (
            <div key={idx} className="history-card">
              <div className="card-header">
                <span className="client-msg">"{item.text}"</span>
                <span className="time">{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <div className="badges">
                <span className="badge type">{parsed.tipo_mensaje}</span>
                <span className={`badge prio ${priorityClass}`}>PRIORIDAD: {parsed.prioridad}</span>
                <span className={`badge urg ${urgencyClass}`}>URGENCIA: {parsed.urgencia}</span>
                {isRepetido && <span className="badge rep"><AlertTriangle size={12}/> REPETIDO</span>}
              </div>

              <div className="recommendation">
                <strong>Recomendación Interna:</strong>
                <p>{parsed.recomendacion_interna}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
