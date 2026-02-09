const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const token = localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "API request failed");
    }

    return response.json();
  },

  // Auth
  register(username, email, password) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  },

  login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  // Posts
  getPosts() {
    return this.request("/posts");
  },

  getPost(id) {
    return this.request(`/posts/${id}`);
  },

  createPost(content, image_url) {
    return this.request("/posts", {
      method: "POST",
      body: JSON.stringify({ content, image_url }),
    });
  },

  editPost(id, content, image_url) {
    return this.request(`/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify({ content, image_url }),
    });
  },

  deletePost(id) {
    return this.request(`/posts/${id}`, { method: "DELETE" });
  },

  // Comments
  getComments(postId) {
    return this.request(`/comments/post/${postId}`);
  },

  createComment(post_id, content) {
    return this.request("/comments", {
      method: "POST",
      body: JSON.stringify({ post_id, content }),
    });
  },

  // Users
  getUser(username) {
    return this.request(`/users/${username}`);
  },

  getCurrentUser() {
    return this.request("/users/me");
  },

  updateProfile(id, bio, avatar_url, theme) {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify({ bio, avatar_url, theme }),
    });
  },

  // Favorites
  getFavorites() {
    return this.request("/favorites");
  },

  addFavorite(postId) {
    return this.request(`/favorites/${postId}`, { method: "POST" });
  },

  removeFavorite(postId) {
    return this.request(`/favorites/${postId}`, { method: "DELETE" });
  },

  // Saves (bookmarks)
  getSaves() {
    return this.request("/saves");
  },

  addSave(postId) {
    return this.request(`/saves/${postId}`, { method: "POST" });
  },

  removeSave(postId) {
    return this.request(`/saves/${postId}`, { method: "DELETE" });
  },

  // Follow
  getFollowers(userId) {
    return this.request(`/follow/followers/${userId}`);
  },

  getFollowing(userId) {
    return this.request(`/follow/following/${userId}`);
  },

  followUser(userId) {
    return this.request(`/follow/${userId}`, { method: "POST" });
  },

  unfollowUser(userId) {
    return this.request(`/follow/${userId}`, { method: "DELETE" });
  },

  // Cycle
  getCycleEntries() {
    return this.request("/cycle");
  },

  addCycleEntry(date, period_start, notes) {
    return this.request("/cycle", {
      method: "POST",
      body: JSON.stringify({ date, period_start, notes }),
    });
  },

  updateCycleEntry(id, date, period_start, notes) {
    return this.request(`/cycle/${id}`, {
      method: "PUT",
      body: JSON.stringify({ date, period_start, notes }),
    });
  },

  deleteCycleEntry(id) {
    return this.request(`/cycle/${id}`, { method: "DELETE" });
  },
};
