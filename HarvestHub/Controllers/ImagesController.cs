using HarvestHub.Common;
using Microsoft.AspNetCore.Mvc;

namespace HarvestHub.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImagesController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<ImagesController> _logger;

        public ImagesController(IWebHostEnvironment environment, ILogger<ImagesController> logger)
        {
            _environment = environment;
            _logger = logger;
        }

        [HttpPost("upload")]
        public async Task<ActionResult<ApiResponse<string>>> Upload(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(ApiResponse<string>.ErrorResult("Файл не выбран"));
                }

                // Проверка типа файла
                if (!file.ContentType.StartsWith("image/"))
                {
                    return BadRequest(ApiResponse<string>.ErrorResult("Файл должен быть изображением"));
                }

                // Проверка размера файла (макс 5MB)
                if (file.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(ApiResponse<string>.ErrorResult("Размер файла не должен превышать 5MB"));
                }

                // Создаем директорию если не существует
                string uploadsFolder = Path.Combine(_environment.WebRootPath, "images", "products");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Генерируем уникальное имя файла с расширением .jpg для совместимости
                string extension = Path.GetExtension(file.FileName).ToLower();
                // Конвертируем .jfif и другие форматы в .jpg для лучшей совместимости
                if (extension == ".jfif" || extension == ".jpeg" || extension == ".jpe")
                {
                    extension = ".jpg";
                }
                string uniqueFileName = Guid.NewGuid().ToString() + extension;
                string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Сохраняем файл
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                // Возвращаем URL к файлу
                string fileUrl = $"/images/products/{uniqueFileName}";

                _logger.LogInformation($"Файл успешно загружен: {fileUrl}");

                return Ok(ApiResponse<string>.SuccessResult(fileUrl, "Изображение успешно загружено"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при загрузке изображения");
                return StatusCode(500, ApiResponse<string>.ErrorResult("Ошибка при загрузке изображения"));
            }
        }

        [HttpDelete("{fileName}")]
        public ActionResult Delete(string fileName)
        {
            try
            {
                string filePath = Path.Combine(_environment.WebRootPath, "images", "products", fileName);

                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    _logger.LogInformation($"Файл удален: {fileName}");
                    return Ok(ApiResponse<string>.SuccessResult(null, "Изображение удалено"));
                }

                return NotFound(ApiResponse<string>.ErrorResult("Файл не найден"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при удалении изображения");
                return StatusCode(500, ApiResponse<string>.ErrorResult("Ошибка при удалении изображения"));
            }
        }
    }
}
