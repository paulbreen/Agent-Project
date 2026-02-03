using ReadWise.Core.Entities;

namespace ReadWise.Core.Interfaces;

public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

public enum ArticleStatus
{
    Default,
    Archived,
    Favorites,
    Unread,
}

public record ArticleQuery(
    string UserId,
    int Page = 1,
    int PageSize = 20,
    ArticleStatus Status = ArticleStatus.Default,
    string? Search = null,
    IReadOnlyList<string>? Tags = null
);

public interface IArticleRepository
{
    Task<Article?> GetByIdAsync(Guid id, string userId);
    Task<Article?> GetByUrlAsync(string url, string userId);
    Task<IReadOnlyList<Article>> GetAllByUserAsync(string userId);
    Task<PagedResult<Article>> GetPagedAsync(ArticleQuery query);
    Task<Article> AddAsync(Article article);
    Task UpdateAsync(Article article);
    Task DeleteAsync(Guid id, string userId);
}
