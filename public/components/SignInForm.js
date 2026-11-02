// Sign-in form for the React frontend.
// It collects the user credentials and sends them to the backend, uses authentication
const SignInForm = ({ onSubmit, onSwitch, message }) => {
  const [form, setForm] = React.useState({ user_id: "", password: "" });

  // Keep the input values in state so the form is controlled.
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
        <label htmlFor="signin-user-id">User ID</label>
        <input id="signin-user-id"
          type="text"
          name="user_id"
          value={form.user_id}
          onChange={handleChange}
          required
          placeholder="Jane_Doe"
        />
      </div>

      <div className="rowform">
        <label htmlFor="signin-password">Password</label>
        <input id="signin-password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          placeholder="Enter your password"
        />
      </div>

      <button type="submit" className="primarybutton">
        Sign In
      </button>

      <p className="accountlink">
        Need an account?
        <button type="button" onClick={onSwitch}>Create one</button>
      </p>
    </form>
  );
};

window.SignInForm = SignInForm;
