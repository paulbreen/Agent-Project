using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ReadWise.Core.Entities;

namespace ReadWise.Infrastructure.Data;

public class ReadWiseDbContext : IdentityDbContext<ApplicationUser>
{
    public ReadWiseDbContext(DbContextOptions<ReadWiseDbContext> options) : base(options) { }

    public DbSet<Article> Articles => Set<Article>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<ArticleTag> ArticleTags => Set<ArticleTag>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Article>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.IsArchived, e.SavedAt });
            entity.Property(e => e.Url).HasMaxLength(2048);
            entity.Property(e => e.Title).HasMaxLength(500);
            entity.Property(e => e.Domain).HasMaxLength(255);

            entity.HasOne<ApplicationUser>()
                .WithMany(u => u.Articles)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.Name }).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(50);

            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ArticleTag>(entity =>
        {
            entity.HasKey(e => new { e.ArticleId, e.TagId });

            entity.HasOne(e => e.Article)
                .WithMany(a => a.ArticleTags)
                .HasForeignKey(e => e.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Tag)
                .WithMany(t => t.ArticleTags)
                .HasForeignKey(e => e.TagId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.Property(e => e.Token).HasMaxLength(256);
        });
    }
}
