using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ReadWise.Core.Entities;

namespace ReadWise.Infrastructure.Data;

public class ReadWiseDbContext : IdentityDbContext<ApplicationUser>
{
    public ReadWiseDbContext(DbContextOptions<ReadWiseDbContext> options) : base(options) { }

    public DbSet<Article> Articles => Set<Article>();
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

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.Property(e => e.Token).HasMaxLength(256);
        });
    }
}
