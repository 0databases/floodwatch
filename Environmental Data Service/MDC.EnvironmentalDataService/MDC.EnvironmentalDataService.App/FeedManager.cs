using System;
using System.Configuration;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Threading;
using System.Xml.Linq;
using MDC.EnvironmentalDataService.App.Data;
using MDC.EnvironmentalDataService.App.Models;
using Newtonsoft.Json;
using RestSharp;
using NLog;

namespace MDC.EnvironmentalDataService.App
{
    internal class FeedManager
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        public static void Log(string message, LogLevel level)
        {
            Logger.Log(level, message);
        }

        private static string GetMeasure(string commonName, bool useForecast)
        {
            var measure = "";
            switch (commonName)
            {
                case "Flow":
                    measure = (!useForecast ? "Flow" : "Simulated Flow");
                    break;
                case "Stage":
                    measure = (!useForecast ? "Stage" : "Forecast Level");
                    break;
                case "E Coli":
                    measure = "E. Coli";
                    break;
                case "Water Temperature":
                    measure = "Water Temperature (Field)";
                    break;
                default:
                    measure = commonName;
                    break;
            }

            return measure;
        }

        private static string GetPeriod(string measure, int time = 1)
        {
            string period = "";
            switch (measure)
            {
                case "Simulated Flow":
                case "Simulated Stage":
                    period = "PT1D";
                    break;
                case "Rainfall":
                    period = "PT" + time + "H";
                    break;
                default:
                    period = "PT1M";
                    break;
            }

            return period;
        }

        public static void GenerateFeeds(string configurationName = "")
        {
            try
            {
                var fileExtension = ConfigurationManager.AppSettings["GifGenFileExtension"];

                var configurations = HillTopDb.GetAllConfigurationParams(configurationName);

                var threadFeedGraph = new Thread(() => GenerateFeedGraph(configurations, fileExtension));
                var threadFeedJson = new Thread(() => GenerateFeedJson(configurations, fileExtension));

                threadFeedGraph.Start();
                threadFeedJson.Start();

            }
            catch (Exception ex)
            {
                // Save exception on Nlog
                var errorMessage = String.Format("Error FeedManager.GenerateFeeds => {0}", ex.Message);
                Log(errorMessage, LogLevel.Error);

            }
        }

