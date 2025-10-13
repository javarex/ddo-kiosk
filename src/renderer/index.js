// src/renderer.js
import Alpine from 'alpinejs';


window.Alpine = Alpine;


window.alpineInit = function () {
    const apiUrl = 'http://192.168.160.99:8000';
    // const apiUrl = 'http://eodb.dvodeoro.home';
    // const apiUrl = 'http://ddo-ticketing.dvodeoro.local';
    return {
        loading: true,
        modalopen:false,
        offices: [],
        services: [],
        selected_service:'',
        priority_type:'',
        priorities: {
            senior: 'Senior Citizen',
            pregnant: 'Pregnant',
            pwd: 'PWD'
        },
        async fetchOffices() {
            try {
                const response = await fetch(`${apiUrl}/api/get-offices`);
                const result = await response.json();
                this.offices = result; 
                console.log(this.services.length > 0)
            } catch (error) {
                console.log('Error: ', error);
            } finally {
                
                this.loading = false;
            }
        },

        async fetchServices(office_id) {
            try {
                const response = await fetch(`${apiUrl}/api/get-service/${office_id}`, {
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
                console.log('Error: ', error);
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
                const response = await fetch(`${apiUrl}/api/create-ticket/${this.selected_service}`, {
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
                // const formattedDate = date.toISOString().split('T')[0];
                console.log('testing')
                let print_data = {
                    ticket_no: result.ticket_no,
                    service: result.service.service,
                    office: result.service.initial_landing?.short_name ?? result.ofc.short_name,
                    location:  result.ofc.location,
                    datetime: `${date} - ${time}`,
                    type: result.priority_type ? result.priority_type.toUpperCase() : '',
                    qr_link:`${apiUrl}/guest/qr-menu?ticket=${result.ticket_no}&date=${result.qr_date}`
                };

                console.log(print_data)

                window.electronAPI.send('print-paper', print_data);

                window.electronAPI.send('print-paper', print_data);
                this.services = [];
                await this.closeModal();
            } catch (error) {
                console.log('Error: ', error);
            } finally {
                
                // this.loading = false;
            }
        },

        closeModal() {
            this.modalopen = false;
            this.selected_service = '';
            this.priority_type = '';
        }
    };
}
Alpine.start();
console.log('[renderer] electronAPI:', window.electronAPI);



// document.getElementById('logo').src = path.join(__dirname, 'assets/images/logo.png');
// document.getElementById('bp').src = path.join(__dirname, 'assets/images/BP.png');
// document.getElementById('ticketing-logo').src = path.join(__dirname, 'assets/images/ticketing-BP.png');
