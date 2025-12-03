const API_BASE_URL = 'http://localhost:8000/api/v1';
let currentToken = localStorage.getItem('token');
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAlbums();
    loadArtists();
    loadProducers();
    loadTopRated();
    checkAuth();
});

// Auth Check
function checkAuth() {
    if (currentToken) {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'block';
    } else {
        document.getElementById('loginBtn').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'none';
    }
}

// Login
document.getElementById('loginBtn').addEventListener('click', () => {
    document.getElementById('loginModal').style.display = 'block';
});

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            currentToken = data.access_token;
            localStorage.setItem('token', currentToken);
            closeLoginModal();
            checkAuth();
            alert('✅ Login successful!');
        } else {
            alert('❌ Login failed! Check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('❌ Error connecting to server');
    }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    currentToken = null;
    localStorage.removeItem('token');
    checkAuth();
    alert('👋 Logged out successfully');
});

// Register
function showRegisterForm() {
    closeLoginModal();
    document.getElementById('registerModal').style.display = 'block';
}

function showLoginForm() {
    closeRegisterModal();
    document.getElementById('loginModal').style.display = 'block';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        if (response.ok) {
            closeRegisterModal();
            alert('✅ Registration successful! Please login.');
            showLoginForm();
        } else {
            const error = await response.json();
            alert(`❌ Registration failed: ${error.detail}`);
        }
    } catch (error) {
        console.error('Register error:', error);
        alert('❌ Error connecting to server');
    }
}

// ============ ALBUMS ============
async function loadAlbums(filters = {}) {
    const grid = document.getElementById('albumsGrid');
    const spinner = document.getElementById('albumsLoadingSpinner');
    
    spinner.style.display = 'block';
    grid.innerHTML = '';
    
    try {
        let url = `${API_BASE_URL}/albums?skip=0&limit=20`;
        
        if (filters.region) url += `&region=${filters.region}`;
        if (filters.year) url += `&year=${filters.year}`;
        if (filters.artist) url += `&artist=${filters.artist}`;
        
        const response = await fetch(url);
        const albums = await response.json();
        
        spinner.style.display = 'none';
        
        if (albums.length === 0) {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No albums found 😔</p>';
            return;
        }
        
        albums.forEach(album => {
            grid.appendChild(createAlbumCard(album));
        });
        
    } catch (error) {
        console.error('Error loading albums:', error);
        spinner.style.display = 'none';
    }
}

function createAlbumCard(album) {
    const card = document.createElement('div');
    card.className = 'album-card';
    card.onclick = () => showAlbumDetails(album.id);
    
    const regionClass = `region-${album.region}`;
    const regionName = album.region.replace('_', ' ').toUpperCase();
    
    card.innerHTML = `
        <img src="${album.cover_url || 'https://via.placeholder.com/300x300/1a1a1d/ff6b35?text=' + encodeURIComponent(album.title)}" 
             alt="${album.title}" 
             class="album-cover"
             onerror="this.src='https://via.placeholder.com/300x300/1a1a1d/ff6b35?text=Album+Cover'">
        <div class="album-info">
            <h3 class="album-title">${album.title}</h3>
            <p class="album-artist">${album.artist ? album.artist.name : 'Unknown Artist'}</p>
            <span class="region-badge ${regionClass}">${regionName}</span>
            <div class="album-meta">
                <span>${album.year}</span>
                <span class="album-rating">⭐ ${album.avg_rating.toFixed(1)} (${album.total_ratings})</span>
            </div>
        </div>
    `;
    
    return card;
}

async function showAlbumDetails(albumId) {
    try {
        const response = await fetch(`${API_BASE_URL}/albums/${albumId}`);
        const album = await response.json();
        
        const modal = document.getElementById('albumModal');
        const details = document.getElementById('albumDetails');
        
        details.innerHTML = `
            <h2>${album.title}</h2>
            <img src="${album.cover_url || 'https://via.placeholder.com/400x400/1a1a1d/ff6b35?text=Album'}" 
                 alt="${album.title}" 
                 style="width:100%; max-width:400px; border-radius:10px; margin:1rem 0;">
            <p><span class="detail-label">Artist:</span> ${album.artist ? album.artist.name : 'Unknown'}</p>
            <p><span class="detail-label">Year:</span> ${album.year}</p>
            <p><span class="detail-label">Region:</span> ${album.region.replace('_', ' ').toUpperCase()}</p>
            <p><span class="detail-label">Producer:</span> ${album.producer ? album.producer.name : 'N/A'}</p>
            <p><span class="detail-label">Label:</span> ${album.label || 'N/A'}</p>
            <p><span class="detail-label">Rating:</span> ⭐ ${album.avg_rating.toFixed(2)} / 5.0 (${album.total_ratings} ratings)</p>
            
            <h3 style="color: var(--primary); margin-top: 2rem;">📖 Priča</h3>
            <p style="line-height: 1.8;">${album.story || 'No story available.'}</p>
            
            <h3 style="color: var(--accent); margin-top: 2rem;">💥 Utjecaj</h3>
            <p style="line-height: 1.8; background: rgba(255,107,53,0.1); padding: 1rem; border-radius: 8px;">
                ${album.impact || 'No impact info available.'}
            </p>
            
            <h3 style="color: var(--primary); margin-top: 2rem;">🔥 Trivia</h3>
            <p style="line-height: 1.8; background: rgba(0,78,137,0.1); padding: 1rem; border-radius: 8px;">
                ${album.trivia || 'No trivia available.'}
            </p>
            
            <br>
            <button class="btn btn-primary" onclick="getSimilarAlbums(${album.id})">Similar Albums</button>
        `;
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading album details:', error);
        alert('Error loading album details');
    }
}

