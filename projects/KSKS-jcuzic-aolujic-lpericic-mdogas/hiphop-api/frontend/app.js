const API_BASE_URL = 'http://localhost:8000/api/v1';
let currentToken = localStorage.getItem('token');
let currentUser = null;
let currentGenre = '';  // Track selected genre

<<<<<<< HEAD
// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAlbums();
=======
// Check for saved theme preference or default to dark
const currentTheme = localStorage.getItem('theme') || 'dark';
document.body.classList.toggle('light-mode', currentTheme === 'light');

// Update toggle button icon
function updateThemeIcon() {
    const themeToggle = document.getElementById('themeToggle');
    if (document.body.classList.contains('light-mode')) {
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
}

// Initialize theme icon
document.addEventListener('DOMContentLoaded', () => {
    updateThemeIcon();
    
    // Theme toggle event listener
    document.getElementById('themeToggle').addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        
        // Save preference
        const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', theme);
        
        // Update icon
        updateThemeIcon();
    });
    
    loadAlbums();
    loadArtists();
    loadProducers();
>>>>>>> 17e960b (Frontend za cijeli projekt)
    loadTopRated();
    checkAuth();
});

// Auth Check
function checkAuth() {
    if (currentToken) {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'block';
        document.getElementById('profileBtn').style.display = 'block'; // Show profile button
    } else {
        document.getElementById('loginBtn').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('profileBtn').style.display = 'none'; // Hide profile button
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

// Load Albums
async function loadAlbums(filters = {}) {
    const grid = document.getElementById('albumsGrid');
    const spinner = document.getElementById('loadingSpinner');
    const errorMsg = document.getElementById('errorMessage');
    
    spinner.style.display = 'block';
    errorMsg.style.display = 'none';
    grid.innerHTML = '';
    
    try {
        let url = `${API_BASE_URL}/albums?skip=0&limit=50`;

        if (filters.genre) url += `&genre=${filters.genre}`;
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
        errorMsg.style.display = 'block';
        errorMsg.textContent = '❌ Error loading albums. Make sure the API is running!';
    }
}

// Create Album Card
function createAlbumCard(album) {
    const card = document.createElement('div');
    card.className = 'album-card';
    card.onclick = () => showAlbumDetails(album.id);

    // Genre badge
    const genreClass = `genre-${album.genre}`;
    const genreName = album.genre.replace('_', ' ').split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // Region badge (optional)
    let regionBadge = '';
    if (album.region) {
        const regionClass = `region-${album.region}`;
        const regionName = album.region.replace('_', ' ').toUpperCase();
        regionBadge = `<span class="region-badge ${regionClass}">${regionName}</span>`;
    }

    card.innerHTML = `
        <img src="${album.cover_url || 'https://placehold.co/300x300/1a1a1d/ff6b35?text=' + encodeURIComponent(album.title)}"
             alt="${album.title}"
             class="album-cover"
             onerror="this.src='https://placehold.co/300x300/1a1a1d/ff6b35?text=Album+Cover'">
        <div class="album-info">
            <h3 class="album-title">${album.title}</h3>
            <p class="album-artist">${album.artist}</p>
            <div class="badges">
                <span class="genre-badge ${genreClass}">${genreName}</span>
                ${regionBadge}
            </div>
            <div class="album-meta">
                <span>${album.year}</span>
                <span class="album-rating">⭐ ${album.avg_rating.toFixed(1)} (${album.total_ratings})</span>
            </div>
        </div>
    `;
    
    return card;
}

// Show Album Details
// Updated showAlbumDetails with Comments
async function showAlbumDetails(albumId) {
    try {
        const response = await fetch(`${API_BASE_URL}/albums/${albumId}`);
        let album = await response.json();

        const modal = document.getElementById('albumModal');
        const details = document.getElementById('albumDetails');

        function renderAlbumDetails(albumData) {
            let artistBioHtml = '';
            if (albumData.artist_bio) {
                artistBioHtml = `
                    <div class="wiki-section">
                        <h3 class="wiki-header">🎤 About ${albumData.artist}</h3>
                        <p class="wiki-content">${albumData.artist_bio}</p>
                    </div>
                `;
            }

            let albumStoryHtml = '';
            if (albumData.album_story) {
                albumStoryHtml = `
                    <div class="wiki-section">
                        <h3 class="wiki-header">💿 Album Story</h3>
                        <p class="wiki-content">${albumData.album_story}</p>
                    </div>
                `;
            }

            let producerBioHtml = '';
            if (albumData.producer_bio && albumData.producer) {
                producerBioHtml = `
                    <div class="wiki-section">
                        <h3 class="wiki-header">🎹 About ${albumData.producer} (Producer)</h3>
                        <p class="wiki-content">${albumData.producer_bio}</p>
                    </div>
                `;
            }

            let loadingHtml = '';
            if (!albumData.artist_bio && !albumData.album_story) {
                loadingHtml = `
                    <div class="wiki-section" id="wiki-loading" style="background: rgba(255, 193, 7, 0.1); border-left-color: var(--accent);">
                        <p style="color: var(--accent); text-align: center;">
                            ⏳ Fetching Wikipedia information...
                        </p>
                    </div>
                `;
            }

            details.innerHTML = `
                <h2>${albumData.title}</h2>
                <img src="${albumData.cover_url || 'https://placehold.co/400x400/1a1a1d/ff6b35?text=Album'}"
                     alt="${albumData.title}"
                     style="width:100%; max-width:400px; border-radius:10px; margin:1rem 0;">
                <p><span class="detail-label">Artist:</span> ${albumData.artist}</p>
                <p><span class="detail-label">Year:</span> ${albumData.year}</p>
                <p><span class="detail-label">Region:</span> ${albumData.region.replace('_', ' ').toUpperCase()}</p>
                <p><span class="detail-label">Producer:</span> ${albumData.producer || 'N/A'}</p>
                <p><span class="detail-label">Label:</span> ${albumData.label || 'N/A'}</p>
                <p><span class="detail-label">Rating:</span> ⭐ ${albumData.avg_rating.toFixed(2)} / 5.0 (${albumData.total_ratings} ratings)</p>
                <p><span class="detail-label">Description:</span></p>
                <p>${albumData.description || 'No description available.'}</p>

                ${loadingHtml}
                ${artistBioHtml}
                ${albumStoryHtml}
                ${producerBioHtml}

                <div class="rating-section" style="margin-top: 2rem; padding: 1.5rem; background: rgba(255,255,255,0.05); border-radius: 10px;">
                    <h3 style="color: var(--accent); margin-bottom: 1rem;">Rate this Album</h3>
                    ${currentToken ? `
                        <div class="star-rating" id="starRating-${albumData.id}" style="font-size: 2rem; margin-bottom: 1rem;">
                            <span class="star" data-rating="1" onclick="selectRating(${albumData.id}, 1)">☆</span>
                            <span class="star" data-rating="2" onclick="selectRating(${albumData.id}, 2)">☆</span>
                            <span class="star" data-rating="3" onclick="selectRating(${albumData.id}, 3)">☆</span>
                            <span class="star" data-rating="4" onclick="selectRating(${albumData.id}, 4)">☆</span>
                            <span class="star" data-rating="5" onclick="selectRating(${albumData.id}, 5)">☆</span>
                        </div>
                        <button class="btn btn-secondary" id="submitRating-${albumData.id}" onclick="submitRating(${albumData.id})" disabled>Submit Rating</button>
                    ` : `
                        <p style="color: #888;">Please <a href="#" onclick="document.getElementById('loginBtn').click(); return false;" style="color: var(--accent);">login</a> to rate this album</p>
                    `}
                </div>

                <!-- COMMENTS SECTION -->
                <div class="comments-section">
                    <h3 class="comments-header">💬 Comments</h3>
                    
                    ${currentToken ? `
                        <div class="comment-input-area">
                            <textarea 
                                id="comment-input-${albumData.id}" 
                                class="comment-textarea" 
                                placeholder="Share your thoughts about this album..."></textarea>
                            <button class="btn btn-primary" onclick="submitComment(${albumData.id})">Post Comment</button>
                        </div>
                    ` : `
                        <p style="color: #888; text-align: center; padding: 1rem;">
                            Please <a href="#" onclick="document.getElementById('loginBtn').click(); return false;" style="color: var(--accent);">login</a> to comment
                        </p>
                    `}
                    
                    <div id="comments-${albumData.id}">
                        <p style="text-align: center; color: #888;">Loading comments...</p>
                    </div>
                </div>

                <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="getSimilarAlbums(${albumData.id})">Similar Albums</button>
                </div>
            `;
            
            // Load comments after rendering
            loadComments(albumData.id);
        }

        renderAlbumDetails(album);
        modal.style.display = 'block';

        if (!album.artist_bio && !album.album_story) {
            try {
                const enrichResponse = await fetch(`${API_BASE_URL}/albums/${albumId}/enrich-wikipedia`, {
                    method: 'POST'
                });

                if (enrichResponse.ok) {
                    const enrichedAlbum = await enrichResponse.json();
                    renderAlbumDetails(enrichedAlbum);
                } else {
                    const loadingEl = document.getElementById('wiki-loading');
                    if (loadingEl) {
                        loadingEl.innerHTML = '<p style="color: #888; text-align: center;">📚 Wikipedia information not available for this album.</p>';
                    }
                }
            } catch (error) {
                console.error('Error fetching Wikipedia data:', error);
                const loadingEl = document.getElementById('wiki-loading');
                if (loadingEl) {
                    loadingEl.remove();
                }
            }
        }
    } catch (error) {
        console.error('Error loading album details:', error);
        alert('Error loading album details');
    }
}

function closeModal() {
    document.getElementById('albumModal').style.display = 'none';
}


// Similar Albums
async function getSimilarAlbums(albumId) {
    try {
        const response = await fetch(`${API_BASE_URL}/recommendations/similar/${albumId}?limit=5`);
        const recommendations = await response.json();
        
        const details = document.getElementById('albumDetails');
        
        let html = '<h3 style="margin-top:2rem; color: var(--accent);">Similar Albums:</h3>';
        html += '<div style="display:grid; gap:1rem; margin-top:1rem;" id="similarAlbumsContainer">';
        
        recommendations.forEach((rec) => {
            html += `
                <div class="similar-album-card" data-album-id="${rec.album.id}" style="background: rgba(255,255,255,0.05); padding:1rem; border-radius:8px; cursor:pointer;">
                    <strong>${rec.album.artist} - ${rec.album.title}</strong> (${rec.album.year})
                    <br>
                    <small style="color: var(--accent);">Similarity: ${(rec.similarity_score * 100).toFixed(0)}%</small>
                    <br>
                    <small style="color: #888;">${rec.reason}</small>
                </div>
            `;
        });
        
        html += '</div>';
        details.innerHTML += html;
        
        // Add click listeners AFTER HTML is added
        setTimeout(() => {
            const similarCards = document.querySelectorAll('.similar-album-card');
            similarCards.forEach(card => {
                card.addEventListener('click', function() {
                    const albumId = this.getAttribute('data-album-id');
                    closeModal();
                    setTimeout(() => showAlbumDetails(albumId), 200);
                });
            });
        }, 100);
        
    } catch (error) {
        console.error('Error loading recommendations:', error);
    }
}

// Top Rated
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

// Genre Tab Selection
function selectGenre(genre) {
    currentGenre = genre;

    // Update tab styles
    document.querySelectorAll('.genre-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-genre') === genre) {
            tab.classList.add('active');
        }
    });

    // Reset other filters and load albums for selected genre
    document.getElementById('regionFilter').value = '';
    document.getElementById('yearFilter').value = '';
    document.getElementById('artistFilter').value = '';

    loadAlbums({ genre: genre });
}

