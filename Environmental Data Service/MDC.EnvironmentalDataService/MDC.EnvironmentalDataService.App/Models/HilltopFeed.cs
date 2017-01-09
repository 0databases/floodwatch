
namespace MDC.EnvironmentalDataService.App.Models
{
    public class HilltopFeed
    {
        public int ThresholdOrder { get; set; }
        public double AxisMinimum { get; set; }
        public double AxisMaximum { get; set; }
        public int Easting { get; set; }
        public int Northing { get; set; }
        public decimal Minimum { get; set; }
        public decimal Maximum { get; set; }
        public string Colour { get; set; }
        public string Indicator { get; set; }
        public string GraphText { get; set; }
        public bool HasForecast { get; set; }
        public bool UseForecast { get; set; }
        public string Label { get; set; }
        public string InfoUrl { get; set; }
        public string SiteName { get; set; }
        public string CommonName { get; set; }
    }
}
