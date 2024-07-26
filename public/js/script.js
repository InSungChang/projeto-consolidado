document.addEventListener('DOMContentLoaded', () => {
    const filterInput = document.getElementById('filter-input');
    const viewAllButton = document.getElementById('view-all-button');
    const dataList = document.getElementById('data-list');
    const detailsSection = document.getElementById('details');
    const photo = document.getElementById('photo');

    // Função para buscar dados do backend
    async function fetchData(url) {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    }

    // Função para renderizar a lista de dados
    function renderList(data) {
        dataList.innerHTML = '';
        data.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.name + ' - ' + item.email + ' - ' + item.service + ' - ' + item.date;
            li.addEventListener('click', () => showDetails(item));
            dataList.appendChild(li);
        });
    }

    // Função para mostrar os detalhes do item selecionado
    function showDetails(item) {
        detailsSection.innerHTML = `
            <p>Nome: ${item.name}</p>
            <p>Email: ${item.email}</p>
            <p>Celular: ${item.cellphone}</p>
            <p>Serviço: ${item.service}</p>
            <p>Descrição: ${item.description}</p>
            <p>Data: ${item.date}</p>
        `;
        if (item.photo) {
            photo.src = `../uploads/${item.photo}`;
            photo.style.display = 'block';
        } else {
            photo.style.display = 'none';
        }
    }

    // Função para filtrar a lista
    function filterList() {
        const filterText = filterInput.value.toLowerCase();
        const items = Array.from(dataList.children);
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(filterText)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Evento para filtrar a lista
    filterInput.addEventListener('input', filterList);

    // Evento para visualizar todos os dados
    viewAllButton.addEventListener('click', async () => {
        const data = await fetchData('/api/data');
        renderList(data);
    });

    // Carregar os dados ao iniciar
    fetchData('/api/data').then(renderList);

});