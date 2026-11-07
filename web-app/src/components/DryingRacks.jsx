import { useState } from 'react';
import { apiUrl } from '../api';

function DryingRacks({ racks, userId, language }) {
  const [showReserve, setShowReserve] = useState(false);
  const [count, setCount] = useState(1);

  const t = {
    tr: {
      available: 'Boş',
      total: 'Toplam',
      reserve: 'Askı Ayırt',
      selectCount: 'Kaç askı ayırtmak istiyorsunuz?',
      racks: 'askı',
      confirm: 'Onayla',
      cancel: 'İptal',
      yourRacks: 'Sizin askılar',
      occupied: 'Dolu'
    },
    en: {
      available: 'Available',
      total: 'Total',
      reserve: 'Reserve Rack',
      selectCount: 'How many racks do you want to reserve?',
      racks: 'racks',
      confirm: 'Confirm',
      cancel: 'Cancel',
      yourRacks: 'Your racks',
      occupied: 'Occupied'
    }
  };

  const userRacks = racks.filter(r => r.user === userId);
  const freeRacks = racks.filter(r => !r.occupied);
  const occupiedRacks = racks.filter(r => r.occupied);

  const handleReserve = async () => {
    try {
      const userName = localStorage.getItem('userName');
      const response = await fetch(apiUrl('/api/dry/reserve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          userId,
          count: parseInt(count)
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowReserve(false);
        if (result.queued) {
          alert(`Yeterli askı yok. Sıradasınız (${result.position})`);
        } else {
          alert(`Askı ${result.racks.join(', ')} ayrıldı!`);
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Rezervasyon hatası:', error);
      alert('Bir hata oluştu');
    }
  };

  const groupByUser = () => {
    const grouped = {};
    occupiedRacks.forEach(rack => {
      const userName = rack.userName || 'Unknown';
      if (!grouped[userName]) {
        grouped[userName] = [];
      }
      grouped[userName].push(rack.id);
    });
    return grouped;
  };

  const racksByUser = groupByUser();

  return (
    <div className="racks-container">
      <div className="racks-stats">
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <h4>{t[language].available}</h4>
            <p className="stat-value">{freeRacks.length}/{racks.length}</p>
          </div>
        </div>

        {userRacks.length > 0 && (
          <div className="stat-card user-stat">
            <div className="stat-icon">👤</div>
            <div className="stat-info">
              <h4>{t[language].yourRacks}</h4>
              <p className="stat-value">{userRacks.map(r => r.id).join(', ')}</p>
            </div>
          </div>
        )}
      </div>

      {userRacks.length === 0 && freeRacks.length > 0 && (
        <button className="btn-reserve-large" onClick={() => setShowReserve(true)}>
          {t[language].reserve}
        </button>
      )}

      <div className="racks-grid">
        {racks.map(rack => {
          const isUserRack = rack.user === userId;
          return (
            <div
              key={rack.id}
              className={`rack-item ${rack.occupied ? 'occupied' : 'free'} ${isUserRack ? 'user-rack' : ''}`}
            >
              <div className="rack-number">{rack.id}</div>
              {rack.occupied && (
                <div className="rack-user">{rack.userName}</div>
              )}
            </div>
          );
        })}
      </div>

      {Object.keys(racksByUser).length > 0 && (
        <div className="occupied-list">
          <h4>{t[language].occupied}:</h4>
          {Object.entries(racksByUser).map(([userName, rackIds]) => (
            <div key={userName} className="occupied-item">
              <span className="occupied-racks">{rackIds.join(', ')}</span>
              <span className="occupied-user">{userName}</span>
            </div>
          ))}
        </div>
      )}

      {showReserve && (
        <div className="modal-overlay" onClick={() => setShowReserve(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t[language].selectCount}</h3>
            <div className="count-selector">
              <button
                className={`btn-count ${count === 1 ? 'active' : ''}`}
                onClick={() => setCount(1)}
                disabled={freeRacks.length < 1}
              >
                1 {t[language].racks}
              </button>
              <button
                className={`btn-count ${count === 2 ? 'active' : ''}`}
                onClick={() => setCount(2)}
                disabled={freeRacks.length < 2}
              >
                2 {t[language].racks}
              </button>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleReserve}>
                {t[language].confirm}
              </button>
              <button className="btn-secondary" onClick={() => setShowReserve(false)}>
                {t[language].cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DryingRacks;
