import React from 'react';
import { Thermometer, Droplets, ArrowDownToLine } from 'lucide-react';

const DashboardCards = ({ current }) => {
  // Se não houver dados, exibir valores padrão
  const temp = current?.temperatura !== undefined ? current.temperatura : '--';
  const hum = current?.umidade !== undefined ? current.umidade : '--';
  const level = current?.nivel_calculado === 'Medio' ? 'Media' : (current?.nivel_calculado || 'Vazia');
  const levelPercent = typeof current?.distancia === 'number'
    ? Math.min(100, Math.max(0, current.distancia))
    : null;

  const tempPercent = typeof current?.temperatura === 'number' ? Math.min(100, Math.max(0, (current.temperatura / 50) * 100)) : 0;
  const humPercent = typeof current?.umidade === 'number' ? Math.min(100, Math.max(0, current.umidade)) : 0;
  const levelClass = level.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return (
    <div className="cards-grid">
      <div className="glass-panel stat-card temp">
        <div className="stat-header">
          <span>Temperatura</span>
          <Thermometer size={20} color="#f59e0b" />
        </div>
        <div className="stat-icon-container">
          <div className="icon-wrapper">
            <div className="thermo-gauge gauge-glass">
              <div className="thermo-fill" style={{ height: `${tempPercent}%` }}></div>
              <div className="thermo-bulb gauge-glass"></div>
            </div>
          </div>
          <div className="level-info">
            <div className="stat-value" style={{ color: '#f59e0b' }}>{temp}°C</div>
            <div className="stat-desc">Sensor Interno</div>
          </div>
        </div>
      </div>

      <div className="glass-panel stat-card humidity">
        <div className="stat-header">
          <span>Umidade</span>
          <Droplets size={20} color="#3b82f6" />
        </div>
        <div className="stat-icon-container">
          <div className="icon-wrapper">
            <div className="humidity-gauge gauge-glass">
              <div className="humidity-fill" style={{ height: `${humPercent}%` }}></div>
            </div>
          </div>
          <div className="level-info">
            <div className="stat-value" style={{ color: '#3b82f6' }}>{hum}%</div>
            <div className="stat-desc">Sensor Interno</div>
          </div>
        </div>
      </div>

      <div className="glass-panel stat-card level">
        <div className="stat-header">
          <span>Nível de preenchimento</span>
          <ArrowDownToLine size={20} color="#10b981" />
        </div>
        <div className="stat-icon-container">
          <div className="icon-wrapper">
            <div className="trash-bin gauge-glass">
              <div className="trash-bin-lid"></div>
              <div className={`trash-bin-fill ${levelClass}`} style={levelPercent !== null ? { height: `${levelPercent}%` } : {}}></div>
            </div>
          </div>
          <div className="level-info">
            <div className={`level-text ${levelClass}`}>{level}</div>
            <div className="stat-desc">
              {levelPercent !== null ? `${levelPercent}% preenchido` : '--'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;
