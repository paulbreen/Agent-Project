using Microsoft.AspNetCore.Identity;

namespace ReadWise.Core.Entities;

public class ApplicationUser : IdentityUser
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Article> Articles { get; set; } = [];
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
