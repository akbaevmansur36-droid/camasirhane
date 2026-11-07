function QueueStatus({ washQueue, dryQueue, language }) {
  const t = {
    tr: {
      washQueue: 'Yıkama Sırası',
      dryQueue: 'Kurutma Sırası',
      noQueue: 'Sırada kimse yok',
      people: 'kişi',
      position: 'Sıra'
    },
    en: {
      washQueue: 'Wash Queue',
      dryQueue: 'Drying Queue',
      noQueue: 'No one in queue',
      people: 'people',
      position: 'Position'
    }
  };

  return (
    <div className="queue-container">
      <div className="queue-section">
        <h3>🧺 {t[language].washQueue}</h3>
        {washQueue.length === 0 ? (
          <p className="no-queue">{t[language].noQueue}</p>
        ) : (
          <div className="queue-list">
            {washQueue.map((user, index) => (
              <div key={user.id} className="queue-item">
                <span className="queue-position">{index + 1}</span>
                <span className="queue-name">{user.name}</span>
                <span className="queue-duration">{user.duration} {language === 'tr' ? 'dk' : 'min'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="queue-section">
        <h3>👕 {t[language].dryQueue}</h3>
        {dryQueue.length === 0 ? (
          <p className="no-queue">{t[language].noQueue}</p>
        ) : (
          <div className="queue-list">
            {dryQueue.map((user, index) => (
              <div key={user.id} className="queue-item">
                <span className="queue-position">{index + 1}</span>
                <span className="queue-name">{user.name}</span>
                <span className="queue-count">{user.count} {language === 'tr' ? 'askı' : 'racks'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default QueueStatus;
