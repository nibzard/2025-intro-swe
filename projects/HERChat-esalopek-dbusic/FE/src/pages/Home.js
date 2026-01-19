import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { useHistory } from "react-router-dom/cjs/react-router-dom";
import LogoIcon from "../assets/logo.png";

export default function HERChat() {
  const history = useHistory();
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: "Sarah Johnson",
      avatar: "SJ",
      time: "2 hours ago",
      content:
        "Just finished reading 'Atomic Habits' and I'm feeling so inspired! Small changes really do make a big difference. What book has changed your perspective lately? 📚✨",
      likes: 24,
      comments: 8,
      shares: 3,
      liked: false,
    },
    {
      id: 2,
      author: "Emma Williams",
      avatar: "EW",
      time: "5 hours ago",
      content:
        "Morning yoga session complete! Starting the day with mindfulness has been a game-changer for my mental health. How do you start your mornings? 🧘‍♀️",
      likes: 45,
      comments: 12,
      shares: 5,
      liked: true,
    },
    {
      id: 3,
      author: "Maya Patel",
      avatar: "MP",
      time: "1 day ago",
      content:
        "Finally launched my side business! To all the women out there hesitating - take the leap! You're stronger than you think 💪💼",
      likes: 67,
      comments: 23,
      shares: 15,
      liked: false,
    },
  ]);

  const [newPost, setNewPost] = useState("");

  const handleLike = (postId) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            liked: !post.liked,
            likes: post.liked ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      })
    );
  };

  const handlePost = () => {
    if (newPost.trim()) {
      const post = {
        id: posts.length + 1,
        author: "You",
        avatar: "YO",
        time: "Just now",
        content: newPost,
        likes: 0,
        comments: 0,
        shares: 0,
        liked: false,
      };
      setPosts([post, ...posts]);
      setNewPost("");
    }
  };

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
            <button style={styles.btnLogout} onClick={() => history.push("/")}>
              Log out
            </button>
            <button style={styles.btnProfile}>Profile</button>
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
                <div style={styles.tag}>#WomenInBusiness</div>
                <div style={styles.tag}>#SelfCare</div>
                <div style={styles.tag}>#WellnessJourney</div>
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
            {posts.map((post) => (
              <div key={post.id} style={styles.postCard}>
                <div style={styles.postHeader}>
                  <div style={styles.postAvatar}>{post.avatar}</div>
                  <div style={styles.postInfo}>
                    <h3 style={styles.postAuthor}>{post.author}</h3>
                    <p style={styles.postTime}>{post.time}</p>
                  </div>
                </div>
                <p style={styles.postContent}>{post.content}</p>

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
                    <span style={styles.actionBtnText}>{post.likes}</span>
                  </button>
                  <button style={styles.actionBtn}>
                    <MessageCircle size={20} />
                    <span style={styles.actionBtnText}>{post.comments}</span>
                  </button>
                  <button style={styles.actionBtn}>
                    <Share2 size={20} />
                    <span style={styles.actionBtnText}>{post.shares}</span>
                  </button>
                </div>
              </div>
            ))}
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
  actionBtnText: {
    fontSize: "0.9rem",
  },
};
