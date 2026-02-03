using ReadWise.Core.Entities;

namespace ReadWise.Core.Interfaces;

public interface ITagRepository
{
    Task<IReadOnlyList<Tag>> GetAllByUserAsync(string userId);
    Task<Tag?> GetByIdAsync(Guid id, string userId);
    Task<Tag?> GetByNameAsync(string name, string userId);
    Task<Tag> CreateAsync(Tag tag);
    Task DeleteAsync(Guid id, string userId);
    Task SetArticleTagsAsync(Guid articleId, string userId, IReadOnlyList<string> tagNames);
    Task<IReadOnlyList<Tag>> GetArticleTagsAsync(Guid articleId);
}
