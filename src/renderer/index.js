// src/renderer.js
import Alpine from 'alpinejs';

window.Alpine = Alpine;


window.alpineInit = function () {
    const apiUrl = 'http://eodb.dvodeoro.home';
    // const apiUrl = 'http://ddo-ticketing.dvodeoro.local';
    return {
        loading: true,
        modalopen:false,
        offices: [],
        services: [],
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
            } catch (error) {
                console.log('Error: ', error);
            } finally {
                
                this.loading = false;
            }
        },

        goToindex() {
            this.services = [];
        },

        async createTicket(id) {
            try {
                const response = await fetch(`${apiUrl}/api/create-ticket/${id}`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        id: id
                                    })
                                });
                const result = await response.json();

                const time = new Date(result.datetime).toLocaleTimeString('en-PH');
                const date = new Date(result.datetime).toLocaleDateString('en-PH');

                console.log(`${date} - ${time}`);

                window.electronAPI.send('print-paper', {
                    ticket_no: result.ticket_no,
                    service: result.service.service,
                    office: result.ofc.office,
                    location: result.ofc.location,
                    datetime: `${date} - ${time}`,
                });
            } catch (error) {
                console.log('Error: ', error);
            } finally {
                
                // this.loading = false;
            }
        }
    };
}
Alpine.start();
console.log('[renderer] electronAPI:', window.electronAPI);



// document.getElementById('logo').src = path.join(__dirname, 'assets/images/logo.png');
// document.getElementById('bp').src = path.join(__dirname, 'assets/images/BP.png');
// document.getElementById('ticketing-logo').src = path.join(__dirname, 'assets/images/ticketing-BP.png');
