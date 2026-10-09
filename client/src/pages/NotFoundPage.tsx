import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-gray-600">The page you requested does not exist.</p>
      <Link className="text-blue-600 underline" to="/">
        Return home
      </Link>
    </main>
  );
}
