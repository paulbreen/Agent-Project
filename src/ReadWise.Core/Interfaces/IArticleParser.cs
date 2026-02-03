namespace ReadWise.Core.Interfaces;

public record ParsedArticle(
    string Title,
    string? Author,
    string? Content,
    string? Excerpt,
    string? ImageUrl,
    int WordCount
);

public interface IArticleParser
{
    Task<ParsedArticle?> ParseAsync(string url);
}
