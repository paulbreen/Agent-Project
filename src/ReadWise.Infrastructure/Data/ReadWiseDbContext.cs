using Microsoft.EntityFrameworkCore;
using ReadWise.Core.Entities;

namespace ReadWise.Infrastructure.Data;

public class ReadWiseDbContext : DbContext
{
    public ReadWiseDbContext(DbContextOptions<ReadWiseDbContext> options) : base(options) { }

    public DbSet<Article> Articles => Set<Article>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Article>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.IsArchived, e.SavedAt });
            entity.Property(e => e.Url).HasMaxLength(2048);
            entity.Property(e => e.Title).HasMaxLength(500);
            entity.Property(e => e.Domain).HasMaxLength(255);
        });
    }
}
