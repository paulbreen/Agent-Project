using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReadWise.Api.Models;
using ReadWise.Api.Services;
using ReadWise.Core.Entities;
using ReadWise.Infrastructure.Data;

namespace ReadWise.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly TokenService _tokenService;
    private readonly ReadWiseDbContext _context;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        TokenService tokenService,
        ReadWiseDbContext context)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _context = context;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Registration failed",
                Detail = "An account with this email already exists.",
                Status = StatusCodes.Status409Conflict,
            });
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Registration failed",
                Detail = string.Join("; ", result.Errors.Select(e => e.Description)),
                Status = StatusCodes.Status400BadRequest,
            });
        }

        return Ok(await GenerateAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized(new ProblemDetails
            {
                Title = "Login failed",
                Detail = "Invalid email or password.",
                Status = StatusCodes.Status401Unauthorized,
            });
        }

        return Ok(await GenerateAuthResponse(user));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest request)
    {
        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

        if (storedToken is null || storedToken.IsRevoked || storedToken.ExpiresAt < DateTime.UtcNow)
        {
            return Unauthorized(new ProblemDetails
            {
                Title = "Refresh failed",
                Detail = "Invalid or expired refresh token.",
                Status = StatusCodes.Status401Unauthorized,
            });
        }

        // Revoke the used refresh token (rotation)
        storedToken.IsRevoked = true;
        await _context.SaveChangesAsync();

        return Ok(await GenerateAuthResponse(storedToken.User));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest request)
    {
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

        if (storedToken is not null)
        {
            storedToken.IsRevoked = true;
            await _context.SaveChangesAsync();
        }

        return NoContent();
    }

    private async Task<AuthResponse> GenerateAuthResponse(ApplicationUser user)
    {
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken(user.Id);

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        return new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: refreshToken.Token,
            ExpiresAt: DateTime.UtcNow.AddMinutes(15),
            User: new UserInfo(user.Id, user.Email!)
        );
    }
}