function closeAlbumModal() {
    document.getElementById('albumModal').style.display = 'none';
}

async function getSimilarAlbums(albumId) {
    try {
        const response = await fetch(`${API_BASE_URL}/recommendations/similar/${albumId}?limit=5`);
        const recommendations = await response.json();
        
        const details = document.getElementById('albumDetails');
        
        let html = '<h3 style="margin-top:2rem; color: var(--accent);">Similar Albums:</h3>';
        html += '<div style="display:grid; gap:1rem; margin-top:1rem;" id="similarAlbumsContainer">';
        
        recommendations.forEach((rec, index) => {
            html += `
                <div class="similar-album-card" data-album-id="${rec.album.id}" style="background: rgba(255,255,255,0.05); padding:1rem; border-radius:8px; cursor:pointer;">
                    <strong>${rec.album.artist ? rec.album.artist.name : 'Unknown'} - ${rec.album.title}</strong> (${rec.album.year})
                    <br>
                    <small style="color: var(--accent);">Similarity: ${(rec.similarity_score * 100).toFixed(0)}%</small>
                    <br>
                    <small style="color: #888;">${rec.reason}</small>
                </div>
            `;
        });
        
        html += '</div>';
        details.innerHTML += html;
        
        setTimeout(() => {
            const similarCards = document.querySelectorAll('.similar-album-card');
            similarCards.forEach(card => {
                card.addEventListener('click', function() {
                    const albumId = this.getAttribute('data-album-id');
                    closeAlbumModal();
                    setTimeout(() => showAlbumDetails(albumId), 200);
                });
            });
        }, 100);
        
    } catch (error) {
        console.error('Error loading recommendations:', error);
    }
}

function filterAlbums() {
    const filters = {
        region: document.getElementById('albumRegionFilter').value,
        year: document.getElementById('albumYearFilter').value,
        artist: document.getElementById('albumArtistFilter').value
    };
    
    loadAlbums(filters);
}

function resetAlbumFilters() {
    document.getElementById('albumRegionFilter').value = '';
    document.getElementById('albumYearFilter').value = '';
    document.getElementById('albumArtistFilter').value = '';
    loadAlbums();
}

// ============ ARTISTS ============
async function loadArtists(filters = {}) {
    const grid = document.getElementById('artistsGrid');
    const spinner = document.getElementById('artistsLoadingSpinner');
    
    spinner.style.display = 'block';
    grid.innerHTML = '';
    
    try {
        let url = `${API_BASE_URL}/artists?skip=0&limit=50`;
        
        if (filters.region) url += `&region=${filters.region}`;
        
        const response = await fetch(url);
        const artists = await response.json();
        
        spinner.style.display = 'none';
        
        if (artists.length === 0) {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No artists found 😔</p>';
            return;
        }
        
        artists.forEach(artist => {
            grid.appendChild(createArtistCard(artist));
        });
        
    } catch (error) {
        console.error('Error loading artists:', error);
        spinner.style.display = 'none';
    }
}

function createArtistCard(artist) {
    const card = document.createElement('div');
    card.className = 'album-card';
    card.onclick = () => showArtistDetails(artist.id);
    
    const regionClass = `region-${artist.region}`;
    const regionName = artist.region.replace('_', ' ').toUpperCase();
    const stars = '⭐'.repeat(Math.round(artist.influence_score));
    
    card.innerHTML = `
        <img src="${artist.image_url || 'https://via.placeholder.com/300x300/1a1a1d/ff6b35?text=' + encodeURIComponent(artist.name)}" 
             alt="${artist.name}" 
             class="album-cover"
             onerror="this.src='https://via.placeholder.com/300x300/1a1a1d/ff6b35?text=Artist'">
        <div class="album-info">
            <h3 class="album-title">${artist.name}</h3>
            <span class="region-badge ${regionClass}">${regionName}</span>
            <p style="margin-top: 0.5rem; color: var(--accent); font-size: 0.9rem;">
                ${stars} ${artist.influence_score.toFixed(1)}/10
            </p>
            <p style="font-size: 0.85rem; color: #aaa; margin-top: 0.5rem;">
                Era: ${artist.era ? artist.era.replace('_', ' ') : 'N/A'}
            </p>
        </div>
    `;
    
    return card;
}

