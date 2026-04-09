/**
 * Sidebar component
 */
export default function Sidebar() {
  return (
    <aside className="sidebar">
      <ul className="sidebar-menu">
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/interviews">Interviews</a></li>
        <li><a href="/tests">Tests</a></li>
        <li><a href="/feedback">Feedback</a></li>
        <li><a href="/settings">Settings</a></li>
      </ul>
    </aside>
  );
}
