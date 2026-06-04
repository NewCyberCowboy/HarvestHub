using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HarvestHub.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProductsRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Users_FarmerId",
                table: "Products");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Users_FarmerId",
                table: "Products",
                column: "FarmerId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Users_FarmerId",
                table: "Products");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Users_FarmerId",
                table: "Products",
                column: "FarmerId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
