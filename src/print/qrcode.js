import QRCode from 'qrcode';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  window.electronAPI.receive('set-print-data', (data) => {
    try {
      document.getElementById('ticket-no').textContent = data.ticket_no;
      document.getElementById('ticket-priority').textContent = data.priority;
      document.getElementById('ticket-service').textContent = data.service;
      document.getElementById('ticket-date').textContent = data.datetime;
      document.getElementById('office').textContent = data.office;
      document.getElementById('location').textContent = data.location;
      document.getElementById('type').textContent = data.type;
      QRCode.toCanvas(canvas, 
        data.qr_link, {
        width: 90
        }, (err) => {
          if (err) {
            console.error(err);
            if (data.errorChannel) {
              window.electronAPI.send(data.errorChannel, err.message);
            }
            return;
          }

          console.log('QR code generated');
          if (data.readyChannel) {
            window.electronAPI.send(data.readyChannel);
          }
        });
    } catch (error) {
      console.error(error);
      if (data.errorChannel) {
        window.electronAPI.send(data.errorChannel, error.message);
      }
    }
  });
});
