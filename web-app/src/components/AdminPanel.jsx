import { useState } from 'react';
import { apiUrl } from '../api';

function AdminPanel({ data, userId, language, onClose }) {
  const [selectedUser, setSelectedUser] = useState('');
  const [rackCount, setRackCount] = useState(data.dryingRacks.length);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showRackChange, setShowRackChange] = useState(false);

  const t = {
    tr: {
      title: 'Admin Paneli',
      close: 'Kapat',
      allReservations: 'Tüm Rezervasyonlar',
      removeUser: 'Kullanıcı Sil',
      changeRackCount: 'Askı Sayısını Değiştir',
      selectUser: 'Kullanıcı seçin',
      remove: 'Sil',
      currentCount: 'Şu anki sayı',
      newCount: 'Yeni sayı',
      save: 'Kaydet',
      cancel: 'İptal',
      machine: 'Makine',
      racks: 'Askılar',
      queue: 'Sırada',
      confirmRemove: 'Bu kullanıcıyı silmek istediğinizden emin misiniz?',
      noUsers: 'Aktif kullanıcı yok'
    },
    en: {
      title: 'Admin Panel',
      close: 'Close',
      allReservations: 'All Reservations',
      removeUser: 'Remove User',
      changeRackCount: 'Change Rack Count',
      selectUser: 'Select user',
      remove: 'Remove',
      currentCount: 'Current count',
      newCount: 'New count',
      save: 'Save',
      cancel: 'Cancel',
      machine: 'Machine',
      racks: 'Racks',
      queue: 'In queue',
      confirmRemove: 'Are you sure you want to remove this user?',
      noUsers: 'No active users'
    }
  };

  const getAllUsers = () => {
    const users = [];

    // Пользователи машин
    data.washingMachines.forEach(m => {
      if (m.occupied) {
        users.push({
          phone: m.userPhone,
          name: m.userName,
          type: `${t[language].machine} ${m.id}`,
          icon: '🧺'
        });
      }
    });

    // Пользователи вешалок
    const rackUsers = {};
    data.dryingRacks.forEach(r => {
      if (r.occupied) {
        if (!rackUsers[r.userPhone]) {
          rackUsers[r.userPhone] = {
            phone: r.userPhone,
            name: r.userName,
            racks: [],
            icon: '👕'
          };
        }
        rackUsers[r.userPhone].racks.push(r.id);
      }
    });

    Object.values(rackUsers).forEach(user => {
      users.push({
        phone: user.phone,
        name: user.name,
        type: `${t[language].racks} ${user.racks.join(', ')}`,
        icon: user.icon
      });
    });

    // Пользователи в очереди на стирку
    data.washQueue.forEach(u => {
      users.push({
        phone: u.phone,
        name: u.name,
        type: `${t[language].queue} (${language === 'tr' ? 'yıkama' : 'wash'})`,
        icon: '⏳'
      });
    });

    // Пользователи в очереди на сушку
    data.dryQueue.forEach(u => {
      users.push({
        phone: u.phone,
        name: u.name,
        type: `${t[language].queue} (${language === 'tr' ? 'kurutma' : 'dry'})`,
        icon: '⏳'
      });
    });

    return users;
  };

  const handleRemoveUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(apiUrl('/api/admin/remove'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: userId,
          targetId: selectedUser
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(language === 'tr' ? 'Kullanıcı silindi' : 'User removed');
        setShowRemoveConfirm(false);
        setSelectedUser('');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Remove error:', error);
      alert(language === 'tr' ? 'Bir hata oluştu' : 'An error occurred');
    }
  };

  const handleChangeRackCount = async () => {
    try {
      const response = await fetch(apiUrl('/api/admin/racks/count'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: userId,
          count: parseInt(rackCount)
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(language === 'tr'
          ? `Askı sayısı ${result.newCount} olarak güncellendi`
          : `Rack count updated to ${result.newCount}`);
        setShowRackChange(false);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Rack count error:', error);
      alert(language === 'tr' ? 'Bir hata oluştu' : 'An error occurred');
    }
  };

  const allUsers = getAllUsers();

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>👨‍💼 {t[language].title}</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <div className="admin-section">
        <h3>📋 {t[language].allReservations}</h3>
        {allUsers.length === 0 ? (
          <p className="no-users">{t[language].noUsers}</p>
        ) : (
          <div className="users-list">
            {allUsers.map((user, index) => (
              <div key={index} className="user-item">
                <span className="user-icon">{user.icon}</span>
                <div className="user-details">
                  <strong>{user.name}</strong>
                  <span className="user-type">{user.type}</span>
                  <span className="user-phone-small">{user.phone}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-section">
        <h3>❌ {t[language].removeUser}</h3>
        <select
          className="user-select"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">{t[language].selectUser}</option>
          {allUsers.map((user, index) => (
            <option key={index} value={user.phone}>
              {user.name} - {user.type}
            </option>
          ))}
        </select>
        <button
          className="btn-danger"
          onClick={() => setShowRemoveConfirm(true)}
          disabled={!selectedUser}
        >
          {t[language].remove}
        </button>
      </div>

      <div className="admin-section">
        <h3>⚙️ {t[language].changeRackCount}</h3>
        <div className="rack-count-control">
          <div className="count-info">
            <span>{t[language].currentCount}: {data.dryingRacks.length}</span>
            <span>
              {language === 'tr' ? 'Dolu' : 'Occupied'}: {data.dryingRacks.filter(r => r.occupied).length}
            </span>
          </div>
          <button
            className="btn-secondary"
            onClick={() => setShowRackChange(true)}
          >
            {t[language].changeRackCount}
          </button>
        </div>
      </div>

      {showRemoveConfirm && (
        <div className="modal-overlay" onClick={() => setShowRemoveConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t[language].confirmRemove}</h3>
            <p className="selected-user">
              {allUsers.find(u => u.phone === selectedUser)?.name}
            </p>
            <div className="modal-actions">
              <button className="btn-danger" onClick={handleRemoveUser}>
                {t[language].remove}
              </button>
              <button className="btn-secondary" onClick={() => setShowRemoveConfirm(false)}>
                {t[language].cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRackChange && (
        <div className="modal-overlay" onClick={() => setShowRackChange(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t[language].changeRackCount}</h3>
            <div className="rack-count-input">
              <label>{t[language].newCount}:</label>
              <input
                type="number"
                min={data.dryingRacks.filter(r => r.occupied).length}
                max="20"
                value={rackCount}
                onChange={(e) => setRackCount(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleChangeRackCount}>
                {t[language].save}
              </button>
              <button className="btn-secondary" onClick={() => setShowRackChange(false)}>
                {t[language].cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