// Filters
function filterAlbums() {
    const filters = {
        genre: currentGenre,
        region: document.getElementById('regionFilter').value,
        year: document.getElementById('yearFilter').value,
        artist: document.getElementById('artistFilter').value
    };

    loadAlbums(filters);
}

function resetFilters() {
    document.getElementById('regionFilter').value = '';
    document.getElementById('yearFilter').value = '';
    document.getElementById('artistFilter').value = '';
    filterAlbums();  // Use current genre
}

// Random Album
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

// Scroll to Albums
function scrollToAlbums() {
    document.getElementById('albums').scrollIntoView({ behavior: 'smooth' });
}

// Rating System
let selectedRating = 0;
let currentAlbumId = 0;

function selectRating(albumId, rating) {
    selectedRating = rating;
    currentAlbumId = albumId;

    // Update star display
    const stars = document.querySelectorAll(`#starRating-${albumId} .star`);
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.style.color = 'var(--accent)';
        } else {
            star.textContent = '☆';
            star.style.color = '#666';
        }
    });

    // Enable submit button
    const submitBtn = document.getElementById(`submitRating-${albumId}`);
    if (submitBtn) {
        submitBtn.disabled = false;
    }
}

async function submitRating(albumId) {
    if (!currentToken) {
        alert('Please login to rate albums');
        return;
    }

    if (selectedRating === 0) {
        alert('Please select a rating');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/ratings/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                album_id: albumId,
                score: selectedRating
            })
        });

        if (response.ok) {
            alert('✅ Rating submitted successfully!');
            selectedRating = 0;

            // Refresh album details to show updated rating
            closeModal();
            setTimeout(() => showAlbumDetails(albumId), 300);

            // Reload albums to update displayed ratings
            loadAlbums({ genre: currentGenre });
        } else {
            const error = await response.json();
            alert(`❌ Failed to submit rating: ${error.detail || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        alert('❌ Error submitting rating');
    }
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
        <img src="${artist.image_url || 'https://placehold.co/300x300/1a1a1d/ff6b35?text=' + encodeURIComponent(artist.name)}"
             alt="${artist.name}" 
             class="album-cover"
             onerror="this.src='https://placehold.co/300x300/1a1a1d/ff6b35?text=Artist'">
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
        let artist = await response.json();
        
        const modal = document.getElementById('artistModal');
        const details = document.getElementById('artistDetails');
        
        // Function to render artist details
        function renderArtistDetails(artistData) {
            const regionName = artistData.region.replace('_', ' ').toUpperCase();
            const stars = '⭐'.repeat(Math.round(artistData.influence_score));
            
            // Build Wikipedia bio section
            let wikipediaBioHtml = '';
            if (artistData.wikipedia_bio) {
                wikipediaBioHtml = `
                    <div class="wiki-section">
                        <h3 class="wiki-header">📚 Wikipedia Biography</h3>
                        <p class="wiki-content">${artistData.wikipedia_bio}</p>
                    </div>
                `;
            }
            
            // Build manual bio section (fallback)
            let manualBioHtml = '';
            if (artistData.biography && !artistData.wikipedia_bio) {
                manualBioHtml = `
                    <h3 style="color: var(--primary); margin-top: 2rem;">Biography</h3>
                    <p style="line-height: 1.8;">${artistData.biography}</p>
                `;
            }
            
            // Loading message
            let loadingHtml = '';
            if (!artistData.wikipedia_bio && !artistData.biography) {
                loadingHtml = `
                    <div class="wiki-section" id="wiki-loading-artist" style="background: rgba(255, 193, 7, 0.1); border-left-color: var(--accent);">
                        <p style="color: var(--accent); text-align: center;">
                            ⏳ Fetching Wikipedia information...
                        </p>
                    </div>
                `;
            }
            
            details.innerHTML = `
                <h2>${artistData.name}</h2>
                <img src="${artistData.image_url || 'https://placehold.co/400x400/1a1a1d/ff6b35?text=Artist'}" 
                     alt="${artistData.name}" 
                     style="width:100%; max-width:400px; border-radius:10px; margin:1rem 0;">
                
                <p><span class="detail-label">Region:</span> ${regionName}</p>
                <p><span class="detail-label">Era:</span> ${artistData.era ? artistData.era.replace('_', ' ') : 'N/A'}</p>
                <p><span class="detail-label">Influence Score:</span> ${stars} ${artistData.influence_score.toFixed(1)}/10</p>
                
                ${loadingHtml}
                ${wikipediaBioHtml}
                ${manualBioHtml}
                
                ${artistData.fun_facts ? `
                    <h3 style="color: var(--accent); margin-top: 2rem;">🔥 Fun Facts</h3>
                    <p style="line-height: 1.8; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
                        ${artistData.fun_facts}
                    </p>
                ` : ''}
                
                <button class="btn btn-primary" onclick="showArtistAlbums(${artistData.id})" style="margin-top: 2rem;">
                    View Albums
                </button>
            `;
        }
        
        // Render initial artist details
        renderArtistDetails(artist);
        modal.style.display = 'block';
        
        // Automatically fetch Wikipedia data if not available
        if (!artist.wikipedia_bio) {
            try {
                const enrichResponse = await fetch(`${API_BASE_URL}/artists/${artistId}/enrich-wikipedia`, {
                    method: 'POST'
                });
                
                if (enrichResponse.ok) {
                    const enrichedArtist = await enrichResponse.json();
                    renderArtistDetails(enrichedArtist);
                } else {
                    const loadingEl = document.getElementById('wiki-loading-artist');
                    if (loadingEl) {
                        loadingEl.innerHTML = '<p style="color: #888; text-align: center;">📚 Wikipedia information not available.</p>';
                    }
                }
            } catch (error) {
                console.error('Error fetching Wikipedia data:', error);
                const loadingEl = document.getElementById('wiki-loading-artist');
                if (loadingEl) {
                    loadingEl.remove();
                }
            }
        }
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
        
        let html = '<h3 style="margin-top:2rem; color: var(--accent);">Albums:</h3>';
        html += '<div style="display:grid; gap:1rem; margin-top:1rem;">';
        
        if (albums.length === 0) {
            html += '<p>No albums in database.</p>';
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
        <img src="${producer.image_url || 'https://placehold.co/300x300/1a1a1d/ff6b35?text=' + encodeURIComponent(producer.name)}"
             alt="${producer.name}" 
             class="album-cover"
             onerror="this.src='https://placehold.co/300x300/1a1a1d/ff6b35?text=Producer'">
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
        let producer = await response.json();
        
        const modal = document.getElementById('producerModal');
        const details = document.getElementById('producerDetails');
        
        // Function to render producer details
        function renderProducerDetails(producerData) {
            // Build Wikipedia bio section
            let wikipediaBioHtml = '';
            if (producerData.wikipedia_bio) {
                wikipediaBioHtml = `
                    <div class="wiki-section">
                        <h3 class="wiki-header">📚 Wikipedia Biography</h3>
                        <p class="wiki-content">${producerData.wikipedia_bio}</p>
                    </div>
                `;
            }
            
            // Build manual bio section (fallback)
            let manualBioHtml = '';
            if (producerData.biography && !producerData.wikipedia_bio) {
                manualBioHtml = `
                    <h3 style="color: var(--primary); margin-top: 2rem;">Biography</h3>
                    <p style="line-height: 1.8;">${producerData.biography}</p>
                `;
            }
            
            // Loading message
            let loadingHtml = '';
            if (!producerData.wikipedia_bio && !producerData.biography) {
                loadingHtml = `
                    <div class="wiki-section" id="wiki-loading-producer" style="background: rgba(255, 193, 7, 0.1); border-left-color: var(--accent);">
                        <p style="color: var(--accent); text-align: center;">
                            ⏳ Fetching Wikipedia information...
                        </p>
                    </div>
                `;
            }
            
            details.innerHTML = `
                <h2>${producerData.name}</h2>
                <img src="${producerData.image_url || 'https://placehold.co/400x400/1a1a1d/ff6b35?text=Producer'}" 
                     alt="${producerData.name}" 
                     style="width:100%; max-width:400px; border-radius:10px; margin:1rem 0;">
                
                <p><span class="detail-label">Signature Sound:</span> ${producerData.signature_sound || 'N/A'}</p>
                
                ${loadingHtml}
                ${wikipediaBioHtml}
                ${manualBioHtml}
                
                ${producerData.fun_facts ? `
                    <h3 style="color: var(--accent); margin-top: 2rem;">🔥 Fun Facts</h3>
                    <p style="line-height: 1.8; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
                        ${producerData.fun_facts}
                    </p>
                ` : ''}
                
                ${producerData.production_techniques ? `
                    <h3 style="color: var(--primary); margin-top: 2rem;">🎛️ Production Techniques</h3>
                    <p style="line-height: 1.8; background: rgba(0,78,137,0.1); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--secondary);">
                        ${producerData.production_techniques}
                    </p>
                ` : ''}
                
                ${producerData.notable_albums ? `
                    <h3 style="color: var(--accent); margin-top: 2rem;">📀 Notable Albums</h3>
                    <p style="line-height: 1.8; background: rgba(255,107,53,0.1); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary);">
                        ${producerData.notable_albums}
                    </p>
                ` : ''}
                
                <button class="btn btn-primary" onclick="showProducerAlbums(${producerData.id})" style="margin-top: 2rem;">
                    View Produced Albums
                </button>
            `;
        }
        
        // Render initial producer details
        renderProducerDetails(producer);
        modal.style.display = 'block';
        
        // Automatically fetch Wikipedia data if not available
        if (!producer.wikipedia_bio) {
            try {
                const enrichResponse = await fetch(`${API_BASE_URL}/producers/${producerId}/enrich-wikipedia`, {
                    method: 'POST'
                });
                
                if (enrichResponse.ok) {
                    const enrichedProducer = await enrichResponse.json();
                    renderProducerDetails(enrichedProducer);
                } else {
                    const loadingEl = document.getElementById('wiki-loading-producer');
                    if (loadingEl) {
                        loadingEl.innerHTML = '<p style="color: #888; text-align: center;">📚 Wikipedia information not available.</p>';
                    }
                }
            } catch (error) {
                console.error('Error fetching Wikipedia data:', error);
                const loadingEl = document.getElementById('wiki-loading-producer');
                if (loadingEl) {
                    loadingEl.remove();
                }
            }
        }
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
        
        let html = '<h3 style="margin-top:2rem; color: var(--accent);">Produced Albums in Database:</h3>';
        html += '<div style="display:grid; gap:1rem; margin-top:1rem;">';
        
        if (albums.length === 0) {
            html += '<p>No albums in database.</p>';
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

// ============================================
// COMMENTS SYSTEM
// ============================================

async function loadComments(albumId) {
    try {
        const response = await fetch(`${API_BASE_URL}/comments/album/${albumId}`);
        const comments = await response.json();
        
        const commentsSection = document.getElementById(`comments-${albumId}`);
        
        if (!commentsSection) return;
        
        if (comments.length === 0) {
            commentsSection.innerHTML = '<p style="color: #888; text-align: center;">No comments yet. Be the first!</p>';
            return;
        }
        
        commentsSection.innerHTML = comments.map(comment => `
            <div class="comment-card" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <strong class="comment-username" onclick="showUserProfile(${comment.user_id})" style="cursor: pointer; color: var(--primary);">
                        👤 ${comment.username}
                    </strong>
                    <span class="comment-date">${formatDate(comment.created_at)}</span>
                </div>
                <p class="comment-content">${comment.content}</p>
                ${currentToken && getCurrentUsername() === comment.username ? `
                    <div class="comment-actions">
                        <button class="btn-small btn-secondary" onclick="editComment(${comment.id}, '${escapeHtml(comment.content)}')">Edit</button>
                        <button class="btn-small btn-danger" onclick="deleteComment(${comment.id}, ${albumId})">Delete</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

async function submitComment(albumId) {
    if (!currentToken) {
        alert('Please login to comment');
        return;
    }
    
    const textarea = document.getElementById(`comment-input-${albumId}`);
    const content = textarea.value.trim();
    
    if (!content) {
        alert('Comment cannot be empty');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/comments/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                album_id: albumId,
                content: content
            })
        });
        
        if (response.ok) {
            textarea.value = '';
            await loadComments(albumId);
            alert('✅ Comment posted!');
        } else {
            const error = await response.json();
            alert(`❌ Failed to post comment: ${error.detail}`);
        }
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('❌ Error posting comment');
    }
}

async function editComment(commentId, currentContent) {
    const newContent = prompt('Edit your comment:', currentContent);
    
    if (!newContent || newContent.trim() === '') {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                content: newContent
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            // Reload comments for this album
            await loadComments(data.album_id);
            alert('✅ Comment updated!');
        } else {
            alert('❌ Failed to update comment');
        }
    } catch (error) {
        console.error('Error updating comment:', error);
        alert('❌ Error updating comment');
    }
}

async function deleteComment(commentId, albumId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok || response.status === 204) {
            await loadComments(albumId);
            alert('✅ Comment deleted!');
        } else {
            alert('❌ Failed to delete comment');
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert('❌ Error deleting comment');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/'/g, "\\'");
}

function getCurrentUsername() {
    // You'll need to store username when user logs in
    // For now, decode from token or fetch from /users/me
    return localStorage.getItem('username');
}

// ============================================
// USER PROFILE
// ============================================

async function showUserProfile(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        const profile = await response.json();
        
        const modal = document.getElementById('userProfileModal');
        const details = document.getElementById('userProfileDetails');
        
        // Get user's rated albums
        const ratingsResponse = await fetch(`${API_BASE_URL}/users/${userId}/ratings?limit=10`);
        const ratings = await ratingsResponse.json();
        
        // Format genre name
        const genreName = profile.favorite_genre ? 
            profile.favorite_genre.replace('_', ' ').split(' ').map(w => 
                w.charAt(0).toUpperCase() + w.slice(1)
            ).join(' ') : 'N/A';
        
        details.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">
                    ${profile.username.charAt(0).toUpperCase()}
                </div>
                <div class="profile-info">
                    <h2>${profile.username}</h2>
                    <p style="color: #888;">Member since ${new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
            </div>
            
            <div class="profile-stats">
                <div class="stat-card">
                    <div class="stat-value">${profile.total_ratings}</div>
                    <div class="stat-label">Ratings</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${profile.total_comments}</div>
                    <div class="stat-label">Comments</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">⭐ ${profile.avg_rating_given}</div>
                    <div class="stat-label">Avg Rating</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${genreName}</div>
                    <div class="stat-label">Favorite Genre</div>
                </div>
            </div>
            
            <h3 style="color: var(--accent); margin-top: 2rem;">Recent Ratings</h3>
            <div class="user-ratings-list">
                ${ratings.length === 0 ? '<p style="color: #888;">No ratings yet</p>' : 
                    ratings.map(r => `
                        <div class="user-rating-item" onclick="closeUserProfileModal(); setTimeout(() => showAlbumDetails(${r.album.id}), 200)">
                            <img src="${r.album.cover_url || 'https://placehold.co/80x80/1a1a1d/ff6b35?text=Album'}" 
                                 alt="${r.album.title}"
                                 style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;">
                            <div style="flex: 1;">
                                <strong>${r.album.title}</strong>
                                <p style="color: var(--primary); margin: 0.25rem 0;">${r.album.artist}</p>
                                <div style="display: flex; align-items: center; gap: 1rem; margin-top: 0.25rem;">
                                    <span style="color: var(--accent);">⭐ ${r.rating}/5</span>
                                    <span style="color: #888; font-size: 0.85rem;">${formatDate(r.created_at)}</span>
                                </div>
                                ${r.review ? `<p style="color: #aaa; font-size: 0.9rem; margin-top: 0.5rem;">${r.review}</p>` : ''}
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        `;
        
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading user profile:', error);
        alert('Error loading user profile');
    }
}

function closeUserProfileModal() {
    document.getElementById('userProfileModal').style.display = 'none';
}

async function showMyProfile() {
    if (!currentToken) {
        alert('Please login to view your profile');
        document.getElementById('loginBtn').click();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load profile');
        }
        
        const profile = await response.json();
        showUserProfile(profile.id);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Error loading your profile. Please try logging in again.');
    }
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