namespace ReadWise.Core.Entities;

public class Tag
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ArticleTag> ArticleTags { get; set; } = [];
}
