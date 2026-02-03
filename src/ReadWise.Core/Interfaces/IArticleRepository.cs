using ReadWise.Core.Entities;

namespace ReadWise.Core.Interfaces;

public interface IArticleRepository
{
    Task<Article?> GetByIdAsync(Guid id, string userId);
    Task<IReadOnlyList<Article>> GetAllByUserAsync(string userId);
    Task<Article> AddAsync(Article article);
    Task UpdateAsync(Article article);
    Task DeleteAsync(Guid id, string userId);
}
