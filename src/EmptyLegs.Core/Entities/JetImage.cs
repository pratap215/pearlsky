namespace EmptyLegs.Core.Entities;

public class JetImage
{
    public int Id { get; set; }
    public int JetId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsInterior { get; set; }
    public int DisplayOrder { get; set; }
    public string Caption { get; set; } = string.Empty;

    public Jet Jet { get; set; } = null!;
}
