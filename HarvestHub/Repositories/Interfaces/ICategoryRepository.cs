namespace HarvestHub.Repositories.Interfaces
{
    public interface ICategoryRepository : IRepository<Category>
    {
        Task<IEnumerable<Category>> GetRootCategoriesAsync();
        Task<IEnumerable<Category>> GetChildrenAsync(int parentId);
        Task<bool> ExistsByNameAsync(string name, int? excludeCategoryId = null);
        Task<bool> HasProductsAsync(int categoryId);
        Task<bool> HasChildrenAsync(int categoryId);
        Task UpdateTreeStructureAsync();
        Task<IEnumerable<Category>> SearchAsync(string searchTerm);
    }
}