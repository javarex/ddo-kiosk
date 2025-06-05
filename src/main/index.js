const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const path = require('path');
const createWindow = () => {
  const win = new BrowserWindow({
    // width: 1080,
    // height: 1920,
     width: 300,  // window size in pixels (not print size)
    height: 300,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'), // ✅ points to src/preload.js
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // win.loadFile('src/renderer/index.html')
  win.loadFile('src/renderer/print.html')
}

app.whenReady().then(() => {
  createWindow()
});

ipcMain.on('print-paper', (event, data) => {
   const printWindow = new BrowserWindow({
    width: 300,  // window size in pixels (not print size)
    height: 300,
    show: false, // hide window during print
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      sandbox: true
    }
  });
  // const printWindow = new BrowserWindow({
  //   width: 300,  // window size in pixels (not print size)
  //   height: 300,
  //   show: false,
  //   webPreferences: {
  //     contextIsolation: true,
  //     sandbox: true
  //   }
  // });

  // Load the print HTML page
  // printWindow.loadFile(path.join(__dirname, '../renderer/print.html'));
  printWindow.loadFile(path.join(__dirname, '../renderer/print.html'));

  // Once the page is ready, print it
  printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.send('set-print-data', data);

    setTimeout(() => {
      printWindow.webContents.print({
        silent: true,
        printBackground: false,
        deviceName: 'w80',  // Replace with actual printer name
        pageSize: {
          width: 3 * 25400,  // 3 inches in microns
          height: 3 * 25400
        },
        margins: {
          marginType: 'none'  // ✅ This removes all default margins
        }
      }, (success, errorType) => {
        if (success) {
          new Notification({
            title: 'Print Success',
            body: 'Your document has been printed successfully.',
          }).show();
        } else {
          new Notification({
            title: 'Print Failed',
            body: `Error printing: ${errorType}`,
          }).show();
        }
  
        printWindow.close(); // Clean up
      });
    }, 500);
  });
});
