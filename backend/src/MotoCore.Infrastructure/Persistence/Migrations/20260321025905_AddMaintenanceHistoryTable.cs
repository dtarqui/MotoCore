using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MotoCore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMaintenanceHistoryTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "maintenance_history",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    workshop_id = table.Column<Guid>(type: "uuid", nullable: false),
                    motorcycle_id = table.Column<Guid>(type: "uuid", nullable: false),
                    client_id = table.Column<Guid>(type: "uuid", nullable: false),
                    work_order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    mileage_at_service = table.Column<int>(type: "integer", nullable: true),
                    total_cost = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                    service_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    performed_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    services_performed = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    parts_used = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    recommendations = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_maintenance_history", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_maintenance_history_client_id",
                table: "maintenance_history",
                column: "client_id");

            migrationBuilder.CreateIndex(
                name: "ix_maintenance_history_motorcycle_id",
                table: "maintenance_history",
                column: "motorcycle_id");

            migrationBuilder.CreateIndex(
                name: "ix_maintenance_history_service_date",
                table: "maintenance_history",
                column: "service_date");

            migrationBuilder.CreateIndex(
                name: "ix_maintenance_history_work_order_id",
                table: "maintenance_history",
                column: "work_order_id");

            migrationBuilder.CreateIndex(
                name: "ix_maintenance_history_workshop_id",
                table: "maintenance_history",
                column: "workshop_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "maintenance_history");
        }
    }
}
