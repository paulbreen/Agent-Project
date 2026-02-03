using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReadWise.Core.Entities;
using ReadWise.Core.Interfaces;

namespace ReadWise.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ArticlesController : ControllerBase
{
    private readonly IArticleRepository _repository;
    private readonly IArticleParser _parser;

    public ArticlesController(IArticleRepository repository, IArticleParser parser)
    {
        _repository = repository;
        _parser = parser;
    }

    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
        ?? throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<ActionResult<PagedResult<Article>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] string? tags = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var articleStatus = status?.ToLowerInvariant() switch
        {
            "archived" => ArticleStatus.Archived,
            "favorites" => ArticleStatus.Favorites,
            "unread" => ArticleStatus.Unread,
            _ => ArticleStatus.Default,
        };

        var tagList = !string.IsNullOrWhiteSpace(tags)
            ? tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
            : null;

        var query = new ArticleQuery(
            UserId: CurrentUserId,
            Page: page,
            PageSize: pageSize,
            Status: articleStatus,
            Search: search,
            Tags: tagList
        );

        var result = await _repository.GetPagedAsync(query);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Article>> GetById(Guid id)
    {
        var article = await _repository.GetByIdAsync(id, CurrentUserId);
        if (article is null) return NotFound();
        return Ok(article);
    }

    [HttpPost]
    public async Task<ActionResult<Article>> Create([FromBody] CreateArticleRequest request)
    {
        // Validate URL format
        if (!Uri.TryCreate(request.Url, UriKind.Absolute, out var uri)
            || (uri.Scheme != "http" && uri.Scheme != "https"))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid URL",
                Detail = "The URL must be a valid HTTP or HTTPS address.",
                Status = StatusCodes.Status400BadRequest,
            });
        }

        var userId = CurrentUserId;

        // Check for duplicate — update existing if found
        var existing = await _repository.GetByUrlAsync(request.Url, userId);
        if (existing is not null)
        {
            return Ok(existing);
        }

        var domain = uri.Host.Replace("www.", "");

        // Parse article content
        var parsed = await _parser.ParseAsync(request.Url);

        var article = new Article
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Url = request.Url,
            Title = parsed?.Title ?? request.Url,
            Author = parsed?.Author,
            Content = parsed?.Content,
            Excerpt = parsed?.Excerpt,
            ImageUrl = parsed?.ImageUrl,
            Domain = domain,
            WordCount = parsed?.WordCount ?? 0,
            EstimatedReadingTimeMinutes = parsed is not null
                ? Math.Max(1, (int)Math.Ceiling(parsed.WordCount / 200.0))
                : 0,
            IsContentParsed = parsed is not null,
            SavedAt = DateTime.UtcNow,
        };

        await _repository.AddAsync(article);
        return CreatedAtAction(nameof(GetById), new { id = article.Id }, article);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _repository.DeleteAsync(id, CurrentUserId);
        return NoContent();
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var article = await _repository.GetByIdAsync(id, CurrentUserId);
        if (article is null) return NotFound();

        article.IsRead = true;
        article.ReadAt = DateTime.UtcNow;
        await _repository.UpdateAsync(article);
        return NoContent();
    }

    [HttpPatch("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id)
    {
        var article = await _repository.GetByIdAsync(id, CurrentUserId);
        if (article is null) return NotFound();

        article.IsArchived = !article.IsArchived;
        article.ArchivedAt = article.IsArchived ? DateTime.UtcNow : null;
        await _repository.UpdateAsync(article);
        return NoContent();
    }

    [HttpPatch("{id:guid}/favorite")]
    public async Task<IActionResult> ToggleFavorite(Guid id)
    {
        var article = await _repository.GetByIdAsync(id, CurrentUserId);
        if (article is null) return NotFound();

        article.IsFavorite = !article.IsFavorite;
        await _repository.UpdateAsync(article);
        return NoContent();
    }
}

public record CreateArticleRequest(string Url, string? Title);
