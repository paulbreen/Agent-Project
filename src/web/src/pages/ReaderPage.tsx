import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Article } from '../types/article';
import { articlesApi } from '../services/api';

export function ReaderPage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading...</p>;
  if (!article) return <p>Article not found.</p>;

  return (
    <article>
      <Link to="/">Back</Link>
      <h1>{article.title}</h1>
      {article.author && <p>By {article.author}</p>}
      {article.content ? (
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      ) : (
        <p>
          Content not yet parsed.{' '}
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            Read on original site
          </a>
        </p>
      )}
    </article>
  );
}
