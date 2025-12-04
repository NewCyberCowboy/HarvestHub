// Controllers/AddressesController.cs
using HarvestHub.Common;
using HarvestHub.DTOs;
using HarvestHub.Exceptions;
using HarvestHub.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HarvestHub.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AddressesController : ControllerBase
    {
        private readonly IAddressService _addressService;
        private readonly ILogger<AddressesController> _logger;

        public AddressesController(IAddressService addressService, ILogger<AddressesController> logger)
        {
            _addressService = addressService;
            _logger = logger;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                throw new UnauthorizedAccessException("Invalid user ID");
            return userId;
        }

        // GET: api/addresses
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<AddressDto>>>> GetUserAddresses()
        {
            try
            {
                var userId = GetUserId();
                var addresses = await _addressService.GetUserAddressesAsync(userId);

                return Ok(new ApiResponse<IEnumerable<AddressDto>>
                {
                    Data = addresses,
                    Success = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user addresses");
                return StatusCode(500, new ApiResponse<IEnumerable<AddressDto>>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        // GET: api/addresses/default
        [HttpGet("default")]
        public async Task<ActionResult<ApiResponse<AddressDto>>> GetDefaultAddress()
        {
            try
            {
                var userId = GetUserId();
                var address = await _addressService.GetDefaultAddressAsync(userId);

                if (address == null)
                    return NotFound(new ApiResponse<AddressDto>
                    {
                        Success = false,
                        Message = "No default address found"
                    });

                return Ok(new ApiResponse<AddressDto>
                {
                    Data = address,
                    Success = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting default address");
                return StatusCode(500, new ApiResponse<AddressDto>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        // POST: api/addresses
        [HttpPost]
        public async Task<ActionResult<ApiResponse<AddressDto>>> CreateAddress(CreateAddressDto createDto)
        {
            try
            {
                var userId = GetUserId();
                var address = await _addressService.CreateAddressAsync(createDto, userId);

                return CreatedAtAction(nameof(GetUserAddresses), new ApiResponse<AddressDto>
                {
                    Data = address,
                    Success = true,
                    Message = "Address created successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating address");
                return BadRequest(new ApiResponse<AddressDto>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        // PUT: api/addresses/5
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<AddressDto>>> UpdateAddress(int id, UpdateAddressDto updateDto)
        {
            try
            {
                var userId = GetUserId();
                var address = await _addressService.UpdateAddressAsync(id, updateDto, userId);

                return Ok(new ApiResponse<AddressDto>
                {
                    Data = address,
                    Success = true,
                    Message = "Address updated successfully"
                });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new ApiResponse<AddressDto>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<AddressDto>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating address");
                return StatusCode(500, new ApiResponse<AddressDto>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        // PATCH: api/addresses/5/set-default
        [HttpPatch("{id}/set-default")]
        public async Task<ActionResult<ApiResponse<object>>> SetDefaultAddress(int id)
        {
            try
            {
                var userId = GetUserId();
                await _addressService.SetDefaultAddressAsync(id, userId);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Address set as default successfully"
                });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting default address");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        // DELETE: api/addresses/5
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteAddress(int id)
        {
            try
            {
                var userId = GetUserId();
                await _addressService.DeleteAddressAsync(id, userId);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Address deleted successfully"
                });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting address");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }
    }
}