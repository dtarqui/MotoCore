namespace MotoCore.Domain.WorkOrders;

public static class WorkOrderStatus
{
    public const string Pending = "Pending";
    public const string InDiagnosis = "InDiagnosis";
    public const string InRepair = "InRepair";
    public const string Completed = "Completed";
    public const string Delivered = "Delivered";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Pending,
        InDiagnosis,
        InRepair,
        Completed,
        Delivered
    };

    public static bool IsValid(string status) =>
        All.Contains(status, StringComparer.OrdinalIgnoreCase);
}
