using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ReadWise.Api.Services;
using ReadWise.Core.Entities;
using ReadWise.Core.Interfaces;
using ReadWise.Infrastructure.Data;
using ReadWise.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Database - SQLite for development, SQL Server for production
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddDbContext<ReadWiseDbContext>(options =>
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=readwise.db"));
}
else
{
    builder.Services.AddDbContext<ReadWiseDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
}

// Identity
builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 8;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ReadWiseDbContext>();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
builder.Services.Configure<JwtSettings>(jwtSettings);

var secret = jwtSettings["Secret"] ?? "ReadWise-Dev-Secret-Key-Change-In-Production-Min32Chars!";
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"] ?? "ReadWise",
            ValidAudience = jwtSettings["Audience"] ?? "ReadWise",
            IssuerSigningKey = key,
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<IArticleRepository, ArticleRepository>();
builder.Services.AddHttpClient<IArticleParser, SmartReaderArticleParser>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
    client.MaxResponseContentBufferSize = 10 * 1024 * 1024; // 10MB
    client.DefaultRequestHeaders.UserAgent.ParseAdd("ReadWise/1.0");
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    // Auto-create database in development
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ReadWiseDbContext>();
    db.Database.EnsureCreated();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Make Program accessible for integration tests
public partial class Program { }
