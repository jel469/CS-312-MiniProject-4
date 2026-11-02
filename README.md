# CS312 Mini-Project 3
A blog app built with Node.js, Express, PostgreSQL-ready logic, and a React frontend connected to the backend API.

## What changed for the React integration

This version replaces the earlier EJS-only page flow with a React frontend that talks to the same backend logic. The main goal was to keep the original authentication and blog operations while exposing them as JSON APIs for client-side rendering.

### Rubric mapping

- Step 3: Integrate React.js with the Backend
  - Added Express JSON API routes in `index.js` such as `/api/health`, `/api/auth/signin`, `/api/auth/signup`, and `/api/posts`.
  - The frontend fetches these endpoints using `fetch` and logs the returned data to the console.

- Step 4: Signup and Sign in
  - Created `SignInForm.js` and `SignUpForm.js` as React components.
  - These components keep the same structure as the earlier EJS forms but send data to the backend for authentication.
  - Backend checks for existing users and validates credentials before returning success or error messages.

- Step 5: Post Creation
  - Converted the creation form into `BlogPostForm.js`.
  - It uses controlled React state for `title` and `body`, and submits the data to the backend.

- Step 6: Post Viewing
  - Created `PostList.js` to render the blog posts dynamically.
  - The home page fetches all posts from `/api/posts` and displays them using `.map()`.
  - Each post includes edit and delete actions when the user is the owner.

- Step 7: Post Editing
  - `BlogPostForm.js` supports an edit mode with prefilled values from the selected post.
  - The backend verifies ownership before allowing an update.
  - The list refreshes after a successful update.

- Step 8: Post Deletion
  - The delete button in `PostList.js` calls the backend delete route.
  - The backend checks that the current user owns the post before removing it.
  - Deleted posts are removed from the homepage immediately after a successful API response.

## How to run

```bash
npm install
npm start
```

Then open http://localhost:3000

## Notes

- The app is designed to work with PostgreSQL when available.
- If the database is not running, the app falls back to local in-memory data while still supporting the same API flow.
- The frontend is served from `public/index.html` and uses React via CDN for a lightweight setup.
