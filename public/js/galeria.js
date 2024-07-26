document.addEventListener('DOMContentLoaded', () => {
    fetch('/data')
        .then(response => response.json())
        .then(data => {
            renderData(data);
        })
        .catch(error => console.error('Erro ao carregar os dados:', error));

    function renderData(data) {
        const mediaGallery = document.getElementById('media-gallery');
        mediaGallery.innerHTML = ''; // Limpa a galeria antes de renderizar novos dados

        data.forEach(item => {
            const mediaItem = document.createElement('div');
            mediaItem.classList.add('media-item');

            if (item.type === 'photo') {
                const img = document.createElement('img');
                img.src = `/uploads/${item.file_path}`;
                img.alt = item.caption;
                mediaItem.appendChild(img);
            } else if (item.type === 'video') {
                const video = document.createElement('video');
                video.src = `/uploads/${item.file_path}`;
                video.controls = true;
                mediaItem.appendChild(video);
            }

            const caption = document.createElement('p');
            caption.textContent = item.caption;
            mediaItem.appendChild(caption);

            mediaGallery.appendChild(mediaItem);
        });
    }
});