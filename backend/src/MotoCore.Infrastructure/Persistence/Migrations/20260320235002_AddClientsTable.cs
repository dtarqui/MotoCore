using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MotoCore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddClientsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "clients",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    workshop_id = table.Column<Guid>(type: "uuid", nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    secondary_phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    address = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    postal_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    identification_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    company_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    tax_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    birth_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    preferred_contact_method = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_clients", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_clients_workshop_id",
                table: "clients",
                column: "workshop_id");

            migrationBuilder.CreateIndex(
                name: "ix_clients_workshop_id_email",
                table: "clients",
                columns: new[] { "workshop_id", "email" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "clients");
        }
    }
}
