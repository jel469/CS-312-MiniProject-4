// Sign-up form for the React frontend.
// It captures account details and submits them to the backend
const SignUpForm = ({ onSubmit, onSwitch, message }) => {
  const [form, setForm] = React.useState({ user_id: "", password: "", name: "" });

  // Store each field as the user types
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
        <label htmlFor="signup-user-id">User ID</label>
        <input id="signup-user-id"
          type="text"
          name="user_id"
          value={form.user_id}
          onChange={handleChange}
          required
          placeholder="Jane_Doe"
        />
      </div>

      <div className="rowform">
        <label htmlFor="signup-password">Password</label>
        <input id="signup-password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          placeholder="Enter a password"
        />
      </div>

      <div className="rowform">
        <label htmlFor="signup-name">Full Name</label>
        <input id="signup-name"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Jane Doe"
        />
      </div>

      <button type="submit" className="primarybutton">
        Sign Up
      </button>

      <p className="accountlink">
        Already have an account?
        <button type="button" onClick={onSwitch}>Sign in</button>
      </p>
    </form>
  );
};

window.SignUpForm = SignUpForm;
