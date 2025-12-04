// Services/Implementations/AddressService.cs
using HarvestHub.DTOs;
using HarvestHub.Exceptions;
using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using HarvestHub.Services.Interfaces;

namespace HarvestHub.Services.Implementations
{
    public class AddressService : IAddressService
    {
        private readonly IAddressRepository _addressRepository;
        private readonly ILogger<AddressService> _logger;

        public AddressService(IAddressRepository addressRepository, ILogger<AddressService> logger)
        {
            _addressRepository = addressRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<AddressDto>> GetUserAddressesAsync(int userId)
        {
            var addresses = await _addressRepository.GetUserAddressesAsync(userId);
            return addresses.Select(MapToDto);
        }

        public async Task<AddressDto> GetAddressByIdAsync(int addressId, int userId)
        {
            var address = await _addressRepository.GetByIdAsync(addressId);
            if (address == null || address.UserId != userId)
                throw new NotFoundException($"Address with ID {addressId} not found");

            return MapToDto(address);
        }

        public async Task<AddressDto> CreateAddressAsync(CreateAddressDto createDto, int userId)
        {
            // Если новый адрес делаем основным, сбрасываем старый
            if (createDto.IsDefault)
            {
                var defaultAddress = await _addressRepository.GetDefaultAddressAsync(userId);
                if (defaultAddress != null)
                {
                    defaultAddress.IsDefault = false;
                    defaultAddress.UpdatedAt = DateTime.UtcNow;
                    await _addressRepository.UpdateAsync(defaultAddress);
                }
            }

            var address = new Address
            {
                UserId = userId,
                Street = createDto.Street,
                Apartment = createDto.Apartment,
                City = createDto.City,
                PostalCode = createDto.PostalCode,
                Country = createDto.Country ?? "Россия",
                IsDefault = createDto.IsDefault,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _addressRepository.AddAsync(address);
            _logger.LogInformation("Address created: {AddressId} for user {UserId}", created.AddressId, userId);

            return MapToDto(created);
        }

        public async Task<AddressDto> UpdateAddressAsync(int addressId, UpdateAddressDto updateDto, int userId)
        {
            var address = await _addressRepository.GetByIdAsync(addressId);
            if (address == null || address.UserId != userId)
                throw new NotFoundException($"Address with ID {addressId} not found");

            // Обновляем поля
            if (!string.IsNullOrEmpty(updateDto.Street))
                address.Street = updateDto.Street;

            if (!string.IsNullOrEmpty(updateDto.Apartment))
                address.Apartment = updateDto.Apartment;

            if (!string.IsNullOrEmpty(updateDto.City))
                address.City = updateDto.City;

            if (!string.IsNullOrEmpty(updateDto.PostalCode))
                address.PostalCode = updateDto.PostalCode;

            if (!string.IsNullOrEmpty(updateDto.Country))
                address.Country = updateDto.Country;

            // Обработка IsDefault
            if (updateDto.IsDefault.HasValue && updateDto.IsDefault.Value && !address.IsDefault)
            {
                await _addressRepository.SetDefaultAddressAsync(addressId, userId);
            }
            else if (updateDto.IsDefault.HasValue && !updateDto.IsDefault.Value && address.IsDefault)
            {
                // Нельзя снять флаг основного, если это единственный адрес
                var userAddresses = await _addressRepository.GetUserAddressesAsync(userId);
                if (userAddresses.Count() == 1)
                    throw new BusinessException("Cannot unset default address when it's the only address");

                address.IsDefault = false;
            }

            address.UpdatedAt = DateTime.UtcNow;
            var updated = await _addressRepository.UpdateAsync(address);
            _logger.LogInformation("Address updated: {AddressId} for user {UserId}", addressId, userId);

            return MapToDto(updated);
        }

        public async Task<bool> DeleteAddressAsync(int addressId, int userId)
        {
            var address = await _addressRepository.GetByIdAsync(addressId);
            if (address == null || address.UserId != userId)
                throw new NotFoundException($"Address with ID {addressId} not found");

            // Нельзя удалить единственный адрес
            var userAddresses = await _addressRepository.GetUserAddressesAsync(userId);
            if (userAddresses.Count() == 1)
                throw new BusinessException("Cannot delete the only address");

            // Если удаляем основной адрес, назначаем новый основной
            if (address.IsDefault)
            {
                var nextAddress = userAddresses.FirstOrDefault(a => a.AddressId != addressId);
                if (nextAddress != null)
                {
                    nextAddress.IsDefault = true;
                    nextAddress.UpdatedAt = DateTime.UtcNow;
                    await _addressRepository.UpdateAsync(nextAddress);
                }
            }

            var result = await _addressRepository.DeleteAsync(addressId);
            if (result)
                _logger.LogInformation("Address deleted: {AddressId} for user {UserId}", addressId, userId);

            return result;
        }

        public async Task<bool> SetDefaultAddressAsync(int addressId, int userId)
        {
            if (!await _addressRepository.UserHasAddressAsync(userId, addressId))
                throw new NotFoundException($"Address with ID {addressId} not found");

            var result = await _addressRepository.SetDefaultAddressAsync(addressId, userId);
            if (result)
                _logger.LogInformation("Address set as default: {AddressId} for user {UserId}", addressId, userId);

            return result;
        }

        public async Task<AddressDto?> GetDefaultAddressAsync(int userId)
        {
            var address = await _addressRepository.GetDefaultAddressAsync(userId);
            return address != null ? MapToDto(address) : null;
        }

        public async Task<bool> AddressBelongsToUserAsync(int addressId, int userId)
        {
            return await _addressRepository.UserHasAddressAsync(userId, addressId);
        }

        private AddressDto MapToDto(Address address)
        {
            return new AddressDto
            {
                AddressId = address.AddressId,
                UserId = address.UserId,
                Street = address.Street,
                Apartment = address.Apartment,
                City = address.City,
                PostalCode = address.PostalCode,
                Country = address.Country,
                IsDefault = address.IsDefault,
                CreatedAt = address.CreatedAt,
                UpdatedAt = address.UpdatedAt
            };
        }
    }
}