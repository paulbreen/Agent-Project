using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReadWise.Core.Interfaces;

namespace ReadWise.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class TagsController : ControllerBase
{
    private readonly ITagRepository _tagRepository;
    private readonly IArticleRepository _articleRepository;

    public TagsController(ITagRepository tagRepository, IArticleRepository articleRepository)
    {
        _tagRepository = tagRepository;
        _articleRepository = articleRepository;
    }

    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
        ?? throw new UnauthorizedAccessException();

    /// <summary>Get all tags for the current user.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TagDto>>> GetAll()
    {
        var tags = await _tagRepository.GetAllByUserAsync(CurrentUserId);
        return Ok(tags.Select(t => new TagDto(t.Id, t.Name)));
    }

    /// <summary>Delete a tag (removes from all articles).</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _tagRepository.DeleteAsync(id, CurrentUserId);
        return NoContent();
    }

    /// <summary>Set the tags for an article (replaces all existing tags).</summary>
    [HttpPut("/api/articles/{articleId:guid}/tags")]
    public async Task<ActionResult<IReadOnlyList<TagDto>>> SetArticleTags(
        Guid articleId,
        [FromBody] SetArticleTagsRequest request)
    {
        var article = await _articleRepository.GetByIdAsync(articleId, CurrentUserId);
        if (article is null) return NotFound();

        await _tagRepository.SetArticleTagsAsync(articleId, CurrentUserId, request.Tags);

        var tags = await _tagRepository.GetArticleTagsAsync(articleId);
        return Ok(tags.Select(t => new TagDto(t.Id, t.Name)));
    }

    /// <summary>Get tags for a specific article.</summary>
    [HttpGet("/api/articles/{articleId:guid}/tags")]
    public async Task<ActionResult<IReadOnlyList<TagDto>>> GetArticleTags(Guid articleId)
    {
        var article = await _articleRepository.GetByIdAsync(articleId, CurrentUserId);
        if (article is null) return NotFound();

        var tags = await _tagRepository.GetArticleTagsAsync(articleId);
        return Ok(tags.Select(t => new TagDto(t.Id, t.Name)));
    }
}

public record TagDto(Guid Id, string Name);
public record SetArticleTagsRequest(IReadOnlyList<string> Tags);
