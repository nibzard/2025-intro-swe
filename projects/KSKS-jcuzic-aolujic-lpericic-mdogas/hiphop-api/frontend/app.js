const API_BASE_URL = 'https://2025-intro-swe-production.up.railway.app/api/v1';
console.log('🔍 API_BASE_URL:', API_BASE_URL);
let currentToken = localStorage.getItem('token');
let currentUser = null;
let currentGenre = '';  // Track selected genre

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAlbums();
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

// Load Albums
async function loadAlbums(filters = {}) {
    const grid = document.getElementById('albumsGrid');
    const spinner = document.getElementById('loadingSpinner');
    const errorMsg = document.getElementById('errorMessage');
    
    spinner.style.display = 'block';
    errorMsg.style.display = 'none';
    grid.innerHTML = '';
    
    try {
        let url = `${API_BASE_URL}/albums/?skip=0&limit=50&random=true&_t=${Date.now()}`;

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
        <img src="${album.cover_url || 'https://via.placeholder.com/300x300/1a1a1d/ff6b35?text=' + encodeURIComponent(album.title)}"
             alt="${album.title}"
             class="album-cover"
             onerror="this.src='https://via.placeholder.com/300x300/1a1a1d/ff6b35?text=Album+Cover'">
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
async function showAlbumDetails(albumId) {
    try {
        const response = await fetch(`${API_BASE_URL}/albums/${albumId}`);
        let album = await response.json();

        const modal = document.getElementById('albumModal');
        const details = document.getElementById('albumDetails');

        // Function to render album details
        function renderAlbumDetails(albumData) {
            // Build artist bio section
            let artistBioHtml = '';
            if (albumData.artist_bio) {
                artistBioHtml = `
                    <div class="wiki-section">
                        <h3 class="wiki-header">🎤 About ${albumData.artist}</h3>
                        <p class="wiki-content">${albumData.artist_bio}</p>
                    </div>
                `;
            }

            // Build album story section
            let albumStoryHtml = '';
            if (albumData.album_story) {
                albumStoryHtml = `
                    <div class="wiki-section">
                        <h3 class="wiki-header">💿 Album Story</h3>
                        <p class="wiki-content">${albumData.album_story}</p>
                    </div>
                `;
            }

            // Build producer bio section (only if different from artist)
            let producerBioHtml = '';
            if (albumData.producer_bio && albumData.producer) {
                producerBioHtml = `
                    <div class="wiki-section">
                        <h3 class="wiki-header">🎹 About ${albumData.producer} (Producer)</h3>
                        <p class="wiki-content">${albumData.producer_bio}</p>
                    </div>
                `;
            }

            // Show loading message if Wikipedia data is being fetched
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
                <img src="${albumData.cover_url || 'https://via.placeholder.com/400x400/1a1a1d/ff6b35?text=Album'}"
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

                <!-- Comments Section -->
                <div class="comments-section" style="margin-top: 2rem; padding: 1.5rem; background: rgba(255,255,255,0.05); border-radius: 10px;">
                    <h3 style="color: var(--accent); margin-bottom: 1rem;">💬 Comments</h3>
                    <div id="comments-list-${albumData.id}"></div>
                    ${currentToken ? `
                        <div style="margin-top: 1.5rem;">
                            <textarea id="comment-input-${albumData.id}" placeholder="Write a comment..."
                                style="width: 100%; min-height: 80px; padding: 0.75rem; border-radius: 5px;
                                border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3);
                                color: white; font-family: inherit; resize: vertical;"></textarea>
                            <button class="btn btn-secondary" style="margin-top: 0.5rem;"
                                onclick="submitComment(${albumData.id})">Post Comment</button>
                        </div>
                    ` : `
                        <p style="color: #888; margin-top: 1rem;">Please <a href="#" onclick="document.getElementById('loginBtn').click(); return false;" style="color: var(--accent);">login</a> to comment</p>
                    `}
                </div>

                <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="getSimilarAlbums(${albumData.id})">Similar Albums</button>
                </div>
            `;
        }

        // Render initial album details
        renderAlbumDetails(album);
        modal.style.display = 'block';

        // Load comments for this album
        loadComments(albumId);

        // Automatically fetch Wikipedia data if not available
        if (!album.artist_bio && !album.album_story) {
            try {
                const enrichResponse = await fetch(`${API_BASE_URL}/albums/${albumId}/enrich-wikipedia`, {
                    method: 'POST'
                });

                if (enrichResponse.ok) {
                    const enrichedAlbum = await enrichResponse.json();
                    // Re-render with enriched data
                    renderAlbumDetails(enrichedAlbum);
                } else {
                    // Remove loading message if fetch failed
                    const loadingEl = document.getElementById('wiki-loading');
                    if (loadingEl) {
                        loadingEl.innerHTML = '<p style="color: #888; text-align: center;">📚 Wikipedia information not available for this album.</p>';
                    }
                }
            } catch (error) {
                console.error('Error fetching Wikipedia data:', error);
                // Remove loading message on error
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
                rating: selectedRating
            })
        });

        if (response.ok) {
            alert('✅ Rating submitted successfully!');
            selectedRating = 0;

            // Refresh album details to show updated rating
            closeModal();
            setTimeout(() => showAlbumDetails(albumId), 300);

            // Reload albums and top-rated to update displayed ratings
            loadAlbums({ genre: currentGenre });
            loadTopRated();
        } else {
            const error = await response.json();
            alert(`❌ Failed to submit rating: ${error.detail || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        alert('❌ Error submitting rating');
    }
}

// Load comments for an album
async function loadComments(albumId) {
    try {
        const response = await fetch(`${API_BASE_URL}/comments/album/${albumId}`);
        const comments = await response.json();

        const commentsList = document.getElementById(`comments-list-${albumId}`);

        if (comments.length === 0) {
            commentsList.innerHTML = '<p style="color: #888; text-align: center;">No comments yet. Be the first to comment!</p>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => `
            <div style="padding: 1rem; margin-bottom: 1rem; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 3px solid var(--primary);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="color: var(--primary);">@${comment.username}</strong>
                    <small style="color: #888;">${new Date(comment.created_at).toLocaleDateString()}</small>
                </div>
                <p style="color: #ddd; line-height: 1.5;">${comment.content}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Submit a comment
async function submitComment(albumId) {
    const commentInput = document.getElementById(`comment-input-${albumId}`);
    const content = commentInput.value.trim();

    if (!content) {
        alert('Please write a comment');
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
            alert('✅ Comment posted successfully!');
            commentInput.value = '';
            loadComments(albumId); // Reload comments
        } else {
            const error = await response.json();
            alert(`❌ Failed to post comment: ${error.detail || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('❌ Error submitting comment');
    }
}

// Close modals on outside click
window.onclick = function(event) {
    const albumModal = document.getElementById('albumModal');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    if (event.target === albumModal) {
        albumModal.style.display = 'none';
    }
    if (event.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (event.target === registerModal) {
        registerModal.style.display = 'none';
    }
}