        private static void GenerateFeedJson(IEnumerable<ConfigurationParameter> configurations, string fileExtension)
        {
            foreach (var configuration in configurations)
            {
                try
                {

                    var baseLocation = ConfigurationManager.AppSettings["FeedFileBaseLocation"];

                    var feedJsonList = new List<object>();

                    var feeds = HillTopDb.GetAllFeedsByConfigurationNameMeasurePeriod(configuration.ConfigurationName, configuration.CommonName, configuration.Period);

                    var sites = feeds.Where(p => p.ThresholdOrder == 1);
                    foreach (var hilltopData in sites)
                    {
                        Console.WriteLine("Updating Site...");
                        //var site = hilltopData.SiteName.Replace(" ", "");

                        var thresholdsSite = feeds.Where(p => p.SiteName == hilltopData.SiteName).ToList();

                        var measure = GetMeasure(configuration.CommonName, hilltopData.UseForecast);

                        var period = GetPeriod(measure, configuration.Period);

                        // Get the value, unit and the DateUpdated from Hilltop .hts file
                        string url = string.Format(ConfigurationManager.AppSettings["HillTopServerUrl"], hilltopData.SiteName, measure, period);
                        var doc = XDocument.Load(url);

                        var data = doc.Descendants().Where(d => d.Name == "E");
                        var item = doc.Descendants().Where(d => d.Name == "ItemInfo");

                        var dateUpdated = data.Descendants("T").LastOrDefault();
                        var updated = Convert.ToDateTime(dateUpdated.Value);

                        var totalValue = 0M;
                        if (measure == "Rainfall")
                        {
                            var listValues = data.Descendants((configuration.ConfigurationName == "Floodwatch" ? "I1" : "Value")).ToList();
                            totalValue += listValues.Sum(value => Convert.ToDecimal(value.Value.Replace("<", "").Replace(">", "")));
                        }
                        else
                        {
                            var value = data.Descendants((configuration.ConfigurationName == "Floodwatch" ? "I1" : "Value")).LastOrDefault();
                            totalValue = Convert.ToDecimal(value.Value.Replace("<", "").Replace(">", ""));
                        }

                        var currentValue = totalValue;

                        var units = item.Descendants("Units").FirstOrDefault();

                        var geoPos = hilltopData.Easting + " " + hilltopData.Northing;
                        var label = hilltopData.Label;
                        var hasForecast = hilltopData.HasForecast;
                        var useForecast = hilltopData.UseForecast;
                        var imageUrl = hilltopData.InfoUrl;

                        var alarm = "";
                        var alarmText = "";

                        //var body = "";
                        var axes = "";
                        var traces = "";
                        var thresholds = "";





                        if (configuration.ConfigurationName == "Floodwatch")
                        {
                            //body = GetGifGenFloodwatch(hilltopData, thresholdsSite, measure, fileExtension, fontType);
                            axes = GetFloodwatchAxes(hilltopData.AxisMinimum, hilltopData.AxisMaximum);
                            traces = GetFloodwatchTraces(hilltopData.SiteName, measure, hilltopData.HasForecast, hilltopData.UseForecast);
                            thresholds = GetFloodwatchThresholds(thresholdsSite);

                        }
                        else
                        {
                            //body = GetGifGenBathingWater(hilltopData, measure, fileExtension, fontType);    // E. coli or Enterococci
                            axes = GetBathingWaterAxes(hilltopData.AxisMinimum, hilltopData.AxisMaximum);
                            traces = GetBathingWaterTraces(hilltopData.SiteName, measure);
                            thresholds = GetBathingWaterThresholds(measure);
                        }

                        foreach (var threshold in thresholdsSite)
                        {
                            if (currentValue <= threshold.Maximum && string.IsNullOrEmpty(alarm))
                            {
                                if (!threshold.Indicator.Equals("NoThreshold"))
                                {
                                    alarm = (configuration.ConfigurationName == "Floodwatch" ? threshold.Indicator : (threshold.ThresholdOrder).ToString());    
                                }
                                else
                                {
                                    alarm = "Blue";
                                }
                                alarmText = threshold.GraphText;
                            }
                        }

                        var feedUrl = ConfigurationManager.AppSettings["FeedUrl"];

                        var graphUrl = String.Concat(feedUrl, "/Images/", configuration.ConfigurationName, "/",
                                            configuration.CommonName, "/", configuration.Period, "/", hilltopData.SiteName.Replace(" ", ""), ".", fileExtension);


                        var feedJson = new FeedJson(configuration.CommonName)
                        {
                            Value = currentValue,
                            Alarm = (updated < DateTime.Now.AddHours(-6) && configuration.ConfigurationName == "Floodwatch" ? "gray" : alarm),
                            AlarmText = alarmText,
                            LastUpdated = updated,
                            GeoPos = geoPos,
                            Units = units.Value,
                            Hour = configuration.Period,
                            GraphPath = graphUrl,
                            HasForecast = hasForecast,
                            UseForecast = useForecast,
                            Hilltop = hilltopData.SiteName,
                            ImageUrl = imageUrl,
                            Label = label,
                            Change = "",
                            Axes = axes,
                            Traces = traces,
                            Thresholds = thresholds
                        };

                        feedJsonList.Add(feedJson);

                    }
                    Console.WriteLine("Updating json file...");
                    var jsonFormated = JsonConvert.SerializeObject(
                        new
                        {
                            FeedUpdated = DateTime.Now.ToShortDateString() + " " + DateTime.Now.ToShortTimeString(),
                            Sites = feedJsonList.ToArray()
                        }, Formatting.Indented);
                    var jsonPath = String.Concat(baseLocation, "\\", configuration.ConfigurationName, "\\", configuration.CommonName, "\\", configuration.Period, "\\");

                    Directory.CreateDirectory(jsonPath);
                    File.WriteAllText(jsonPath + "feed.json", jsonFormated);
                    Console.WriteLine("Updated!");

                }
                catch (Exception ex)
                {
                    // Save exception on Nlog
                    var errorMessage = String.Format("Error FeedManager.GenerateFeedJson => {0}", ex.Message);
                    Log(errorMessage, LogLevel.Error);
                }

            }

        }

        private static void GenerateFeedGraph(IEnumerable<ConfigurationParameter> configurations, string fileExtension)
        {

            //var traceColour = ConfigurationManager.AppSettings["GifGenTraceColour"];
            //var traceThickness = ConfigurationManager.AppSettings["GifGenTraceThickness"];

            var fontType = ConfigurationManager.AppSettings["GifGenFontType"];
            //var baseLocation = ConfigurationManager.AppSettings["FeedFileBaseLocation"];

            foreach (var configuration in configurations)
            {

                var feeds = HillTopDb.GetAllFeedsByConfigurationNameMeasurePeriod(configuration.ConfigurationName,
                    configuration.CommonName, configuration.Period);

                var sites = feeds.Where(p => p.ThresholdOrder == 1);
                foreach (var hilltopData in sites)
                {
                    var site = hilltopData.SiteName.Replace(" ", "");

                    var thresholdsSite = feeds.Where(p => p.SiteName == hilltopData.SiteName).ToList();

                    var measure = GetMeasure(configuration.CommonName, hilltopData.UseForecast);

                    var body = "";
                    if (configuration.ConfigurationName == "Floodwatch")
                    {
                        body = GetGifGenFloodwatch(hilltopData, thresholdsSite, measure, fileExtension, fontType);
                    }
                    else
                    {
                        body = GetGifGenBathingWater(hilltopData, measure, fileExtension, fontType);    // E. coli or Enterococci
                    }

                    //CallGifGen(body, configuration, fileExtension, site);

                    var threadGifGen = new Thread(() => CallGifGen(body, configuration, fileExtension, site));
                    threadGifGen.Start();

                }
            }
        }

