using System.ComponentModel.DataAnnotations;
using HarvestHub.Models;
public class Profile
{
    [Key]
    public int ProfileId { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Phone { get; set; }
    public string Address { get; set; }
    public string PreferredContact { get; set; }

    public int UserId { get; set; }
    public User User { get; set; }
}