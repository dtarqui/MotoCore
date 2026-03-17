namespace MotoCore.Application.Common.Results;

public class Result
{
    protected Result(bool isSuccess, Error? error)
    {
        IsSuccess = isSuccess;
        Error = error;
    }

    public bool IsSuccess { get; }
    public Error? Error { get; }

    public static Result Success() => new(true, null);

    public static Result Failure(string code, string message) => new(false, new Error(code, message));
}

public sealed class Result<T> : Result
{
    private Result(T value) : base(true, null)
    {
        Value = value;
    }

    private Result(Error error) : base(false, error)
    {
    }

    public T? Value { get; }

    public static Result<T> Success(T value) => new(value);

    public new static Result<T> Failure(string code, string message) => new(new Error(code, message));
}