async function showArtistDetails(artistId) {
    try {
        const response = await fetch(`${API_BASE_URL}/artists/${artistId}`);
        const artist = await response.json();
        
        const modal = document.getElementById('artistModal');
        const details = document.getElementById('artistDetails');
        
        const regionName = artist.region.replace('_', ' ').toUpperCase();
        const stars = '⭐'.repeat(Math.round(artist.influence_score));
        
        details.innerHTML = `
            <h2>${artist.name}</h2>
            <img src="${artist.image_url || 'https://via.placeholder.com/400x400/1a1a1d/ff6b35?text=Artist'}" 
                 alt="${artist.name}" 
                 style="width:100%; max-width:400px; border-radius:10px; margin:1rem 0;">
            
            <p><span class="detail-label">Region:</span> ${regionName}</p>
            <p><span class="detail-label">Era:</span> ${artist.era ? artist.era.replace('_', ' ') : 'N/A'}</p>
            <p><span class="detail-label">Influence Score:</span> ${stars} ${artist.influence_score.toFixed(1)}/10</p>
            
            <h3 style="color: var(--primary); margin-top: 2rem;">Biografija</h3>
            <p style="line-height: 1.8;">${artist.biography || 'No biography available.'}</p>
            
            <h3 style="color: var(--accent); margin-top: 2rem;">🔥 Fun Facts</h3>
            <p style="line-height: 1.8; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
                ${artist.fun_facts || 'No fun facts available.'}
            </p>
            
            <button class="btn btn-primary" onclick="showArtistAlbums(${artist.id})" style="margin-top: 2rem;">
                Diskografija
            </button>
        `;
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading artist details:', error);
        alert('Error loading artist details');
    }
}

function closeArtistModal() {
    document.getElementById('artistModal').style.display = 'none';
}

