import { useEffect, useState } from 'react';
import type { Article } from '../types/article';
import { articlesApi } from '../services/api';

export function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    articlesApi.getAll().then(setArticles).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const article = await articlesApi.create({ url: url.trim() });
    setArticles((prev) => [article, ...prev]);
    setUrl('');
  };

  return (
    <div>
      <h1>ReadWise</h1>
      <form onSubmit={handleSave}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a URL to save..."
          required
        />
        <button type="submit">Save</button>
      </form>
      {loading ? (
        <p>Loading...</p>
      ) : articles.length === 0 ? (
        <p>No saved articles yet. Paste a URL above to get started.</p>
      ) : (
        <ul>
          {articles.map((article) => (
            <li key={article.id}>
              <a href={`/read/${article.id}`}>{article.title}</a>
              <span>{article.domain}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
