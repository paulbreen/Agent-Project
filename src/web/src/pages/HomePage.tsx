import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Article } from '../types/article';
import { articlesApi } from '../services/api';
import { useAuth } from '../hooks/useAuthHook';

export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    setLoading(true);
    articlesApi
      .getAll(page, pageSize)
      .then((result) => {
        setArticles(result.items);
        setTotalCount(result.totalCount);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError('');
    setSaving(true);
    try {
      await articlesApi.create({ url: url.trim() });
      setUrl('');
      // Refresh the list
      const result = await articlesApi.getAll(1, pageSize);
      setArticles(result.items);
      setTotalCount(result.totalCount);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>ReadWise</h1>
        <div>
          <span style={{ marginRight: '1rem', color: '#666' }}>{user?.email}</span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <form onSubmit={handleSave} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a URL to save..."
          required
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : articles.length === 0 ? (
        <p>No saved articles yet. Paste a URL above to get started.</p>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {articles.map((article) => (
              <li
                key={article.id}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid #eee',
                  opacity: article.isRead ? 0.7 : 1,
                }}
              >
                <Link
                  to={`/read/${article.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                    {article.title}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>
                    {article.domain}
                    {article.estimatedReadingTimeMinutes > 0 && (
                      <> &middot; {article.estimatedReadingTimeMinutes} min read</>
                    )}
                    {!article.isContentParsed && <> &middot; Link only</>}
                    <> &middot; {formatDate(article.savedAt)}</>
                  </div>
                  {article.excerpt && (
                    <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {article.excerpt.slice(0, 150)}
                      {article.excerpt.length > 150 && '...'}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
