import { cleanup, render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom';
import { getSession } from '../utils/auth';
import ProtectedRoute from './ProtectedRoute';

vi.mock('../utils/auth', () => ({
  getSession: vi.fn(),
}));

const USER_SESSION = {
  userId: 'user-1',
  username: 'writer',
  displayName: 'Local Writer',
  role: 'user',
};

const ADMIN_SESSION = {
  userId: 'admin-fixed-id',
  username: 'admin',
  displayName: 'Admin',
  role: 'admin',
};

function renderProtectedRoute(role = null) {
  return render(
    <MemoryRouter initialEntries={['/restricted']}>
      <Routes>
        <Route path="/login" element={<h1>Login page</h1>} />
        <Route path="/blogs" element={<h1>Blogs page</h1>} />
        <Route
          path="/restricted"
          element={
            <ProtectedRoute role={role}>
              <h1>Restricted page</h1>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('redirects a guest to the login page', () => {
    getSession.mockReturnValue(null);

    renderProtectedRoute();

    expect(
      screen.getByRole('heading', { name: 'Login page' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Restricted page' }),
    ).not.toBeInTheDocument();
  });

  it('renders an authenticated route for a standard user', () => {
    getSession.mockReturnValue(USER_SESSION);

    renderProtectedRoute();

    expect(
      screen.getByRole('heading', { name: 'Restricted page' }),
    ).toBeInTheDocument();
  });

  it('redirects a standard user away from an admin-only route', () => {
    getSession.mockReturnValue(USER_SESSION);

    renderProtectedRoute('admin');

    expect(
      screen.getByRole('heading', { name: 'Blogs page' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Restricted page' }),
    ).not.toBeInTheDocument();
  });

  it('renders an admin-only route for an admin user', () => {
    getSession.mockReturnValue(ADMIN_SESSION);

    renderProtectedRoute('admin');

    expect(
      screen.getByRole('heading', { name: 'Restricted page' }),
    ).toBeInTheDocument();
  });
});