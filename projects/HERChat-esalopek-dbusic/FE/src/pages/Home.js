import React, { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { useHistory } from "react-router-dom/cjs/react-router-dom";
import { apiClient } from "../api/client";
import LogoIcon from "../assets/logo.png";
import SaveIcon from "../assets/save.svg";
import SaveFilledIcon from "../assets/saveFilled.svg";

export default function HERChat() {
  const history = useHistory();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  // Fetch current user and posts on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setCurrentUser(user);

        // Fetch posts
        const postsData = await apiClient.getPosts();
        const postsList = postsData || [];

        // Fetch saved posts for current user and merge saved flag
        let savedIds = [];
        try {
          const saved = await apiClient.getSaves();
          savedIds = (saved || []).map((s) => s.id);
        } catch (e) {
          // ignore if not logged in or no saves
          savedIds = [];
        }

        setPosts(
          postsList.map((p) => ({ ...p, saved: savedIds.includes(p.id) })),
        );
        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load posts");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLike = async (postId) => {
    try {
      const post = posts.find((p) => p.id === postId);

      // Check if already liked
      const isLiked = posts.find((p) => p.id === postId)?.liked;

      if (isLiked) {
        await apiClient.removeFavorite(postId);
      } else {
        await apiClient.addFavorite(postId);
      }

      // Update local state
      setPosts(
        posts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              liked: !p.liked,
              likes: p.liked ? p.likes - 1 : p.likes + 1,
            };
          }
          return p;
        }),
      );
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;

    try {
      const response = await apiClient.createPost(newPost);

      // Add new post to beginning of list
      const newPostObj = {
        id: response.post.id,
        user_id: currentUser.id,
        content: newPost,
        image_url: null,
        created_at: new Date().toISOString(),
        username: currentUser.username,
        avatar_url: currentUser.avatar_url,
        likes: 0,
        comments: 0,
        liked: false,
      };

      setPosts([newPostObj, ...posts]);
      setNewPost("");
      setError("");
    } catch (err) {
      console.error("Error posting:", err);
      setError(err.message || "Failed to post");
    }
  };

  const handleShare = () => {
    alert("Share feature coming soon!");
  };

  const handleSaveToggle = async (postId) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (post.saved) {
        await apiClient.removeSave(postId);
      } else {
        await apiClient.addSave(postId);
      }

      setPosts(
        posts.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p)),
      );
    } catch (err) {
      console.error("Error toggling save:", err);
    }
  };

  const handleComment = (postId) => {
    const comment = prompt("Add a comment:");
    if (comment) {
      handleCommentSubmit(postId, comment);
    }
  };

  const handleCommentSubmit = async (postId, content) => {
    try {
      await apiClient.createComment(postId, content);

      // Update local state
      setPosts(
        posts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              comments: p.comments + 1,
            };
          }
          return p;
        }),
      );
    } catch (err) {
      console.error("Error commenting:", err);
    }
  };

  const handleEditClick = (post) => {
    setEditingPostId(post.id);
    setEditingContent(post.content);
  };

  const handleEditSave = async (postId) => {
    if (!editingContent.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    try {
      await apiClient.editPost(postId, editingContent);

      // Update local state
      setPosts(
        posts.map((p) => {
          if (p.id === postId) {
            return { ...p, content: editingContent };
          }
          return p;
        }),
      );

      setEditingPostId(null);
      setEditingContent("");
      setError("");
    } catch (err) {
      console.error("Error editing post:", err);
      setError(err.message || "Failed to edit post");
    }
  };

  const handleEditCancel = () => {
    setEditingPostId(null);
    setEditingContent("");
  };

  const formatPostTime = (iso) => {
    if (!iso) return "Just now";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Just now";
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return "Just now";
    if (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    ) {
      return "Today";
    }
    const pad = (n) => n.toString().padStart(2, "0");
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const dd = pad(d.getDate());
    const mo = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    return `${hh}:${mm} ${dd}/${mo}/${yyyy}`;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ textAlign: "center", paddingTop: "2rem" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <div style={styles.logoSection}>
            <div style={styles.logoCircle}>
              <img
                alt="logo img"
                src={LogoIcon}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <h1 style={styles.logoText}>HERChat</h1>
          </div>
          <div style={styles.headerButtons}>
            <button
              style={styles.btnLogout}
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                history.push("/");
              }}
            >
              Log out
            </button>
            <button
              style={styles.btnProfile}
              onClick={() => history.push("/profile")}
            >
              Profile
            </button>
          </div>
        </div>
      </header>

      <div style={styles.mainContainer}>
        <div style={styles.gridContainer}>
          {/* Sidebar */}
          <div style={styles.sidebar}>
            {/* Most Asked Questions */}
            <div style={styles.sidebarCard}>
              <div style={styles.sidebarTitle}>
                <HelpCircle style={styles.iconPink} size={24} />
                <h2 style={styles.titleText}>Most Asked</h2>
              </div>
              <ul style={styles.questionList}>
                <li style={styles.questionItem}>
                  💼 Career advice for women in tech?
                </li>
                <li style={styles.questionItem}>
                  🏋️‍♀️ Best workout routines for busy moms?
                </li>
                <li style={styles.questionItem}>
                  💄 Skincare tips for your 30s?
                </li>
                <li style={styles.questionItem}>
                  📚 Book recommendations for self-growth?
                </li>
              </ul>
            </div>

            {/* Trending Topics */}
            <div style={{ ...styles.sidebarCard, ...styles.purpleBorder }}>
              <div style={styles.sidebarTitle}>
                <TrendingUp style={styles.iconPurple} size={24} />
                <h2 style={styles.titleText}>Trending</h2>
              </div>
              <div style={styles.trendingTags}>
                <div
                  style={styles.tag}
                  onClick={() => alert("Hashtag filter coming soon!")}
                >
                  #WomenInBusiness
                </div>
                <div
                  style={styles.tag}
                  onClick={() => alert("Hashtag filter coming soon!")}
                >
                  #SelfCare
                </div>
                <div
                  style={styles.tag}
                  onClick={() => alert("Hashtag filter coming soon!")}
                >
                  #WellnessJourney
                </div>
              </div>
            </div>

            {/* Community Guidelines */}
            <div style={styles.sidebarCard}>
              <div style={styles.sidebarTitle}>
                <Sparkles style={styles.iconPink} size={24} />
                <h2 style={styles.titleText}>Community</h2>
              </div>
              <p style={styles.communityText}>
                A safe space for women to share, support, and empower each
                other. Be kind, be respectful, be you! 💕
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div style={styles.mainContent}>
            {/* Error Message */}
            {error && (
              <div
                style={{
                  ...styles.createPostCard,
                  backgroundColor: "#ffebee",
                  borderColor: "#ef5350",
                }}
              >
                <p style={{ color: "#c62828" }}>{error}</p>
              </div>
            )}

            {/* Create Post */}
            <div style={styles.createPostCard}>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind?"
                style={styles.textarea}
              />
              <div style={styles.postActions}>
                <button onClick={handlePost} style={styles.btnPost}>
                  Post
                </button>
              </div>
            </div>

            {/* Posts Feed */}
            {posts.length === 0 ? (
              <div style={styles.postCard}>
                <p style={{ textAlign: "center", color: "#999" }}>
                  No posts yet. Create one to get started!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} style={styles.postCard}>
                  <div style={styles.postHeader}>
                    <div style={styles.postAvatar}>
                      {(post.username || post.author || "U")
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div style={styles.postInfo}>
                      <h3 style={styles.postAuthor}>
                        {post.username || post.author}
                      </h3>
                      <p style={styles.postTime}>
                        {formatPostTime(post.created_at)}
                      </p>
                    </div>
                    {/* Edit button for post owner */}
                    {currentUser?.id === post.user_id && !editingPostId && (
                      <button
                        onClick={() => handleEditClick(post)}
                        style={{ ...styles.actionBtn, marginLeft: "auto" }}
                      >
                        ✏️ Edit
                      </button>
                    )}
                    {post.user_id !== currentUser?.id && (
                      <button
                        style={{
                          ...styles.actionBtn,
                          ...(post.saved && styles.actionBtnSaved),
                        }}
                        onClick={() => handleSaveToggle(post.id)}
                      >
                        <span style={styles.actionBtnText}>
                          {post.saved ? (
                            <img
                              src={SaveFilledIcon}
                              alt="Save"
                              style={{ width: "25px", height: "25px" }}
                            />
                          ) : (
                            <img
                              src={SaveIcon}
                              alt="Save"
                              style={{ width: "25px", height: "25px" }}
                            />
                          )}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Edit mode or view mode */}
                  {editingPostId === post.id ? (
                    <div style={{ marginTop: "1rem" }}>
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        style={styles.textarea}
                      />
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          marginTop: "0.5rem",
                        }}
                      >
                        <button
                          onClick={() => handleEditSave(post.id)}
                          style={{ ...styles.btnPost, flex: 1 }}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          style={{
                            ...styles.btnPost,
                            background: "#999",
                            flex: 1,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={styles.postContent}>{post.content}</p>
                  )}

                  {/* Action Buttons */}
                  <div style={styles.postActionsBar}>
                    <button
                      onClick={() => handleLike(post.id)}
                      style={{
                        ...styles.actionBtn,
                        ...(post.liked && styles.actionBtnLiked),
                      }}
                    >
                      <Heart
                        size={20}
                        fill={post.liked ? "#ec407a" : "none"}
                        stroke={post.liked ? "#ec407a" : "currentColor"}
                        strokeWidth={2}
                      />
                      <span style={styles.actionBtnText}>
                        {post.likes || 0}
                      </span>
                    </button>
                    <button
                      style={styles.actionBtn}
                      onClick={() => handleComment(post.id)}
                    >
                      <MessageCircle size={20} />
                      <span style={styles.actionBtnText}>
                        {post.comments || 0}
                      </span>
                    </button>
                    <button style={styles.actionBtn} onClick={handleShare}>
                      <Share2 size={20} />
                      <span style={styles.actionBtnText}>Share</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    height: "fit-content",
    background:
      "linear-gradient(135deg, #fce4ec 0%, #f3e5f5 50%, #fce4ec 100%)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    paddingBottom: 30,
  },
  header: {
    background: "white",
    borderBottom: "4px solid #ec407a",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  headerContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "1rem 1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  logoCircle: {
    width: "50px",
    height: "50px",
    background: "linear-gradient(135deg, #ec407a, #ab47bc)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  logoText: {
    fontSize: "2rem",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #ec407a, #ab47bc)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  headerButtons: {
    display: "flex",
    gap: "1rem",
  },
  btnLogout: {
    padding: "0.5rem 1.5rem",
    background: "transparent",
    color: "#ec407a",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.3s",
  },
  btnProfile: {
    padding: "0.5rem 1.5rem",
    background: "linear-gradient(135deg, #ec407a, #ab47bc)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "box-shadow 0.3s",
  },
  mainContainer: {
    maxWidth: "1200px",
    margin: "2rem auto",
    padding: "0 1.5rem",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: "1.5rem",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  sidebarCard: {
    background: "white",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    border: "2px solid #f8bbd0",
  },
  purpleBorder: {
    border: "2px solid #e1bee7",
  },
  sidebarTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  titleText: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: "#333",
  },
  iconPink: {
    color: "#ec407a",
  },
  iconPurple: {
    color: "#ab47bc",
  },
  questionList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  questionItem: {
    padding: "0.5rem 0",
    color: "#555",
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "color 0.3s",
  },
  trendingTags: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  tag: {
    background: "linear-gradient(90deg, #fce4ec, #f3e5f5)",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    fontWeight: "600",
    color: "#555",
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "all 0.3s",
  },
  communityText: {
    color: "#666",
    fontSize: "0.9rem",
    lineHeight: "1.6",
  },
  mainContent: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  createPostCard: {
    background: "white",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    border: "2px solid #f8bbd0",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "1rem",
    border: "2px solid #f8bbd0",
    borderRadius: "12px",
    fontFamily: "inherit",
    fontSize: "1rem",
    resize: "none",
    minHeight: "100px",
    outline: "none",
    boxSizing: "border-box",
  },
  postActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "1rem",
  },
  btnPost: {
    padding: "0.6rem 2rem",
    background: "linear-gradient(135deg, #ec407a, #ab47bc)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "box-shadow 0.3s",
  },
  postCard: {
    background: "white",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    border: "2px solid #f8bbd0",
    animation: "fadeIn 0.3s ease-in",
  },
  postHeader: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1rem",
  },
  postAvatar: {
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #ec407a, #ab47bc)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "bold",
    flexShrink: 0,
  },
  postInfo: {
    flex: 1,
  },
  postAuthor: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: "0.25rem",
  },
  postTime: {
    color: "#999",
    fontSize: "0.85rem",
  },
  postContent: {
    color: "#555",
    lineHeight: "1.6",
    marginTop: "0.5rem",
    width: "100%",
    overflow: "hidden",
    whiteSpace: "normal",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    wordBreak: "break-all",
  },
  postActionsBar: {
    display: "flex",
    gap: "2rem",
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "2px solid #fce4ec",
  },
  actionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "none",
    border: "none",
    color: "#666",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "color 0.3s",
  },
  actionBtnLiked: {
    color: "#ec407a",
  },
  actionBtnSaved: {
    color: "#1f6feb",
  },
  actionBtnText: {
    fontSize: "0.9rem",
  },
};
