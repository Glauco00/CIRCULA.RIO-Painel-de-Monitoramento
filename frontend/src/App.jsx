import React, { useState, useEffect } from 'react';
import { Clock, CalendarSearch, Lock, Unlock, RefreshCw } from 'lucide-react';
import DashboardCards from './components/DashboardCards';
import Charts from './components/Charts';
import circularioLogo from './assets/circulario (2).png';
import faperjLogo from './assets/faperj.png';
import quipoLogo from './assets/quipotech.png';
import './index.css';

function App() {
  const [data, setData] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filterMode, setFilterMode] = useState('realtime'); // 'realtime' | 'history'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [commandStatus, setCommandStatus] = useState('');
  const [sendingCommand, setSendingCommand] = useState(false);

  const fetchData = async () => {
    try {
      let historyUrl = 'http://localhost:3001/api/sensores';
      
      // If in history mode and dates are selected, append query params
      if (filterMode === 'history' && startDate && endDate) {
        historyUrl += `?start=${startDate}&end=${endDate}`;
      }

      const [historyRes, currentRes] = await Promise.all([
        fetch(historyUrl),
        fetch('http://localhost:3001/api/sensores/atual')
      ]);

      const historyData = await historyRes.json();
      const currentData = await currentRes.json();

      setData(historyData);
      setCurrent(currentData);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados da API:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Only set auto-refresh interval if in realtime mode
    let interval;
    if (filterMode === 'realtime') {
      interval = setInterval(fetchData, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filterMode]); // refetch when mode changes (realtime)

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      setFilterMode('history');
      fetchData(); // Fetch explicitly when submit is clicked
    }
  };

  const sendCommand = async (comando) => {
    setSendingCommand(true);
    setCommandStatus(`Enviando ${comando}...`);

    try {
      const response = await fetch('http://localhost:3001/api/esp/comando', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comando })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha ao enviar comando');
      setCommandStatus(`Comando ${comando} enviado`);
    } catch (error) {
      setCommandStatus(error.message);
    } finally {
      setSendingCommand(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container loading-container">
        <div className="status-indicator pulsing">
          <div className="status-dot"></div>
          Sincronizando sensores...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="logo-container">
            <img src={circularioLogo} alt="CIRCULA.RIO" className="brand-logo project-logo" />
          </div>
          <div className="header-titles">
            <h1>CIRCULA.RIO</h1>
            <p className="header-subtitle">Painel de Monitoramento</p>
          </div>
        </div>
        
        <div className={`status-indicator ${filterMode === 'realtime' ? 'active' : 'historical'}`}>
          <div className="status-dot" style={filterMode === 'history' ? { backgroundColor: '#f59e0b', animation: 'none', boxShadow: 'none' } : {}}></div>
          <span className="status-text">
            {filterMode === 'realtime' ? 'Online / Captando Dados' : 'Modo Histórico Ativo'}
          </span>
        </div>
      </header>

      <div className="filter-bar">
        <div className="filter-modes">
          <button 
            className={`btn-mode ${filterMode === 'realtime' ? 'active' : ''}`}
            onClick={() => {
              setFilterMode('realtime');
              setStartDate('');
              setEndDate('');
            }}
          >
            <Clock size={15} />
            Tempo Real
          </button>
          <button 
            className={`btn-mode ${filterMode === 'history' ? 'active' : ''}`}
            onClick={() => setFilterMode('history')}
          >
            <CalendarSearch size={15} />
            Histórico
          </button>
        </div>

        {filterMode === 'history' && (
          <>
            <div className="filter-divider"></div>
            <form className="filter-form" onSubmit={handleFilterSubmit}>
              <div className="input-group">
                <span className="input-icon"></span>
                <div className="input-inner">
                  <label>De</label>
                  <input 
                    type="datetime-local" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    required
                  />
                </div>
              </div>
              <span className="input-arrow">→</span>
              <div className="input-group">
                <span className="input-icon"></span>
                <div className="input-inner">
                  <label>Até</label>
                  <input 
                    type="datetime-local" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-search">
                Buscar
              </button>
            </form>
            {data.length > 0 && (
              <div className="filter-badge">{data.length} registros</div>
            )}
          </>
        )}

        {filterMode === 'realtime' && (
          <div className="filter-live-pill">
            <span className="live-dot"></span>
            Atualização a cada 5s
          </div>
        )}
      </div>

      <section className="command-panel glass-panel">
        <div className="command-heading">
          <div>
            <strong>Controle da tampa</strong>
            <span>Comandos enviados ao ESP pela porta serial</span>
          </div>
          <span className="command-status">{commandStatus}</span>
        </div>
        <div className="command-actions">
          <button className="btn-command" onClick={() => sendCommand('A0')} disabled={sendingCommand}>
            <Lock size={17} /> Fechar (A0)
          </button>
          <button className="btn-command open" onClick={() => sendCommand('A1')} disabled={sendingCommand}>
            <Unlock size={17} /> Abrir (A1)
          </button>
          <button className="btn-command toggle" onClick={() => sendCommand('A2')} disabled={sendingCommand}>
            <RefreshCw size={17} /> Alternar (A2)
          </button>
        </div>
      </section>

      <main className="dashboard-main">
        <section className="cards-section">
          <DashboardCards current={current} />
        </section>
        
        <section className="charts-section">
          <Charts data={data} />
        </section>
      </main>
      
      <footer className="dashboard-footer">
        <p>
          Projeto "Plataforma Inteligente de Gestão Circular de Resíduos Urbanos (CIRCULA.RIO)"
          financiado com recursos da FAPERJ (Processo 290.226/2026).
        </p>
        <div className="partner-logos" aria-label="Parceiros do projeto">
          <img src={quipoLogo} alt="Quipo Tech" />
          <img src={faperjLogo} alt="FAPERJ" />
        </div>
      </footer>
    </div>
  );
}

export default App;
