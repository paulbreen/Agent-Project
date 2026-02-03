using Microsoft.EntityFrameworkCore;
using ReadWise.Core.Entities;
using ReadWise.Core.Interfaces;

namespace ReadWise.Infrastructure.Data;

public class TagRepository : ITagRepository
{
    private readonly ReadWiseDbContext _context;

    public TagRepository(ReadWiseDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Tag>> GetAllByUserAsync(string userId)
    {
        return await _context.Tags
            .Where(t => t.UserId == userId)
            .OrderBy(t => t.Name)
            .ToListAsync();
    }

    public async Task<Tag?> GetByIdAsync(Guid id, string userId)
    {
        return await _context.Tags
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
    }

    public async Task<Tag?> GetByNameAsync(string name, string userId)
    {
        var normalized = name.Trim().ToLowerInvariant();
        return await _context.Tags
            .FirstOrDefaultAsync(t => t.Name == normalized && t.UserId == userId);
    }

    public async Task<Tag> CreateAsync(Tag tag)
    {
        tag.Name = tag.Name.Trim().ToLowerInvariant();
        _context.Tags.Add(tag);
        await _context.SaveChangesAsync();
        return tag;
    }

    public async Task DeleteAsync(Guid id, string userId)
    {
        var tag = await GetByIdAsync(id, userId);
        if (tag is not null)
        {
            _context.Tags.Remove(tag);
            await _context.SaveChangesAsync();
        }
    }

    public async Task SetArticleTagsAsync(Guid articleId, string userId, IReadOnlyList<string> tagNames)
    {
        // Remove existing tags for this article
        var existing = await _context.ArticleTags
            .Where(at => at.ArticleId == articleId)
            .ToListAsync();
        _context.ArticleTags.RemoveRange(existing);

        // Normalize and limit tag names
        var normalized = tagNames
            .Select(n => n.Trim().ToLowerInvariant())
            .Where(n => n.Length > 0 && n.Length <= 50)
            .Distinct()
            .Take(10)
            .ToList();

        foreach (var name in normalized)
        {
            // Find or create tag
            var tag = await _context.Tags
                .FirstOrDefaultAsync(t => t.Name == name && t.UserId == userId);

            if (tag is null)
            {
                tag = new Tag
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Name = name,
                };
                _context.Tags.Add(tag);
            }

            _context.ArticleTags.Add(new ArticleTag
            {
                ArticleId = articleId,
                TagId = tag.Id,
            });
        }

        await _context.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<Tag>> GetArticleTagsAsync(Guid articleId)
    {
        return await _context.ArticleTags
            .Where(at => at.ArticleId == articleId)
            .Select(at => at.Tag)
            .OrderBy(t => t.Name)
            .ToListAsync();
    }
}
