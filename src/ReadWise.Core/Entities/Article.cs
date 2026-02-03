namespace ReadWise.Core.Entities;

public class Article
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Author { get; set; }
    public string? Content { get; set; }
    public string? Excerpt { get; set; }
    public string? ImageUrl { get; set; }
    public string? Domain { get; set; }
    public int WordCount { get; set; }
    public int EstimatedReadingTimeMinutes { get; set; }
    public bool IsContentParsed { get; set; }
    public bool IsRead { get; set; }
    public bool IsArchived { get; set; }
    public bool IsFavorite { get; set; }
    public DateTime SavedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
    public DateTime? ArchivedAt { get; set; }

    public ICollection<ArticleTag> ArticleTags { get; set; } = [];
}
