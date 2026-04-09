/**
 * Navbar component
 */
export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>AI Mock Interview</h1>
      </div>
      <ul className="navbar-menu">
        <li><a href="/">Home</a></li>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/profile">Profile</a></li>
        <li><a href="/logout">Logout</a></li>
      </ul>
    </nav>
  );
}
