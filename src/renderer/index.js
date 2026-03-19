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
        viewTicket:false,
        offices: [],
        services: [],
        selected_service:'',
        priority_type:'',
        last_print_data:{},
        ticket: {
            // ticket_no: 'Z005',
            // priority: 'test',
            // service: 'test',
            // datetime: 'test',
            // office: 'test',
            // location: 'test',
            // type: 'test',
        },
        priorities: {
            senior: 'Senior Citizen',
            pregnant: 'Pregnant',
            pwd: 'PWD',
            with_infant: 'With Infant',
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
                console.log(`create: ${this.priority_type}`)
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
                    type: this.ticket.type,
                    qr_link:`${apiUrl}/guest/qr-menu?ticket=${result.ticket_no}&date=${result.qr_date}`
                };

                this.last_print_data = print_data;

                console.log(print_data)

                window.electronAPI.send('print-paper', print_data);

                window.electronAPI.send('print-paper', print_data);

                this.viewTicket = true;
                // this.services = [];
                // await this.closeModal();
            } catch (error) {
                console.log('Error: ', error);
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
                    type: this.last_print_data.type,
                    qr_link:this.last_print_data.qr_link
                };
            window.electronAPI.send('print-paper', print_data);
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
