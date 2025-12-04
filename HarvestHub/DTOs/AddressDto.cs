// DTOs/AddressDto.cs
using System.ComponentModel.DataAnnotations;

namespace HarvestHub.DTOs
{
    public class AddressDto
    {
        public int AddressId { get; set; }
        public int UserId { get; set; }
        public string Street { get; set; } = string.Empty;
        public string Apartment { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string Country { get; set; } = "Россия";
        public bool IsDefault { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateAddressDto
    {
        [Required]
        public string Street { get; set; } = string.Empty;

        public string Apartment { get; set; } = string.Empty;

        [Required]
        public string City { get; set; } = string.Empty;

        [Required]
        public string PostalCode { get; set; } = string.Empty;

        public string Country { get; set; } = "Россия";

        public bool IsDefault { get; set; } = false;
    }

    public class UpdateAddressDto
    {
        public string? Street { get; set; }
        public string? Apartment { get; set; }
        public string? City { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        public bool? IsDefault { get; set; }
    }

}