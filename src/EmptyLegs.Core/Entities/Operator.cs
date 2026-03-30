namespace EmptyLegs.Core.Entities;

public class Operator
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Jet> Jets { get; set; } = new List<Jet>();
    public ICollection<EmptyLeg> EmptyLegs { get; set; } = new List<EmptyLeg>();
    public ICollection<Policy> Policies { get; set; } = new List<Policy>();
    public ICollection<User> Users { get; set; } = new List<User>();
}
