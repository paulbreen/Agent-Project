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
