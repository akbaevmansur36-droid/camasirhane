import { useState } from 'react';
import { apiUrl } from '../api';

function WashingMachines({ machines, userId, language }) {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [duration, setDuration] = useState(45);
  const [showReserve, setShowReserve] = useState(false);

  const t = {
    tr: {
      machine: 'Makine',
      free: 'Boş',
      occupied: 'Dolu',
      reserve: 'Ayırt',
      timeLeft: 'dk kaldı',
      selectDuration: 'Süre seçin (dakika)',
      confirm: 'Onayla',
      cancel: 'İptal',
      yourMachine: 'Sizin makine'
    },
    en: {
      machine: 'Machine',
      free: 'Free',
      occupied: 'Occupied',
      reserve: 'Reserve',
      timeLeft: 'min left',
      selectDuration: 'Select duration (minutes)',
      confirm: 'Confirm',
      cancel: 'Cancel',
      yourMachine: 'Your machine'
    }
  };

  const handleReserve = async () => {
    try {
      const userName = localStorage.getItem('userName');
      const response = await fetch(apiUrl('/api/wash/reserve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          userId,
          duration: parseInt(duration)
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowReserve(false);
        if (result.queued) {
          alert(`Tüm makineler dolu. Sıradasınız (${result.position})`);
        } else {
          alert(`Makine ${result.machine.id} ayrıldı!`);
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Rezervasyon hatası:', error);
      alert('Bir hata oluştu');
    }
  };

  const getTimeRemaining = (machine) => {
    if (!machine.startTime || !machine.duration) return 0;
    const elapsed = Math.floor((Date.now() - machine.startTime) / 60000);
    const remaining = machine.duration - elapsed;
    return remaining > 0 ? remaining : 0;
  };

  const userMachine = machines.find(m => m.user === userId);

  return (
    <div className="machines-grid">
      {machines.map(machine => {
        const isUserMachine = machine.user === userId;
        const remaining = getTimeRemaining(machine);

        return (
          <div
            key={machine.id}
            className={`machine-card ${machine.occupied ? 'occupied' : 'free'} ${isUserMachine ? 'user-machine' : ''}`}
          >
            <div className="machine-icon">
              {machine.occupied ? '🔴' : '🟢'}
            </div>
            <div className="machine-info">
              <h3>{t[language].machine} {machine.id}</h3>
              {machine.occupied ? (
                <>
                  <p className="machine-status">{t[language].occupied}</p>
                  <p className="machine-user">{machine.userName}</p>
                  {remaining > 0 && (
                    <p className="machine-time">{remaining} {t[language].timeLeft}</p>
                  )}
                  {isUserMachine && (
                    <span className="badge">{t[language].yourMachine}</span>
                  )}
                </>
              ) : (
                <>
                  <p className="machine-status">{t[language].free}</p>
                  {!userMachine && (
                    <button
                      className="btn-reserve"
                      onClick={() => setShowReserve(true)}
                    >
                      {t[language].reserve}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}

      {showReserve && (
        <div className="modal-overlay" onClick={() => setShowReserve(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t[language].selectDuration}</h3>
            <div className="duration-selector">
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <span className="duration-value">{duration} {language === 'tr' ? 'dakika' : 'minutes'}</span>
            </div>
            <div className="quick-durations">
              {[30, 45, 60, 90].map(d => (
                <button
                  key={d}
                  className={`btn-duration ${duration == d ? 'active' : ''}`}
                  onClick={() => setDuration(d)}
                >
                  {d} {language === 'tr' ? 'dk' : 'min'}
                </button>
              ))}
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

export default WashingMachines;
