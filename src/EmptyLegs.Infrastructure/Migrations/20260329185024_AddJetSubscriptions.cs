using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmptyLegs.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddJetSubscriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JetSubscriptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    JetId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JetSubscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JetSubscriptions_Jets_JetId",
                        column: x => x.JetId,
                        principalTable: "Jets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_JetSubscriptions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JetSubscriptions_JetId",
                table: "JetSubscriptions",
                column: "JetId");

            migrationBuilder.CreateIndex(
                name: "IX_JetSubscriptions_UserId_JetId",
                table: "JetSubscriptions",
                columns: new[] { "UserId", "JetId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JetSubscriptions");
        }
    }
}
