using HarvestHub.DTOs;
using HarvestHub.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HarvestHub.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProductDraftsController : ControllerBase
    {
        private readonly IProductDraftService _draftService;
        private readonly ILogger<ProductDraftsController> _logger;

        public ProductDraftsController(IProductDraftService draftService, ILogger<ProductDraftsController> logger)
        {
            _draftService = draftService;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Невалидный токен пользователя");
            }
            return userId;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDraftDto>>> GetMyDrafts()
        {
            try
            {
                var userId = GetCurrentUserId();
                var drafts = await _draftService.GetByOwnerAsync(userId);
                return Ok(drafts);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product drafts");
                return StatusCode(500, new { message = "Ошибка при получении черновиков" });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ProductDraftDto>> GetDraft(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var draft = await _draftService.GetByIdAsync(id);
                
                if (draft == null)
                    return NotFound(new { message = "Черновик не найден" });
                
                if (draft.OwnerUserId != userId)
                    return Forbid();
                
                return Ok(draft);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product draft {DraftId}", id);
                return StatusCode(500, new { message = "Ошибка при получении черновика" });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ProductDraftDto>> CreateDraft([FromBody] CreateProductDraftDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var created = await _draftService.CreateAsync(userId, dto);
                return CreatedAtAction(nameof(GetDraft), new { id = created.DraftId }, created);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product draft");
                return StatusCode(500, new { message = "Ошибка при создании черновика" });
            }
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ProductDraftDto>> UpdateDraft(int id, [FromBody] UpdateProductDraftDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var existing = await _draftService.GetByIdAsync(id);
                
                if (existing == null)
                    return NotFound(new { message = "Черновик не найден" });
                
                if (existing.OwnerUserId != userId)
                    return Forbid();
                
                var updated = await _draftService.UpdateAsync(id, dto);
                return Ok(updated);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product draft {DraftId}", id);
                return StatusCode(500, new { message = "Ошибка при обновлении черновика" });
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteDraft(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var existing = await _draftService.GetByIdAsync(id);
                
                if (existing == null)
                    return NotFound(new { message = "Черновик не найден" });
                
                if (existing.OwnerUserId != userId)
                    return Forbid();
                
                await _draftService.DeleteAsync(id);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product draft {DraftId}", id);
                return StatusCode(500, new { message = "Ошибка при удалении черновика" });
            }
        }

        [HttpPost("sync")]
        public async Task<ActionResult<SyncDraftsResponseDto>> SyncDrafts([FromBody] SyncDraftsRequestDto request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _draftService.SyncDraftsAsync(userId, request);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing product drafts");
                return StatusCode(500, new { message = "Ошибка при синхронизации черновиков" });
            }
        }
    }
}
