import { useState, useEffect } from 'react';
import WashingMachines from './components/WashingMachines';
import DryingRacks from './components/DryingRacks';
import QueueStatus from './components/QueueStatus';
import UserPanel from './components/UserPanel';
import AdminPanel from './components/AdminPanel';
import { apiUrl, websocketUrl } from './api';

function createUserId() {
  return globalThis.crypto?.randomUUID?.()
    || `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function App() {
  const [data, setData] = useState(null);
  const [userId, setUserId] = useState(
    localStorage.getItem('userId') || localStorage.getItem('userPhone') || ''
  );
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'tr');
  const [connectionLimit, setConnectionLimit] = useState(0);

  useEffect(() => {
    if (!userId) return undefined;

    let websocket;
    let reconnectTimer;
    let reconnectDelay = 1000;
    let disposed = false;

    const connect = () => {
      websocket = new WebSocket(websocketUrl());

      websocket.onopen = () => {
        reconnectDelay = 1000;
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'init' || message.type === 'update') {
            setData(message.data);
            setConnectionLimit(0);
          } else if (message.type === 'error' && message.code === 'SERVER_FULL') {
            setConnectionLimit(message.limit);
          }
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        websocket.close();
      };

      websocket.onclose = () => {
        if (disposed) return;
        reconnectTimer = window.setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      };
    };

    connect();

    return () => {
      disposed = true;
      window.clearTimeout(reconnectTimer);
      websocket?.close();
    };
  }, [userId]);

  useEffect(() => {
    fetch(apiUrl('/api/status'))
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (userId) {
      fetch(apiUrl('/api/admin/check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
        .then(res => res.json())
        .then(result => setIsAdmin(result.isAdmin))
        .catch(console.error);
    }
  }, [userId]);

  const t = {
    tr: {
      title: 'Çamaşırhane Yönetim Sistemi',
      machines: 'Çamaşır Makineleri',
      racks: 'Kurutma Askıları',
      queue: 'Sıra',
      yourInfo: 'Bilgileriniz',
      name: 'Adınız',
      save: 'Kaydet',
      admin: 'Admin Paneli',
      loading: 'Yükleniyor...',
      switchLang: 'Switch to English'
    },
    en: {
      title: 'Laundry Management System',
      machines: 'Washing Machines',
      racks: 'Drying Racks',
      queue: 'Queue',
      yourInfo: 'Your Information',
      name: 'Your Name',
      save: 'Save',
      admin: 'Admin Panel',
      loading: 'Loading...',
      switchLang: 'Türkçeye geç'
    }
  };

  const handleSaveUser = (event) => {
    event.preventDefault();
    const name = userName.trim();
    if (!name) return;

    const id = userId || createUserId();
    setUserId(id);
    setUserName(name);
    localStorage.setItem('userId', id);
    localStorage.setItem('userName', name);
    localStorage.removeItem('userPhone');
  };

  const toggleLanguage = () => {
    const newLang = language === 'tr' ? 'en' : 'tr';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  if (!data) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>{t[language].loading}</p>
      </div>
    );
  }

  if (!userId || !userName) {
    return (
      <div className="login-container">
        <form className="login-card" onSubmit={handleSaveUser}>
          <h1>🧺 {t[language].title}</h1>
          <div className="form-group">
            <label>{t[language].name}</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={language === 'tr' ? 'Adınız' : 'Your name'}
              autoComplete="name"
              required
              maxLength={60}
            />
          </div>
          <button className="btn-primary" type="submit">
            {t[language].save}
          </button>
          <button className="btn-secondary" type="button" onClick={toggleLanguage}>
            {t[language].switchLang}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧺 {t[language].title}</h1>
        <div className="header-actions">
          <button className="btn-lang" onClick={toggleLanguage}>
            {language === 'tr' ? '🇬🇧 EN' : '🇹🇷 TR'}
          </button>
          {isAdmin && (
            <button
              className="btn-admin"
              onClick={() => setShowAdminPanel(!showAdminPanel)}
            >
              👨‍💼 {t[language].admin}
            </button>
          )}
          <div className="user-info">
            <span>{userName}</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        {connectionLimit > 0 && (
          <div className="connection-notice" role="status">
            {language === 'tr'
              ? `Sunucu şu anda ${connectionLimit} kullanıcı sınırına ulaştı. Lütfen daha sonra tekrar deneyin.`
              : `The server has reached its limit of ${connectionLimit} connected users. Please try again later.`}
          </div>
        )}
        {showAdminPanel && isAdmin ? (
          <AdminPanel
            data={data}
            userId={userId}
            language={language}
            onClose={() => setShowAdminPanel(false)}
          />
        ) : (
          <>
            <UserPanel
              data={data}
              userId={userId}
              userName={userName}
              language={language}
            />

            <section className="section">
              <h2>{t[language].machines}</h2>
              <WashingMachines
                machines={data.washingMachines}
                userId={userId}
                language={language}
              />
            </section>

            <section className="section">
              <h2>{t[language].racks}</h2>
              <DryingRacks
                racks={data.dryingRacks}
                userId={userId}
                language={language}
              />
            </section>

            <section className="section">
              <h2>{t[language].queue}</h2>
              <QueueStatus
                washQueue={data.washQueue}
                dryQueue={data.dryQueue}
                language={language}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
