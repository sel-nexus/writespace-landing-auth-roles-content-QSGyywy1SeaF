import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { getSession } from '../utils/auth';

export default function ProtectedRoute({ children, role = null }) {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'admin' && session.role !== 'admin') {
    return <Navigate to="/blogs" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  role: PropTypes.oneOf(['admin']),
};