        private static void CallGifGen(string body, ConfigurationParameter configuration, string fileExtension, string site)
        {
            try
            {


                var baseLocation = ConfigurationManager.AppSettings["FeedFileBaseLocation"];

                var client = new RestClient(ConfigurationManager.AppSettings["GifGenUrl"]);

                var request = new RestRequest(Method.POST) { RequestFormat = DataFormat.Xml };

                request.AddParameter("text/xml", body, ParameterType.RequestBody);

                var response = client.Post(request);

                var graphFilePath = String.Concat(baseLocation, "\\Images\\", configuration.ConfigurationName,
                    "\\", configuration.CommonName, "\\", configuration.Period, "\\");

                if (response.RawBytes != null)
                {
                    using (var ms = new MemoryStream(response.RawBytes))
                    {
                        var img = Image.FromStream(ms);

                        Directory.CreateDirectory(graphFilePath);
                        img.Save(string.Concat(graphFilePath, site, ".", fileExtension),
                            (fileExtension == "PNG" ? ImageFormat.Png : ImageFormat.Gif));
                    }
                }
                else
                {
                    var errorMessage = String.Format("Error FeedManager.CallGifGen. We couldn't generate the graph to {0} - {1} - {2}", configuration.ConfigurationName, configuration.CommonName, configuration.Period);
                    Log(errorMessage, LogLevel.Error);
                }
            }
            catch (Exception ex)
            {
                // Save exception on Nlog
                var errorMessage = String.Format("Error FeedManager.CallGifGen => {0}", ex.Message);
                Log(errorMessage, LogLevel.Error);

            }
        }

        private static string GetGifGenFloodwatch(HilltopFeed hilltopData, IEnumerable<HilltopFeed> thresholdsSite, string measure, string extension, string fontType)
        {
            var floodWatchWitdh = ConfigurationManager.AppSettings["GifGenFWatchWidth"];
            var floodWatchHeight = ConfigurationManager.AppSettings["GifGenFWatchHeight"];

            var body = "<HilltopImage>";
            body += "<Size X='580' Y='464'/>";
            body += "<Format>" + extension + "</Format>";
            body += "<BackgroundColour>White</BackgroundColour>";
            body += "<Graph>";
            body += "<Labels>";
            body += "<TraceLabel>";
            body += "<Text>%measurement% at %site% (Plot ends %ftime%)</Text>";
            body += "</TraceLabel>";
            body += "<font>";
            body += "<TypeFace>" + fontType + "</TypeFace>";
            body += "</font>";
            body += "</Labels>";

            body += GetFloodwatchAxes(hilltopData.AxisMinimum, hilltopData.AxisMaximum);
            body += GetFloodwatchTraces(hilltopData.SiteName, measure, hilltopData.HasForecast, hilltopData.UseForecast);
            body += GetFloodwatchThresholds(thresholdsSite);

            body += "</Graph>";
            body += "</HilltopImage>";

            return body;
        }

        private static string GetFloodwatchAxes(double axisMinimum, double axisMaximum)
        {
            var body = "";

            body += "<Axes>";
            body += "<Axis Direction='Horizontal'>";
            body += "<From>" + DateTime.Now.AddHours(-24).ToShortDateString() + " " + DateTime.Now.AddHours(-24).ToShortTimeString() + "</From>";
            body += "<To>" + DateTime.Now.AddHours(12).ToShortDateString() + " " + DateTime.Now.AddHours(12).ToShortTimeString() + "</To>";
            body += "<TickSpacing>6 Hours</TickSpacing>";
            body += "</Axis>";
            body += "<Axis Direction='Vertical' AxisNumber='0'>";
            body += "<Min>" + axisMinimum + "</Min>";
            body += "<Max>" + axisMaximum + "</Max>";
            body += "</Axis>";
            body += "</Axes>";

            return body;
        }

