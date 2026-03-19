import QRCode from 'qrcode';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  window.electronAPI.receive('set-print-data', (data) => {
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
          if (err) console.error(err);
          else console.log('✅ QR code generated');
        });
  });
});