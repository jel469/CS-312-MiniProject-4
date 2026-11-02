const { useEffect, useState } = React;

const App = () => {
  // app-level state used to track the user session, selected auth mode, list of posts, and edit state.
  const [authMode, setAuthMode] = useState("signin");
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [authMessage, setAuthMessage] = useState(null);
  const [blogMessage, setBlogMessage] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // fetch all posts from the backend
  const loadPosts = async () => {
    const response = await fetch("/api/posts", { credentials: "same-origin" });
    const data = await response.json();
    console.log("Loaded blog data:", data);

    if (data.success) {
      setPosts(data.posts || []);
    }
  };

  // run check for the current session when the app loads to see whether the user is signed in.
  const bootstrapSession = async () => {
    const response = await fetch("/api/auth/me", { credentials: "same-origin" });
    const data = await response.json();

    if (data.user) {
      setUser(data.user);
      setAuthMode("home");
      await loadPosts();
    }

    setLoading(false);
  };

  useEffect(() => {
    bootstrapSession();
  }, []);

  // submit auth requests to the backend, handle success or failure messages.
  const handleAuthSubmit = async (endpoint, payload) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      setAuthMessage({ type: "error", text: data.message || "Authentication failed." });
      return;
    }

    if (endpoint.includes("/signin")) {
      setUser(data.user);
      setAuthMode("home");
      setAuthMessage({ type: "success", text: "Signed in successfully." });
      await loadPosts();
      return;
    }

    setAuthMode("signin");
    setAuthMessage({ type: "success", text: "Your account was created. Please sign in." });
  };

  const handleSignIn = async (form) => {
    await handleAuthSubmit("/api/auth/signin", form);
  };

  const handleSignUp = async (form) => {
    await handleAuthSubmit("/api/auth/signup", form);
  };

  // Log the user out
  const handleLogout = async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });

    if (response.ok) {
      setUser(null);
      setPosts([]);
      setAuthMode("signin");
      setBlogMessage(null);
      setEditingPost(null);
      setAuthMessage({ type: "success", text: "You have been logged out." });
    }
  };

  // create or update a post, depends on whether the user is editing an existing blog post.
  const handleBlogSubmit = async (formData) => {
    const payload = {
      title: formData.title,
      body: formData.body,
    };

    const endpoint = editingPost ? `/api/posts/${editingPost.id}` : "/api/posts";
    const method = editingPost ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      setBlogMessage({ type: "error", text: data.message || "Could not save your post." });
      return;
    }

    setBlogMessage({
      type: "success",
      text: editingPost ? "Your post was updated successfully." : "Your post was created successfully.",
    });
    setEditingPost(null);
    await loadPosts();
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setBlogMessage(null);
  };

  // Delete a post after confirming user
  const handleDelete = async (postId) => {
    const response = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      credentials: "same-origin",
    });

    const data = await response.json();
    if (!response.ok) {
      setBlogMessage({ type: "error", text: data.message || "Unable to delete that post." });
      return;
    }

    setBlogMessage({ type: "success", text: "The post was deleted." });
    await loadPosts();
  };

  if (loading) {
    return (
      <div className="loadingpage">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="authpage">
        <header className="authheader">
          <p className="sitename">{authMode === "signin" ? "Welcome back" : "Create account"}</p>
        </header>

        <main className="authenticationmain">
          <section className="cardauth">
            {authMode === "signin" ? (
              <SignInForm
                onSubmit={handleSignIn}
                onSwitch={() => {
                  setAuthMode("signup");
                  setAuthMessage(null);
                }}
                message={authMessage}
              />
            ) : (
              <SignUpForm
                onSubmit={handleSignUp}
                onSwitch={() => {
                  setAuthMode("signin");
                  setAuthMessage(null);
                }}
                message={authMessage}
              />
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="loadingpage">
      <header className="headerbar">
        <div>
          <p className="sitename">Blog Posting Site</p>
        </div>

        <div className="actionauth">
          <span className="welcomemessage">Hello, {user.name}</span>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main>
        {blogMessage && <p className={`alert ${blogMessage.type}`}>{blogMessage.text}</p>}

        <section className="compose">
          <h1>{editingPost ? "Edit post" : "New post"}</h1>
          <BlogPostForm
            isEditing={Boolean(editingPost)}
            initialValues={
              editingPost ? { title: editingPost.title, body: editingPost.content } : { title: "", body: "" }
            }
            onSubmit={handleBlogSubmit}
            onCancel={() => {
              setEditingPost(null);
              setBlogMessage(null);
            }}
          />
        </section>

        <section className="blogpostfeed">
          <h2>{posts.length === 1 ? "1 post" : `${posts.length} posts`}</h2>
          <PostList posts={posts} user={user} onEdit={handleEdit} onDelete={handleDelete} />
        </section>
      </main>

      <footer className="footer">
        <p>CS312 Mini-Project 3</p>
      </footer>
    </div>
  );
};

// Render the React app into the root div
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
