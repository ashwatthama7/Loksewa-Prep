import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
      isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span className="font-bold text-lg text-primary-700">Master Quiz</span>
          </Link>

          {user && (
            <div className="flex items-center gap-2">
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
              {user.role === 'admin' && (
                <>
                  <NavLink to="/admin" className={linkClass}>Admin</NavLink>
                  <NavLink to="/admin/questions" className={linkClass}>Questions</NavLink>
                </>
              )}
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-gray-200">
                <span className="text-sm text-gray-600 hidden sm:inline">{user.name}</span>
                <button onClick={handleLogout} className="btn-secondary text-sm py-1.5">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
