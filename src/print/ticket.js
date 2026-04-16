document.addEventListener('DOMContentLoaded', () => {
  window.electronAPI.receive('set-print-data', (data) => {
    try {
      document.getElementById('ticket-no').textContent = data.ticket_no || '';
      document.getElementById('ticket-priority').textContent = data.priority || '';
      document.getElementById('ticket-service').textContent = data.service || '';
      document.getElementById('ticket-date').textContent = data.datetime || '';
      document.getElementById('office').textContent = data.office || '';
      document.getElementById('location').textContent = data.location || '';

      if (data.readyChannel) {
        window.electronAPI.send(data.readyChannel);
      }
    } catch (error) {
      console.error(error);
      if (data.errorChannel) {
        window.electronAPI.send(data.errorChannel, error.message);
      }
    }
  });
});
