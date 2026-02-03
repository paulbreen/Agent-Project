import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Article } from '../types/article';
import { articlesApi } from '../services/api';
import { useReaderPreferences } from '../hooks/useReaderPreferences';
import { useReadingProgress } from '../hooks/useReadingProgress';

const themeStyles = {
  light: { background: '#ffffff', color: '#1a1a1a', metaColor: '#666', controlBg: '#f5f5f5' },
  dark: { background: '#1a1a1a', color: '#e0e0e0', metaColor: '#999', controlBg: '#2a2a2a' },
};

const themeLabels: Record<string, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export function ReaderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { fontSize, theme, resolvedTheme, increaseFontSize, decreaseFontSize, cycleTheme, canIncrease, canDecrease } =
    useReaderPreferences();
  const progress = useReadingProgress();

  const colors = themeStyles[resolvedTheme];

  useEffect(() => {
    if (!id) return;
    articlesApi
      .getById(id)
      .then((a) => {
        setArticle(a);
        articlesApi.markAsRead(id);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!article || !id) return;
    await articlesApi.toggleFavorite(id);
    setArticle({ ...article, isFavorite: !article.isFavorite });
  };

  const handleArchive = async () => {
    if (!id) return;
    await articlesApi.archive(id);
    navigate('/');
  };

  const handleDelete = async () => {
    if (!id) return;
    await articlesApi.delete(id);
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ ...colors, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{ ...colors, minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
        <p>Article not found.</p>
        <Link to="/">Back to articles</Link>
      </div>
    );
  }

  return (
    <div style={{ background: colors.background, color: colors.color, minHeight: '100vh' }}>
      {/* Progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: 3,
          width: `${progress}%`,
          background: '#4a9eff',
          transition: 'width 100ms ease-out',
          zIndex: 1000,
        }}
      />

      {/* Controls bar */}
      <div
        style={{
          position: 'fixed',
          top: 3,
          left: 0,
          right: 0,
          background: colors.controlBg,
          borderBottom: `1px solid ${resolvedTheme === 'dark' ? '#333' : '#ddd'}`,
          padding: '0.5rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 999,
          fontSize: '0.85rem',
        }}
      >
        <Link to="/" style={{ color: colors.color, textDecoration: 'none' }}>
          &larr; Back
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={decreaseFontSize} disabled={!canDecrease} title="Decrease font size">
            A-
          </button>
          <span>{fontSize}px</span>
          <button onClick={increaseFontSize} disabled={!canIncrease} title="Increase font size">
            A+
          </button>
          <button onClick={cycleTheme} title="Toggle theme">
            {themeLabels[theme]}
          </button>
          <span style={{ borderLeft: `1px solid ${resolvedTheme === 'dark' ? '#555' : '#ccc'}`, height: '1.2em' }} />
          <button
            onClick={handleToggleFavorite}
            title={article.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.1rem',
              padding: '0.1rem 0.25rem',
              color: article.isFavorite ? '#f5a623' : colors.metaColor,
            }}
          >
            {article.isFavorite ? '\u2605' : '\u2606'}
          </button>
          <button
            onClick={handleArchive}
            title={article.isArchived ? 'Unarchive' : 'Archive'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: '0.1rem 0.25rem',
              color: colors.metaColor,
            }}
          >
            {article.isArchived ? 'Unarchive' : 'Archive'}
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete article"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: '0.1rem 0.25rem',
              color: '#d32f2f',
            }}
          >
            Delete
          </button>
        </div>
        <span style={{ color: colors.metaColor }}>{progress}%</span>
      </div>

      {/* Article content */}
      <article
        style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: '4rem 1.5rem 3rem',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: `${fontSize}px`,
          lineHeight: 1.8,
        }}
      >
        <header style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: `${fontSize * 1.6}px`,
              lineHeight: 1.3,
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            {article.isFavorite && (
              <span style={{ color: '#f5a623', marginRight: '0.4rem' }}>&#9733;</span>
            )}
            {article.title}
          </h1>
          <div style={{ color: colors.metaColor, fontSize: `${fontSize * 0.8}px` }}>
            {article.author && <span>By {article.author}</span>}
            {article.author && article.domain && <span> &middot; </span>}
            {article.domain && <span>{article.domain}</span>}
            {article.estimatedReadingTimeMinutes > 0 && (
              <span> &middot; {article.estimatedReadingTimeMinutes} min read</span>
            )}
          </div>
        </header>

        {article.content && article.isContentParsed ? (
          <div
            className="reader-content"
            dangerouslySetInnerHTML={{ __html: article.content }}
            style={{ wordBreak: 'break-word' }}
          />
        ) : (
          <div>
            <p>This article's content could not be parsed for reader mode.</p>
            <p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#4a9eff' }}
              >
                Read on the original site &rarr;
              </a>
            </p>
          </div>
        )}
      </article>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1001,
          }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            style={{
              background: resolvedTheme === 'dark' ? '#2a2a2a' : '#fff',
              color: colors.color,
              padding: '1.5rem',
              borderRadius: 8,
              maxWidth: 360,
              width: '90%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 0.75rem' }}>Delete article?</h3>
            <p style={{ margin: '0 0 1.25rem', color: colors.metaColor }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button
                onClick={handleDelete}
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
