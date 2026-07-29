import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="empty-state">
      <h1>Page not found.</h1>
      <Link className="primary" to="/learn">Back to learning</Link>
    </div>
  );
}
