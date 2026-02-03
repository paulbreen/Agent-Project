using System.ComponentModel.DataAnnotations;

namespace ReadWise.Api.Models;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record RefreshRequest(
    [Required] string RefreshToken
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserInfo User
);

public record UserInfo(
    string Id,
    string Email
);
