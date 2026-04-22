using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetCare.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddQueryIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Messages_RecipientId_IsRead",
                table: "Messages",
                columns: new[] { "RecipientId", "IsRead" });

            migrationBuilder.CreateIndex(
                name: "IX_Ads_Town",
                table: "Ads",
                column: "Town");

            migrationBuilder.CreateIndex(
                name: "IX_Ads_TypeService",
                table: "Ads",
                column: "TypeService");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Messages_RecipientId_IsRead",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Ads_Town",
                table: "Ads");

            migrationBuilder.DropIndex(
                name: "IX_Ads_TypeService",
                table: "Ads");
        }
    }
}
