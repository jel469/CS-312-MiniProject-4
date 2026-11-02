// Renders the blog feed by mapping over the posts returned by the backend.
// Each card shows the title, content, date, and owner-only actions.
const PostList = ({ posts, user, onEdit, onDelete }) => {
  if (!posts.length) {
    return <p className="emptyspace">No posts yet.</p>;
  }
  return (
    <ul className="postlist">
      {posts.map((post) => {
        const isOwner = user && post.creator_user_id === user.user_id;

        return (
          <li key={post.id} className="post">
            <article>
              <header className="posthead">
                <h3 className="posttitle">{post.title}</h3>
                <p className="postpara">
                  <span className="postcreator">{post.author}</span>
                  <span aria-hidden="true"> · </span>
                  <time>{new Date(post.createdAt).toLocaleString()}</time>
                </p>
              </header>

              <p className="postcontent">{post.content}</p>


              {isOwner && (
                <div className="postact">
                  <button type="button" className="btn btn-ghost" onClick={() => onEdit(post)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => onDelete(post.id)}>
                    Delete
                  </button>
                </div>
              )}
            </article>
          </li>
        );
      })}
    </ul>
  );
};

window.PostList = PostList;
