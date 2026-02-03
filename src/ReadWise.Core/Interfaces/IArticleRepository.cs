using ReadWise.Core.Entities;

namespace ReadWise.Core.Interfaces;

public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

public interface IArticleRepository
{
    Task<Article?> GetByIdAsync(Guid id, string userId);
    Task<Article?> GetByUrlAsync(string url, string userId);
    Task<IReadOnlyList<Article>> GetAllByUserAsync(string userId);
    Task<PagedResult<Article>> GetPagedByUserAsync(string userId, int page, int pageSize);
    Task<Article> AddAsync(Article article);
    Task UpdateAsync(Article article);
    Task DeleteAsync(Guid id, string userId);
}
