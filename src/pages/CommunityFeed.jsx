import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "./CommunityFeed.css";
import { useTranslation } from "react-i18next";



function CommunityFeed() {
  const auth = getAuth();
  const user = auth.currentUser;
  const currentUserId = user?.uid;
    const { t, i18n } = useTranslation();

  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [newPostType, setNewPostType] = useState("question");
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "communityPosts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const postsData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const commentsSnapshot = await getDocs(collection(db, "communityPosts", docSnap.id, "comments"));
          const likesSnapshot = await getDocs(collection(db, "communityPosts", docSnap.id, "likes"));

          const comments = commentsSnapshot.docs.map((c) => ({
            id: c.id,
            ...c.data(),
          }));

          const likes = likesSnapshot.docs.map((likeDoc) => likeDoc.id);
          const hasLiked = currentUserId ? likes.includes(currentUserId) : false;

          return {
            id: docSnap.id,
            ...docSnap.data(),
            comments,
            likesCount: likes.length,
            hasLiked,
          };
        })
      );
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const getUserNameFromEmail = () => {
    return user?.email?.split("@")[0] || "Anonyme";
  };

  const handleNewPost = async () => {
    if (!newPostText.trim()) return;
    try {
      await addDoc(collection(db, "communityPosts"), {
        user_id: getUserNameFromEmail(),
        user_input: newPostText.trim(),
        userId: currentUserId, // 🔴 ajoute cette ligne

        type: newPostType,
        timestamp: serverTimestamp(),
      });
      setNewPostText("");
      setNewPostType("question");
      setShowPostModal(false);
    } catch (error) {
      console.error("Erreur lors de l’ajout du post :", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  const handleComment = async (postId, commentText, resetInput) => {
    if (!commentText.trim()) return;
    try {
      await addDoc(collection(db, "communityPosts", postId, "comments"), {
        text: commentText.trim(),
        author: getUserNameFromEmail(),
        timestamp: serverTimestamp(),
      });
      resetInput();
    } catch (error) {
      console.error("Erreur lors de l’ajout du commentaire :", error);
      alert("Impossible d'ajouter le commentaire.");
    }
  };

  const toggleLike = async (postId, hasLiked) => {
    const likeRef = doc(db, "communityPosts", postId, "likes", currentUserId);
    try {
      if (hasLiked) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, { timestamp: serverTimestamp() });
      }
    } catch (error) {
      console.error("Erreur de like :", error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "question":
        return "🔘 Question";
      case "choc":
        return "🔘 Choc";
      case "autre":
        return "🔘 Autre";
      default:
        return "🔘 Conversation";
    }
  };

  return (
    <div className="community-feed">
      <div className="feed-header">
        <h2 className="feed-title">{t("Accueil")}</h2>
        <button className="post-button" onClick={() => setShowPostModal(true)}>
          <span>➕</span> {t("Ajoute")}
        </button>
      </div>

      {showPostModal && (
        <div className="modal-backdrop" onClick={() => setShowPostModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t("Nouveau Poste")}</h3>
            <select
              className="post-type-select"
              value={newPostType}
              onChange={(e) => setNewPostType(e.target.value)}
            >
              <option value="question">🔘 {t("Question")}</option>
              <option value="choc">🔘 {t("Choc")}</option>
              <option value="autre">🔘 {t("Autre")}</option>
            </select>
            <textarea
              className="post-input"
              placeholder={t("Exprimez-vous librement ici...")}
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleNewPost}> {t("Publier")}</button>
              <button onClick={() => setShowPostModal(false)}> {t("Annuler")}</button>
            </div>
          </div>
        </div>
      )}

      <div className="posts-list">
        {posts.map((post) => (
          <div
            className={`post-card ${selectedPost?.id === post.id ? "expanded" : ""}`}
            key={post.id}
            onClick={() => setSelectedPost(post)}
          >
            <p className="post-header">
              <span className="post-user">{post.user_id}</span>
              <span className={`post-type ${post.type}`}>{getTypeIcon(post.type)}</span>
            </p>

            <p className="post-question preview-text">{post.user_input}</p>

            {post.bot_response && (
              <p className="post-response">
                <strong>🧠 Réponse :</strong> {post.bot_response}
              </p>
            )}

            <div
              className="comments-section"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="like-section" style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <span
                  style={{
                    cursor: "pointer",
                    color: post.hasLiked ? "red" : "gray",
                    fontSize: "1.5rem",
                    marginRight: "8px"
                  }}
                  onClick={() => toggleLike(post.id, post.hasLiked)}
                > 
                  ❤️
                </span>
                <span>{post.likesCount}</span>
              </div>
              <h4 className="comments-title">💬  {t("Commentaire")}</h4>
              {post.comments.slice(0, 2).map((comment) => (
                <p className="comment preview-text" key={comment.id}>
                  <strong>{comment.author || "Anonyme"} :</strong> {comment.text}
                </p>
              ))}
              <CommentInput
                onSubmit={(text, reset) => handleComment(post.id, text, reset)}
                small
              />
            </div>
          </div>
        ))}
      </div>

      {selectedPost && (
        <div className="modal-backdrop" onClick={() => setSelectedPost(null)}>
          <div className="modal detailed-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {selectedPost.user_id} : {getTypeIcon(selectedPost.type)}
            </h3>
            <p className="post-question">
              <strong>Message :</strong> {selectedPost.user_input}
            </p>
            <p className="post-response">
              <strong>Réponse :</strong> {selectedPost.bot_response}
            </p>

            <div className="comments-section">
              <h4>💬 Commentaires :</h4>
              {selectedPost.comments.map((comment) => (
                <p className="comment" key={comment.id}>
                  <strong>{comment.author || "Anonyme"} :</strong> {comment.text}
                </p>
              ))}
              <CommentInput
                onSubmit={(text, reset) =>
                  handleComment(selectedPost.id, text, reset)
                }
              />
            </div>
            <button className="close-btn red" onClick={() => setSelectedPost(null)}>
              ❌
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentInput({ onSubmit, small = false }) {
  const [value, setValue] = useState("");
  return (
    <input
      type="text"
      placeholder="Ajouter un commentaire..."
      className={`comment-input ${small ? "small-input" : ""}`}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onSubmit(value, () => setValue(""));
        }
      }}
    />
  );
}

export default CommunityFeed;
