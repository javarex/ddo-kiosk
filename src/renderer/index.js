// src/renderer.js
import Alpine from 'alpinejs';


window.Alpine = Alpine;


window.alpineInit = function () {
    return {
        loading: false,
        apiUrl: localStorage.getItem('kiosk_api_url') || '',
        apiUrlInput: localStorage.getItem('kiosk_api_url') || '',
        apiSetupDone: !!localStorage.getItem('kiosk_api_url'),
        apiUrlHistory: JSON.parse(localStorage.getItem('kiosk_api_url_history') || '[]'),
        printerName: localStorage.getItem('kiosk_printer_name') || 'EPSON TM-T82X Receipt',
        printerNameInput: localStorage.getItem('kiosk_printer_name') || 'EPSON TM-T82X Receipt',
        printers: [],
        printerLoading: false,
        printerStatus: '',
        showPrinterSetup: false,
        errorLog: [],
        showErrorLog: false,
        modalopen:false,
        viewTicket:false,
        offices: [],
        services: [],
        selected_service:'',
        priority_type:'',
        last_print_data:{},
        ticket: {},

        initKiosk() {
            this.loadPrinters();
            if (this.apiSetupDone) {
                this.fetchOffices();
            }
        },

        saveApiUrl() {
            const url = this.apiUrlInput.replace(/\/+$/, '');
            if (!url) return;
            if (this.apiUrl && this.apiUrl !== url && !this.apiUrlHistory.includes(this.apiUrl)) {
                this.apiUrlHistory.unshift(this.apiUrl);
                localStorage.setItem('kiosk_api_url_history', JSON.stringify(this.apiUrlHistory));
            }
            localStorage.setItem('kiosk_api_url', url);
            this.apiUrl = url;
            this.apiSetupDone = true;
            this.savePrinterName(false);
            this.loading = true;
            this.fetchOffices();
        },

        resetApiUrl() {
            this.apiSetupDone = false;
            this.apiUrlInput = this.apiUrl;
        },

        cancelApiSetup() {
            if (this.apiUrl) {
                this.apiSetupDone = true;
                this.apiUrlInput = this.apiUrl;
            }
        },

        selectHistoryUrl(url) {
            this.apiUrlInput = url;
        },

        async loadPrinters() {
            if (!window.electronAPI?.invoke) {
                this.printerStatus = 'Printer setup is available in the Electron app.';
                return;
            }

            this.printerLoading = true;
            try {
                const result = await window.electronAPI.invoke('get-printers');
                this.printers = Array.isArray(result?.printers) ? result.printers : [];

                if (this.printers.length > 0) {
                    this.printerStatus = `Found ${this.printers.length} printer${this.printers.length === 1 ? '' : 's'}.`;
                } else {
                    this.printerStatus = result?.error
                        ? `No printers found: ${result.error}`
                        : 'No printers found. Type the printer name manually.';
                }
            } catch (error) {
                this.printers = [];
                this.printerStatus = 'No printers found. Type the printer name manually.';
                this.logError('loadPrinters', error);
            } finally {
                this.printerLoading = false;
            }
        },

        openPrinterSetup() {
            this.printerNameInput = this.printerName;
            this.showPrinterSetup = true;
            this.loadPrinters();
        },

        selectPrinter(printerName) {
            this.printerNameInput = printerName;
        },

        savePrinterName(closeSetup = true) {
            const printerName = this.printerNameInput.trim();
            this.printerName = printerName;
            localStorage.setItem('kiosk_printer_name', printerName);
            this.printerStatus = printerName
                ? `Using printer: ${printerName}`
                : 'Using the system default printer.';

            if (closeSetup) {
                this.showPrinterSetup = false;
            }
        },

        printPayload(printData) {
            return {
                ...printData,
                printerName: this.printerName
            };
        },

        logError(context, error) {
            const lines = [
                `[${new Date().toLocaleTimeString()}] ${context}`,
                `Type: ${error?.name || typeof error}`,
                `Message: ${error?.message || String(error)}`,
                `Stack: ${error?.stack || 'n/a'}`,
            ];
            const entry = lines.join(' | ');
            console.log(entry);
            this.errorLog.unshift({ full: entry, lines });
            if (this.errorLog.length > 50) this.errorLog.pop();
        },
        priorities: {
            senior: 'Senior Citizen',
            pregnant: 'Pregnant',
            pwd: 'PWD',
            with_infant: 'With Infant',
        },
        async fetchOffices() {
            if (!this.apiUrl) return;
            try {
                const response = await fetch(`${this.apiUrl}/api/get-offices`);
                const result = await response.json();
                this.offices = result;
            } catch (error) {
                this.logError(`fetchOffices (${this.apiUrl})`, error);
            } finally {
                this.loading = false;
            }
        },

        async fetchServices(office_id) {
            try {
                const response = await fetch(`${this.apiUrl}/api/get-service/${office_id}`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        office_id: office_id
                                    })
                                });
                const result = await response.json();
                this.services = result; 
                console.log(this.services)
            } catch (error) {
                this.logError(`fetchServices (${this.apiUrl})`, error);
            } finally {
                this.loading = false;
            }
        },

        modalHeader() {
            try {
                return this.services.find(item => item.id === this.selected_service).service;
            } catch (error) {
                return '';
            }
            return '';
        },

        goToindex() {
            this.services = [];
        },
        openPriorityModal(id) {

            this.selected_service = id;
            this.modalopen = true;
            // this.createTicket(id);
        },
        async createTicket() {
            try {
                console.log(`create: ${this.priority_type}`)
                const response = await fetch(`${this.apiUrl}/api/create-ticket/${this.selected_service}`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        id: this.selected_service,
                                        priority_type: this.priority_type
                                    })
                                });
                const result = await response.json();

                const time = new Date(result.datetime).toLocaleTimeString('en-PH');
                const date = new Date(result.datetime).toLocaleDateString('en-PH');
                
                this.ticket = result;
                this.ticket.priority_type = result.priority_type ? 'PRIORITY' : '';
                this.ticket.service = result.service.service;
                this.ticket.type = result.priority_type ? result.priority_type.toUpperCase() : '';
                this.ticket.office = result.service.initial_landing?.short_name ?? result.ofc.short_name;
                this.datetime = `${date} - ${time}`;
                // const formattedDate = date.toISOString().split('T')[0];
                console.log('testing')
                let print_data = {
                    ticket_no: result.ticket_no,
                    priority: this.ticket.priority_type,
                    service: this.ticket.service,
                    office: this.ticket.office,
                    location:  result.ofc.location,
                    datetime: this.datetime,
                    type: this.ticket.type
                };

                this.last_print_data = print_data;

                console.log(print_data)

                if (window.electronAPI) {
                    window.electronAPI.send('print-paper', this.printPayload(print_data));
                }

                this.viewTicket = true;
                // this.services = [];
                // await this.closeModal();
            } catch (error) {
                this.logError(`createTicket (${this.apiUrl})`, error);
            } finally {
                // this.loading = false;
            }
        },

        print() {
            let print_data = {
                    ticket_no: this.last_print_data.ticket_no,
                    priority: this.last_print_data.priority,
                    service: this.last_print_data.service,
                    office: this.last_print_data.office,
                    location:  this.last_print_data.location,
                    datetime: this.last_print_data.datetime,
                    type: this.last_print_data.type
                };
            if (window.electronAPI) {
                window.electronAPI.send('print-paper', this.printPayload(print_data));
            }
        },

        closeModal(clearService = false) {

            if (clearService) {

                this.services = [];

            }

            this.modalopen = false;
            this.viewTicket = false;
            this.selected_service = '';
            this.priority_type = '';
        },

        setPriority(priority) {

            if (priority == this.priority_type) {
                this.priority_type = '';
                return false;
            }
            this.priority_type = priority;
            console.log(`priority : ${priority}`);
        }
    };
}
Alpine.start();
console.log('[renderer] electronAPI:', window.electronAPI);



// document.getElementById('logo').src = path.join(__dirname, 'assets/images/logo.png');
// document.getElementById('bp').src = path.join(__dirname, 'assets/images/BP.png');
// document.getElementById('ticketing-logo').src = path.join(__dirname, 'assets/images/ticketing-BP.png');