async function showArtistAlbums(artistId) {
    try {
        const response = await fetch(`${API_BASE_URL}/artists/${artistId}/albums`);
        const albums = await response.json();
        
        const details = document.getElementById('artistDetails');
        
        let html = '<h3 style="margin-top:2rem; color: var(--accent);">Diskografija:</h3>';
        html += '<div style="display:grid; gap:1rem; margin-top:1rem;">';
        
        if (albums.length === 0) {
            html += '<p>Nema albuma u bazi.</p>';
        } else {
            albums.forEach(album => {
                html += `
                    <div style="background: rgba(255,255,255,0.05); padding:1rem; border-radius:8px; cursor:pointer;" 
                         onclick="closeArtistModal(); setTimeout(() => showAlbumDetails(${album.id}), 200)">
                        <strong>${album.title}</strong> (${album.year})
                        <br>
                        <small style="color: var(--accent);">⭐ ${album.avg_rating.toFixed(1)} (${album.total_ratings} ratings)</small>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        details.innerHTML += html;
        
    } catch (error) {
        console.error('Error loading artist albums:', error);
    }
}

function filterArtists() {
    const filters = {
        region: document.getElementById('artistRegionFilter').value
    };
    loadArtists(filters);
}

function resetArtistFilters() {
    document.getElementById('artistRegionFilter').value = '';
    loadArtists();
}

// ============ PRODUCERS ============
async function loadProducers() {
    const grid = document.getElementById('producersGrid');
    const spinner = document.getElementById('producersLoadingSpinner');
    
    spinner.style.display = 'block';
    grid.innerHTML = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/producers?skip=0&limit=50`);
        const producers = await response.json();
        
        spinner.style.display = 'none';
        
        if (producers.length === 0) {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No producers found 😔</p>';
            return;
        }
        
        producers.forEach(producer => {
            grid.appendChild(createProducerCard(producer));
        });
        
    } catch (error) {
        console.error('Error loading producers:', error);
        spinner.style.display = 'none';
    }
}

function createProducerCard(producer) {
    const card = document.createElement('div');
    card.className = 'album-card';
    card.onclick = () => showProducerDetails(producer.id);
    
    card.innerHTML = `
        <img src="${producer.image_url || 'https://via.placeholder.com/300x300/1a1a1d/ff6b35?text=' + encodeURIComponent(producer.name)}" 
             alt="${producer.name}" 
             class="album-cover"
             onerror="this.src='https://via.placeholder.com/300x300/1a1a1d/ff6b35?text=Producer'">
        <div class="album-info">
            <h3 class="album-title">${producer.name}</h3>
            <p style="color: var(--primary); font-size: 0.9rem; margin-top: 0.5rem;">
                🎛️ ${producer.signature_sound || 'Producer'}
            </p>
        </div>
    `;
    
    return card;
}

async function showProducerDetails(producerId) {
    try {
        const response = await fetch(`${API_BASE_URL}/producers/${producerId}`);
        const producer = await response.json();
        
        const modal = document.getElementById('producerModal');
        const details = document.getElementById('producerDetails');
        
        details.innerHTML = `
            <h2>${producer.name}</h2>
            <img src="${producer.image_url || 'https://via.placeholder.com/400x400/1a1a1d/ff6b35?text=Producer'}" 
                 alt="${producer.name}" 
                 style="width:100%; max-width:400px; border-radius:10px; margin:1rem 0;">
            
            <p><span class="detail-label">Signature Sound:</span> ${producer.signature_sound || 'N/A'}</p>
            
            <h3 style="color: var(--primary); margin-top: 2rem;">Biografija</h3>
            <p style="line-height: 1.8;">${producer.biography || 'No biography available.'}</p>
            
            <h3 style="color: var(--accent); margin-top: 2rem;">🔥 Fun Facts</h3>
            <p style="line-height: 1.8; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
                ${producer.fun_facts || 'No fun facts available.'}
            </p>
            
            <h3 style="color: var(--primary); margin-top: 2rem;">🎛️ Produkcijske Tehnike</h3>
            <p style="line-height: 1.8; background: rgba(0,78,137,0.1); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--secondary);">
                ${producer.production_techniques || 'No techniques available.'}
            </p>
            
            <h3 style="color: var(--accent); margin-top: 2rem;">📀 Najznačajniji Albumi</h3>
            <p style="line-height: 1.8; background: rgba(255,107,53,0.1); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary);">
                ${producer.notable_albums || 'No notable albums listed.'}
            </p>
            
            <button class="btn btn-primary" onclick="showProducerAlbums(${producer.id})" style="margin-top: 2rem;">
                Producirani Albumi u Bazi
            </button>
        `;
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading producer details:', error);
        alert('Error loading producer details');
    }
}

function closeProducerModal() {
    document.getElementById('producerModal').style.display = 'none';
}

async function showProducerAlbums(producerId) {
    try {
        const response = await fetch(`${API_BASE_URL}/producers/${producerId}/albums`);
        const albums = await response.json();
        
        const details = document.getElementById('producerDetails');
        
        let html = '<h3 style="margin-top:2rem; color: var(--accent);">Albumi u bazi koje je producirao:</h3>';
        html += '<div style="display:grid; gap:1rem; margin-top:1rem;">';
        
        if (albums.length === 0) {
            html += '<p>Nema albuma u bazi.</p>';
        } else {
            albums.forEach(album => {
                html += `
                    <div style="background: rgba(255,255,255,0.05); padding:1rem; border-radius:8px; cursor:pointer;" 
                         onclick="closeProducerModal(); setTimeout(() => showAlbumDetails(${album.id}), 200)">
                        <strong>${album.title}</strong> (${album.year})
                        <br>
                        <small style="color: var(--accent);">⭐ ${album.avg_rating.toFixed(1)} (${album.total_ratings} ratings)</small>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        details.innerHTML += html;
        
    } catch (error) {
        console.error('Error loading producer albums:', error);
    }
}

// ============ TOP RATED ============
async function loadTopRated() {
    try {
        const response = await fetch(`${API_BASE_URL}/recommendations/top-rated?limit=6`);
        const albums = await response.json();
        
        const grid = document.getElementById('topRatedGrid');
        grid.innerHTML = '';
        
        albums.forEach(album => {
            grid.appendChild(createAlbumCard(album));
        });
    } catch (error) {
        console.error('Error loading top rated:', error);
    }
}

// ============ UTILITIES ============
async function getRandomAlbum() {
    try {
        const response = await fetch(`${API_BASE_URL}/recommendations/random?era=golden_age`);
        const album = await response.json();
        showAlbumDetails(album.id);
    } catch (error) {
        console.error('Error loading random album:', error);
        alert('Error loading random album');
    }
}

function scrollToAlbums() {
    document.getElementById('albums').scrollIntoView({ behavior: 'smooth' });
}

// Close modals on outside click
window.onclick = function(event) {
    const albumModal = document.getElementById('albumModal');
    const artistModal = document.getElementById('artistModal');
    const producerModal = document.getElementById('producerModal');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    if (event.target === albumModal) albumModal.style.display = 'none';
    if (event.target === artistModal) artistModal.style.display = 'none';
    if (event.target === producerModal) producerModal.style.display = 'none';
    if (event.target === loginModal) loginModal.style.display = 'none';
    if (event.target === registerModal) registerModal.style.display = 'none';
}