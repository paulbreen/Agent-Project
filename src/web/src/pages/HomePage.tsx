import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Article } from '../types/article';
import { articlesApi } from '../services/api';
import { useAuth } from '../hooks/useAuthHook';

type StatusTab = 'default' | 'archived' | 'favorites';

const tabs: { key: StatusTab; label: string }[] = [
  { key: 'default', label: 'Reading List' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'archived', label: 'Archived' },
];

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
  const [activeTab, setActiveTab] = useState<StatusTab>('default');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const pageSize = 20;

  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchArticles = useCallback(
    (p: number, tab: StatusTab) => {
      setLoading(true);
      const status = tab === 'default' ? undefined : tab;
      articlesApi
        .getAll(p, pageSize, status)
        .then((result) => {
          setArticles(result.items);
          setTotalCount(result.totalCount);
        })
        .finally(() => setLoading(false));
    },
    [],
  );

  useEffect(() => {
    fetchArticles(page, activeTab);
  }, [page, activeTab, fetchArticles]);

  const handleTabChange = (tab: StatusTab) => {
    setActiveTab(tab);
    setPage(1);
    setMenuOpenId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError('');
    setSaving(true);
    try {
      await articlesApi.create({ url: url.trim() });
      setUrl('');
      setActiveTab('default');
      setPage(1);
      fetchArticles(1, 'default');
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

  const handleToggleFavorite = async (e: React.MouseEvent, article: Article) => {
    e.preventDefault();
    e.stopPropagation();
    await articlesApi.toggleFavorite(article.id);
    setArticles((prev) =>
      prev.map((a) => (a.id === article.id ? { ...a, isFavorite: !a.isFavorite } : a)),
    );
  };

  const handleArchive = async (e: React.MouseEvent, article: Article) => {
    e.preventDefault();
    e.stopPropagation();
    await articlesApi.archive(article.id);
    setMenuOpenId(null);
    // Remove from current view since archive status changes
    setArticles((prev) => prev.filter((a) => a.id !== article.id));
    setTotalCount((c) => c - 1);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDeleteId(id);
    setMenuOpenId(null);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    await articlesApi.delete(confirmDeleteId);
    setArticles((prev) => prev.filter((a) => a.id !== confirmDeleteId));
    setTotalCount((c) => c - 1);
    setConfirmDeleteId(null);
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
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h1 style={{ margin: 0 }}>ReadWise</h1>
        <div>
          <span style={{ marginRight: '1rem', color: '#666' }}>{user?.email}</span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <form onSubmit={handleSave} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
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

      {/* Status tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          borderBottom: '2px solid #eee',
          marginBottom: '1rem',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 600 : 400,
              borderBottom: activeTab === tab.key ? '2px solid #4a9eff' : '2px solid transparent',
              marginBottom: '-2px',
              color: activeTab === tab.key ? '#4a9eff' : '#666',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : articles.length === 0 ? (
        <p style={{ color: '#888' }}>
          {activeTab === 'default' && 'No saved articles yet. Paste a URL above to get started.'}
          {activeTab === 'archived' && 'No archived articles.'}
          {activeTab === 'favorites' && 'No favorite articles yet.'}
        </p>
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
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Link
                    to={`/read/${article.id}`}
                    style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {article.isFavorite && (
                        <span style={{ color: '#f5a623', marginRight: '0.4rem' }}>&#9733;</span>
                      )}
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
                      <div
                        style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem' }}
                      >
                        {article.excerpt.slice(0, 150)}
                        {article.excerpt.length > 150 && '...'}
                      </div>
                    )}
                  </Link>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      onClick={(e) => handleToggleFavorite(e, article)}
                      title={article.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        padding: '0.25rem',
                        color: article.isFavorite ? '#f5a623' : '#ccc',
                      }}
                    >
                      {article.isFavorite ? '\u2605' : '\u2606'}
                    </button>

                    {/* Overflow menu */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === article.id ? null : article.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          padding: '0.25rem',
                          color: '#999',
                        }}
                        title="More actions"
                      >
                        &#8943;
                      </button>

                      {menuOpenId === article.id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                            zIndex: 10,
                            minWidth: 140,
                          }}
                        >
                          <button
                            onClick={(e) => handleArchive(e, article)}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '0.9rem',
                            }}
                          >
                            {article.isArchived ? 'Unarchive' : 'Archive'}
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, article.id)}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '0.9rem',
                              color: '#d32f2f',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '1.5rem',
              }}
            >
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

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
          }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: 8,
              maxWidth: 360,
              width: '90%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 0.75rem' }}>Delete article?</h3>
            <p style={{ margin: '0 0 1.25rem', color: '#666' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button
                onClick={confirmDelete}
                style={{
                  background: '#d32f2f',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
