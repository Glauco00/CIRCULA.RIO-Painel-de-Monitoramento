import React from 'react';
import { 
  AreaChart, Area, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, ArrowDownToLine, PieChart as PieChartIcon } from 'lucide-react';

const Charts = ({ data }) => {
  const chartData = data.map(d => {
    const dateObj = new Date(d.data);
    return {
      time: `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`,
      Temperatura: d.temperatura,
      Umidade: d.umidade,
      Nivel: typeof d.distancia === 'number' ? Math.min(100, Math.max(0, d.distancia)) : null
    };
  });

  // Calculate Level Distribution
  const levelCounts = data.reduce((acc, curr) => {
    const receivedLevel = curr.nivel_calculado || 'Vazia';
    const level = receivedLevel === 'Aberto' ? 'Aberta' : receivedLevel;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(levelCounts).map(key => ({
    name: key,
    value: levelCounts[key]
  }));

  const COLORS = {
    'Cheia': '#ef4444',
    'Media': '#f59e0b',
    'Medio': '#f59e0b',
    'Vazia': '#10b981',
    'Aberta': '#2563eb',
    'Indefinido': '#94a3b8',
    'Erro': '#64748b'
  };

  if (chartData.length === 0) {
    return (
      <div className="glass-panel chart-panel full-width">
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          Aguardando dados da lixeira...
        </div>
      </div>
    );
  }

  return (
    <div className="charts-grid">
      {/* 1. Clima (Temp e Umi) */}
      <div className="glass-panel chart-panel full-width">
        <div className="chart-header">
          <TrendingUp size={20} color="#2563eb" />
          Clima Interno (Temperatura e Umidade)
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} 
              />
              <Legend />
              <Area type="monotone" dataKey="Temperatura" stroke="#d97706" fillOpacity={1} fill="url(#colorTemp)" />
              <Area type="monotone" dataKey="Umidade" stroke="#2563eb" fillOpacity={1} fill="url(#colorHum)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Percentual de preenchimento */}
      <div className="glass-panel chart-panel">
        <div className="chart-header">
          <ArrowDownToLine size={20} color="#10b981" />
          Preenchimento da lixeira (%)
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} 
              />
              <Area type="monotone" dataKey="Nivel" name="Preenchimento (%)" stroke="#10b981" fillOpacity={1} fill="url(#colorDist)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Status Pie Chart */}
      <div className="glass-panel chart-panel">
        <div className="chart-header">
          <PieChartIcon size={20} color="#8b5cf6" />
          Distribuição de Nível
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="65%"
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} 
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Charts;
