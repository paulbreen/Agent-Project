using Microsoft.AspNetCore.Mvc;
using ReadWise.Core.Entities;
using ReadWise.Core.Interfaces;

namespace ReadWise.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArticlesController : ControllerBase
{
    private readonly IArticleRepository _repository;

    public ArticlesController(IArticleRepository repository)
    {
        _repository = repository;
    }

    // TODO: Replace with actual authenticated user ID once auth is implemented
    private static string CurrentUserId => "anonymous";

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Article>>> GetAll()
    {
        var articles = await _repository.GetAllByUserAsync(CurrentUserId);
        return Ok(articles);
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
        var article = new Article
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
            Url = request.Url,
            Title = request.Title ?? request.Url,
            SavedAt = DateTime.UtcNow
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

        article.IsArchived = true;
        article.ArchivedAt = DateTime.UtcNow;
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
