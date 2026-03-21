using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MotoCore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "part_movements",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    workshop_id = table.Column<Guid>(type: "uuid", nullable: false),
                    part_id = table.Column<Guid>(type: "uuid", nullable: false),
                    movement_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    previous_stock = table.Column<int>(type: "integer", nullable: false),
                    new_stock = table.Column<int>(type: "integer", nullable: false),
                    unit_cost = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    total_cost = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    work_order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reference = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_part_movements", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "parts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    workshop_id = table.Column<Guid>(type: "uuid", nullable: false),
                    part_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    brand = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    current_stock = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    minimum_stock = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    maximum_stock = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    unit_cost = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                    sale_price = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                    location = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    supplier_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    supplier_contact = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parts", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_part_movements_movement_type",
                table: "part_movements",
                column: "movement_type");

            migrationBuilder.CreateIndex(
                name: "ix_part_movements_part_id",
                table: "part_movements",
                column: "part_id");

            migrationBuilder.CreateIndex(
                name: "ix_part_movements_work_order_id",
                table: "part_movements",
                column: "work_order_id");

            migrationBuilder.CreateIndex(
                name: "ix_part_movements_workshop_id",
                table: "part_movements",
                column: "workshop_id");

            migrationBuilder.CreateIndex(
                name: "ix_parts_category",
                table: "parts",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "ix_parts_workshop_id",
                table: "parts",
                column: "workshop_id");

            migrationBuilder.CreateIndex(
                name: "ix_parts_workshop_id_part_number",
                table: "parts",
                columns: new[] { "workshop_id", "part_number" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "part_movements");

            migrationBuilder.DropTable(
                name: "parts");
        }
    }
}