        private static string GetFloodwatchTraces(string siteName, string measure, bool hasForecast, bool useForecast)
        {
            var body = "";

            body += "<Traces>";
            body += "<Trace Site='" + siteName + "' Measurement='" + measure + "' AxisNumber='0'>";
            body += "<Pen>";
            body += "<Colour>Blue</Colour>";
            body += "<Thickness>2</Thickness>";
            body += "</Pen>";
            if (hasForecast && useForecast == false)
            {
                body += "<Trace Site='" + siteName + "' Measurement='" + (measure == "Stage" ? "Forecast Level" : "Simulated " + measure) + "' AxisNumber='0'>";
                body += "<Pen>";
                body += "<Colour>Red</Colour>";
                body += "<Thickness>2</Thickness>";
                body += "</Pen>";
                body += "</Trace>";
            }
            body += "</Trace>";
            body += "</Traces>";

            return body;
        }

        private static string GetFloodwatchThresholds(IEnumerable<HilltopFeed> thresholdsSite)
        {
            var body = "";

            body += "<Thresholds>";
            foreach (var threshold in thresholdsSite.SkipWhile(p => p.Indicator.Equals("NoThreshold", StringComparison.OrdinalIgnoreCase )))
            {
                body += "<Line Value='" + threshold.Minimum + "' Colour='Black' Title='" + threshold.GraphText + "' />";
                body += "<Region Min='" + threshold.Minimum + "' Max='" + threshold.Maximum + "' Colour='" + threshold.Colour + "' />";
            }
            body += "</Thresholds>";

            return body;
        }

        private static string GetGifGenBathingWater(HilltopFeed hilltopData, string measure, string extension, string fontType)
        {
            var body = "<HilltopImage>";
            body += "<Size X='250' Y='200'/>";
            body += "<Format>" + extension + "</Format>";
            body += "<BackgroundColour>White</BackgroundColour>";
            body += "<AltInnerBackgroundColour>White</AltInnerBackgroundColour>";
            body += "<Graph>";
            body += "<Style>Bar</Style>";
            body += "<InnerBackgroundColour>White</InnerBackgroundColour>";
            body += "<Labels>";
            body += "<TraceLabel>";
            body += "<Text>%measurement% at %site% (%units%)</Text>";
            body += "</TraceLabel>";
            body += "<font>";
            body += "<TypeFace>" + fontType + "</TypeFace>";
            body += "</font>";
            body += "</Labels>";

            body += GetBathingWaterAxes(hilltopData.AxisMinimum, hilltopData.AxisMaximum);
            body += GetBathingWaterTraces(hilltopData.SiteName, measure);
            body += GetBathingWaterThresholds(measure);

            body += "</Graph>";
            body += "</HilltopImage>";

            return body;
        }

        private static string GetBathingWaterAxes(double axisMinimum, double axisMaximum)
        {
            var body = "";

            body += "<Axes>";
            body += "<Axis Direction='Horizontal'>";

            if (DateTime.Now.Month >= 4)
            {
                body += "<From>31/03/" + DateTime.Now.Year + "</From>";
                body += "<To>1/11/" + (DateTime.Now.Year + 1) + "</To>";
            }
            else
            {
                body += "<From>1/11/" + (DateTime.Now.Year - 1) + "</From>";
                body += "<To>31/03/" + DateTime.Now.Year + "</To>";
            }
            body += "<TickSpacing>2 Month</TickSpacing>";

            body += "</Axis>";
            body += "<Axis Direction='Vertical' AxisNumber='0'>";
            body += "<Min>" + axisMinimum + "</Min>";
            body += "<Max>" + axisMaximum + "</Max>";
            body += "</Axis>";
            body += "</Axes>";

            return body;
        }

        private static string GetBathingWaterTraces(string siteName, string measure)
        {
            var body = "";
            body += "<Traces>";
            body += "<Trace Site='" + siteName + "' Measurement='" + measure + "' AxisNumber='0'>";
            body += "<Pen>";
            body += "<Colour>Blue</Colour>";
            body += "<Thickness>2</Thickness>";
            body += "</Pen>";
            body += "</Trace>";
            body += "</Traces>";

            return body;
        }

        private static string GetBathingWaterThresholds(string measure)
        {
            var body = "";
            body += "<Thresholds>";
            if (measure == "Enterococci")
            {
                body += "<Line Value='140' Colour='Orange' Title='MfE Alert Level Guideline' />";
                body += "<Line Value='280' Colour='Red' Title='MfE Action Level Guideline' />";
            }
            else
            {
                body += "<Line Value='260' Colour='Orange' Title='MfE Alert Level Guideline' />";
                body += "<Line Value='550' Colour='Red' Title='MfE Action Level Guideline' />";
            }
            body += "</Thresholds>";

            return body;
        }
    }
}
