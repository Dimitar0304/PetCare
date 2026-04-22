namespace PetCare.Core.Services.Weather;

/// <summary>
/// Result of a simple-linear-regression fit of the form <c>y = slope · x + intercept</c>.
/// </summary>
public readonly record struct RegressionResult(double Slope, double Intercept, double R2);

/// <summary>
/// Numerically simple, allocation-free least-squares linear regression used by the
/// weather prediction service. The independent variable <c>x</c> is implicit and
/// equals the index of each sample in the input series.
/// </summary>
public static class LinearRegression
{
    /// <summary>
    /// Fits <c>y = slope · i + intercept</c> over the given values, where <c>i</c> is
    /// the sample's index. Handles the degenerate cases of zero or one input.
    /// </summary>
    public static RegressionResult Fit(IReadOnlyList<double> y)
    {
        var n = y.Count;
        if (n == 0) return default;
        if (n == 1) return new RegressionResult(0, y[0], 0);

        var xMean = (n - 1) / 2.0;
        var yMean = y.Average();

        var (num, den) = ComputeSlopeSums(y, n, xMean, yMean);
        var slope = den == 0 ? 0 : num / den;
        var intercept = yMean - slope * xMean;

        var r2 = ComputeR2(y, n, slope, intercept, yMean);
        return new RegressionResult(slope, intercept, r2);
    }

    /// <summary>Computes the numerator/denominator of the least-squares slope.</summary>
    private static (double num, double den) ComputeSlopeSums(
        IReadOnlyList<double> y, int n, double xMean, double yMean)
    {
        double num = 0, den = 0;
        for (var i = 0; i < n; i++)
        {
            var dx = i - xMean;
            num += dx * (y[i] - yMean);
            den += dx * dx;
        }
        return (num, den);
    }

    /// <summary>Computes the coefficient of determination (R²) clamped to [0, 1].</summary>
    private static double ComputeR2(
        IReadOnlyList<double> y, int n, double slope, double intercept, double yMean)
    {
        double ssRes = 0, ssTot = 0;
        for (var i = 0; i < n; i++)
        {
            var residual = y[i] - (slope * i + intercept);
            var deviation = y[i] - yMean;
            ssRes += residual * residual;
            ssTot += deviation * deviation;
        }

        return ssTot == 0 ? 0 : Math.Clamp(1 - ssRes / ssTot, 0, 1);
    }
}
