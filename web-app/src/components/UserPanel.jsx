import { useState } from 'react';
import { apiUrl } from '../api';

function UserPanel({ data, userId, userName, language }) {
  const [showFinish, setShowFinish] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const t = {
    tr: {
      myReservations: 'Rezervasyonlarım',
      noReservations: 'Aktif rezervasyonunuz yok',
      machine: 'Makine',
      racks: 'Askılar',
      finish: 'Bitti',
      cancel: 'İptal Et',
      confirmFinish: 'İşlemi tamamladığınızı onaylıyor musunuz?',
      confirmCancel: 'Rezervasyonunuzu iptal etmek istediğinizden emin misiniz?',
      yes: 'Evet',
      no: 'Hayır',
      timeLeft: 'dk kaldı',
      inQueue: 'Sıradasınız'
    },
    en: {
      myReservations: 'My Reservations',
      noReservations: 'No active reservations',
      machine: 'Machine',
      racks: 'Racks',
      finish: 'Finish',
      cancel: 'Cancel',
      confirmFinish: 'Confirm that you have finished?',
      confirmCancel: 'Are you sure you want to cancel your reservation?',
      yes: 'Yes',
      no: 'No',
      timeLeft: 'min left',
      inQueue: 'In queue'
    }
  };

  const userMachine = data.washingMachines.find(m => m.user === userId);
  const userRacks = data.dryingRacks.filter(r => r.user === userId);
  const inWashQueue = data.washQueue.some(u => u.id === userId);
  const inDryQueue = data.dryQueue.some(u => u.id === userId);

  const hasAnyReservation = userMachine || userRacks.length > 0 || inWashQueue || inDryQueue;

  const getTimeRemaining = (machine) => {
    if (!machine.startTime || !machine.duration) return 0;
    const elapsed = Math.floor((Date.now() - machine.startTime) / 60000);
    const remaining = machine.duration - elapsed;
    return remaining > 0 ? remaining : 0;
  };

  const handleFinish = async () => {
    try {
      const response = await fetch(apiUrl('/api/finish'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const result = await response.json();
      if (result.success) {
        alert(language === 'tr' ? 'Teşekkürler! Kaynaklar serbest bırakıldı.' : 'Thank you! Resources released.');
        setShowFinish(false);
      } else {
        alert(language === 'tr' ? 'Aktif rezervasyonunuz yok' : 'No active reservations');
      }
    } catch (error) {
      console.error('Finish error:', error);
      alert(language === 'tr' ? 'Bir hata oluştu' : 'An error occurred');
    }
  };

  const handleCancel = async () => {
    try {
      const response = await fetch(apiUrl('/api/cancel'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const result = await response.json();
      if (result.success) {
        alert(language === 'tr' ? 'Rezervasyonunuz iptal edildi' : 'Your reservation has been cancelled');
        setShowCancel(false);
      } else {
        alert(language === 'tr' ? 'Aktif rezervasyonunuz yok' : 'No active reservations');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert(language === 'tr' ? 'Bir hata oluştu' : 'An error occurred');
    }
  };

  if (!hasAnyReservation) {
    return null;
  }

  return (
    <div className="user-panel">
      <h3>📋 {t[language].myReservations}</h3>

      <div className="reservations-list">
        {userMachine && (
          <div className="reservation-card">
            <div className="reservation-icon">🧺</div>
            <div className="reservation-info">
              <h4>{t[language].machine} {userMachine.id}</h4>
              {getTimeRemaining(userMachine) > 0 && (
                <p className="time-remaining">
                  {getTimeRemaining(userMachine)} {t[language].timeLeft}
                </p>
              )}
            </div>
          </div>
        )}

        {userRacks.length > 0 && (
          <div className="reservation-card">
            <div className="reservation-icon">👕</div>
            <div className="reservation-info">
              <h4>{t[language].racks}</h4>
              <p className="rack-numbers">{userRacks.map(r => r.id).join(', ')}</p>
            </div>
          </div>
        )}

        {inWashQueue && (
          <div className="reservation-card queue-card">
            <div className="reservation-icon">⏳</div>
            <div className="reservation-info">
              <h4>{t[language].inQueue}</h4>
              <p>Yıkama sırası</p>
            </div>
          </div>
        )}

        {inDryQueue && (
          <div className="reservation-card queue-card">
            <div className="reservation-icon">⏳</div>
            <div className="reservation-info">
              <h4>{t[language].inQueue}</h4>
              <p>Kurutma sırası</p>
            </div>
          </div>
        )}
      </div>

      <div className="user-actions">
        {(userMachine || userRacks.length > 0) && (
          <button className="btn-finish" onClick={() => setShowFinish(true)}>
            ✅ {t[language].finish}
          </button>
        )}
        <button className="btn-cancel" onClick={() => setShowCancel(true)}>
          ❌ {t[language].cancel}
        </button>
      </div>

      {showFinish && (
        <div className="modal-overlay" onClick={() => setShowFinish(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t[language].confirmFinish}</h3>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleFinish}>
                {t[language].yes}
              </button>
              <button className="btn-secondary" onClick={() => setShowFinish(false)}>
                {t[language].no}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancel && (
        <div className="modal-overlay" onClick={() => setShowCancel(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t[language].confirmCancel}</h3>
            <div className="modal-actions">
              <button className="btn-danger" onClick={handleCancel}>
                {t[language].yes}
              </button>
              <button className="btn-secondary" onClick={() => setShowCancel(false)}>
                {t[language].no}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserPanel;
