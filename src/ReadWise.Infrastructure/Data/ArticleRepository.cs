using Microsoft.EntityFrameworkCore;
using ReadWise.Core.Entities;
using ReadWise.Core.Interfaces;

namespace ReadWise.Infrastructure.Data;

public class ArticleRepository : IArticleRepository
{
    private readonly ReadWiseDbContext _context;

    public ArticleRepository(ReadWiseDbContext context)
    {
        _context = context;
    }

    public async Task<Article?> GetByIdAsync(Guid id, string userId)
    {
        return await _context.Articles
            .Include(a => a.ArticleTags)
                .ThenInclude(at => at.Tag)
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
    }

    public async Task<Article?> GetByUrlAsync(string url, string userId)
    {
        return await _context.Articles
            .FirstOrDefaultAsync(a => a.Url == url && a.UserId == userId);
    }

    public async Task<IReadOnlyList<Article>> GetAllByUserAsync(string userId)
    {
        return await _context.Articles
            .Where(a => a.UserId == userId && !a.IsArchived)
            .OrderByDescending(a => a.SavedAt)
            .ToListAsync();
    }

    public async Task<PagedResult<Article>> GetPagedAsync(ArticleQuery q)
    {
        var query = _context.Articles
            .Include(a => a.ArticleTags)
                .ThenInclude(at => at.Tag)
            .Where(a => a.UserId == q.UserId);

        // Status filter
        query = q.Status switch
        {
            ArticleStatus.Archived => query.Where(a => a.IsArchived),
            ArticleStatus.Favorites => query.Where(a => a.IsFavorite && !a.IsArchived),
            ArticleStatus.Unread => query.Where(a => !a.IsRead && !a.IsArchived),
            _ => query.Where(a => !a.IsArchived),
        };

        // Search filter (title and excerpt)
        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var search = q.Search.Trim();
            query = query.Where(a =>
                a.Title.Contains(search) ||
                (a.Excerpt != null && a.Excerpt.Contains(search)));
        }

        // Tag filter (OR logic — articles matching ANY of the specified tags)
        if (q.Tags is { Count: > 0 })
        {
            var tagNames = q.Tags.Select(t => t.ToLowerInvariant()).ToList();
            query = query.Where(a =>
                a.ArticleTags.Any(at => tagNames.Contains(at.Tag.Name)));
        }

        var ordered = query.OrderByDescending(a => a.SavedAt);
        var totalCount = await ordered.CountAsync();
        var items = await ordered
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .ToListAsync();

        return new PagedResult<Article>(items, totalCount, q.Page, q.PageSize);
    }

    public async Task<Article> AddAsync(Article article)
    {
        _context.Articles.Add(article);
        await _context.SaveChangesAsync();
        return article;
    }

    public async Task UpdateAsync(Article article)
    {
        _context.Articles.Update(article);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id, string userId)
    {
        var article = await GetByIdAsync(id, userId);
        if (article is not null)
        {
            _context.Articles.Remove(article);
            await _context.SaveChangesAsync();
        }
    }
}
