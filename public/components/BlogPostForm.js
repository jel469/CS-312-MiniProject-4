// controlled blog creation and edit form.
// this component keeps the form values in React state
const BlogPostForm = ({ isEditing, initialValues, onSubmit, onCancel, message }) => {
  const defaultValues = { title: "", body: "" };

  // Store the form state so the inputs stay in sync with user typing
  const [form, setForm] = React.useState(initialValues || defaultValues);

  // When editing a post fill the form with selected blog values
  React.useEffect(() => {
    setForm(initialValues || defaultValues);
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };


  return (
    <form onSubmit={handleSubmit} className="blogpostform">
      {message && <p className={`alert ${message.type}`}>{message.text}</p>}

      <div className="rowform">
        <label htmlFor="post-title">Title</label>
        <input id="post-title"
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          placeholder="My thoughts on"
        />
      </div>

      <div className="rowform">
        <label htmlFor="post-body">Post</label>
        <textarea id="post-body"
          name="body"
          rows="6"
          value={form.body}
          onChange={handleChange}
          required
          placeholder="Write your blog post here"
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {isEditing ? "Update Post" : "Publish"}
        </button>

        {isEditing && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

window.BlogPostForm = BlogPostForm;
