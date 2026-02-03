using System.Text.RegularExpressions;
using ReadWise.Core.Interfaces;
using SmartReader;

namespace ReadWise.Infrastructure.Services;

public partial class SmartReaderArticleParser : IArticleParser
{
    private readonly HttpClient _httpClient;

    public SmartReaderArticleParser(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<ParsedArticle?> ParseAsync(string url)
    {
        try
        {
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var html = await response.Content.ReadAsStringAsync();
            var reader = new Reader(url, html);
            var article = reader.GetArticle();

            if (!article.IsReadable)
                return null;

            var plainText = StripHtmlTags(article.TextContent ?? "");
            var wordCount = CountWords(plainText);

            return new ParsedArticle(
                Title: article.Title ?? url,
                Author: article.Author,
                Content: article.Content,
                Excerpt: article.Excerpt,
                ImageUrl: article.FeaturedImage,
                WordCount: wordCount
            );
        }
        catch
        {
            return null;
        }
    }

    private static string StripHtmlTags(string html)
    {
        return HtmlTagPattern().Replace(html, " ").Trim();
    }

    private static int CountWords(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0;
        return WhitespacePattern().Split(text.Trim()).Length;
    }

    [GeneratedRegex(@"<[^>]+>")]
    private static partial Regex HtmlTagPattern();

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespacePattern();
}
