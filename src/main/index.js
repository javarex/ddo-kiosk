const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path');

const DEFAULT_RECEIPT_PRINTER_NAME = process.env.RECEIPT_PRINTER_NAME || 'EPSON TM-T82X Receipt';
const PRINT_READY_TIMEOUT_MS = 5000;

const normalizePrinterName = (printerName) => {
  return typeof printerName === 'string' ? printerName.trim() : '';
};

const normalizePrintCopies = (copies) => {
  const parsedCopies = Number.parseInt(copies, 10);

  if (!Number.isFinite(parsedCopies) || parsedCopies < 1) {
    return 1;
  }

  return Math.min(parsedCopies, 5);
};

const closeWindow = (win) => {
  if (win && !win.isDestroyed()) {
    win.close();
  }
};

const waitForPrintReady = (printWindow, readyChannel, errorChannel) => {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      ipcMain.removeListener(readyChannel, handleReady);
      ipcMain.removeListener(errorChannel, handleError);
      printWindow.removeListener('closed', handleClosed);
    };

    const handleReady = () => {
      cleanup();
      resolve();
    };

    const handleError = (_event, errorMessage) => {
      cleanup();
      reject(new Error(errorMessage || 'Print page failed before it was ready.'));
    };

    const handleClosed = () => {
      cleanup();
      reject(new Error('Print window closed before the page was ready.'));
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Print page did not become ready within ${PRINT_READY_TIMEOUT_MS}ms.`));
    }, PRINT_READY_TIMEOUT_MS);

    ipcMain.once(readyChannel, handleReady);
    ipcMain.once(errorChannel, handleError);
    printWindow.once('closed', handleClosed);
  });
};

const getPrinters = async (webContents) => {
  const printers = await webContents.getPrintersAsync();
  return printers.map((printer) => ({
    name: printer.name,
    displayName: printer.displayName,
    description: printer.description,
    isDefault: printer.isDefault,
    status: printer.status
  }));
};

const printReceipt = async (printWindow, printerName) => {
  const requestedPrinterName = normalizePrinterName(printerName) || DEFAULT_RECEIPT_PRINTER_NAME;
  let printers = [];

  try {
    printers = await getPrinters(printWindow.webContents);
  } catch (error) {
    console.error('Could not enumerate printers:', error);
  }

  const availablePrinterNames = printers.map((printer) => printer.name);
  const targetPrinter = printers.find((printer) => printer.name === requestedPrinterName);

  console.log('Available printers:', availablePrinterNames);

  if (requestedPrinterName && !targetPrinter) {
    console.warn(
      `Configured printer "${requestedPrinterName}" was not found in the enumerated list. Trying that printer name directly.`
    );
  }

  return new Promise((resolve) => {
    const options = {
      silent: true,
      printBackground: false,
      pageSize: {
        width: 3 * 25400,
        height: 3 * 25400
      },
      margins: {
        marginType: 'none'
      }
    };

    if (requestedPrinterName) {
      options.deviceName = targetPrinter ? targetPrinter.name : requestedPrinterName;
    }

    printWindow.webContents.print(options, (success, errorType) => {
      if (success) {
        console.log(`Print success on "${options.deviceName || 'system default'}".`);
      } else {
        console.error('Print failed:', errorType || 'Unknown print error');
      }

      resolve({ success, errorType });
    });
  });
};

const printReceiptCopies = async (printWindow, printerName, copies) => {
  const copyCount = normalizePrintCopies(copies);
  const results = [];

  for (let copy = 1; copy <= copyCount; copy += 1) {
    console.log(`Printing receipt copy ${copy} of ${copyCount}.`);
    results.push(await printReceipt(printWindow, printerName));
  }

  return results;
};

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1080,
    height: 1920,
    //  width: 300,  // window size in pixels (not print size)
    // height: 300,
    fullscreen:true,
    fullscreenable:true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'), // ✅ points to src/preload.js
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.loadFile('src/renderer/index.html')
  // win.loadFile('src/renderer/print.html')
}

app.whenReady().then(() => {
  createWindow()
});

ipcMain.handle('get-printers', async (event) => {
  try {
    const printers = await getPrinters(event.sender);
    return { printers };
  } catch (error) {
    console.error('Could not get printers:', error);
    return {
      printers: [],
      error: error?.message || String(error)
    };
  }
});

ipcMain.on('print-paper', (event, data) => {
  const printWindow = new BrowserWindow({
    width: 300,  // window size in pixels (not print size)
    height: 400,
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

  const jobId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const readyChannel = `print-ready:${jobId}`;
  const errorChannel = `print-error:${jobId}`;

  printWindow.webContents.once('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Print page failed to load:', { errorCode, errorDescription });
    closeWindow(printWindow);
  });

  printWindow.loadFile(path.join(__dirname, '../renderer/print.html'));

  printWindow.webContents.once('did-finish-load', async () => {
    try {
      const readyPromise = waitForPrintReady(printWindow, readyChannel, errorChannel);

      printWindow.webContents.send('set-print-data', {
        ...data,
        readyChannel,
        errorChannel
      });

      await readyPromise;
      await printReceiptCopies(printWindow, data?.printerName, data?.copies);
    } catch (error) {
      console.error('Print job failed:', error);
    } finally {
      closeWindow(printWindow);
    }
  });
});
