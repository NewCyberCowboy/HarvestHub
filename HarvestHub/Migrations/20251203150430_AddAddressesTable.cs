using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HarvestHub.Migrations
{
    /// <inheritdoc />
    public partial class AddAddressesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderStatusHistories_Users_UserId",
                table: "OrderStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_OrderStatusHistories_UserId",
                table: "OrderStatusHistories");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "OrderStatusHistories");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_ChangedBy",
                table: "OrderStatusHistories",
                column: "ChangedBy");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderStatusHistories_Users_ChangedBy",
                table: "OrderStatusHistories",
                column: "ChangedBy",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderStatusHistories_Users_ChangedBy",
                table: "OrderStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_OrderStatusHistories_ChangedBy",
                table: "OrderStatusHistories");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "OrderStatusHistories",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_UserId",
                table: "OrderStatusHistories",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderStatusHistories_Users_UserId",
                table: "OrderStatusHistories",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId");
        }
    }
}
