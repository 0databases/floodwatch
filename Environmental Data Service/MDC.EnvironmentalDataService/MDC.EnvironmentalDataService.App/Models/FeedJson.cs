using System;

namespace MDC.EnvironmentalDataService.App.Models
{
    public class FeedJson
    {
        private readonly string _type;

        public FeedJson(string type)
        {
            _type = type;
        }

        public string Label { get; set; }

        public string Hilltop { get; set; }

        public decimal Value { get; set; }

        public string ValueFormated
        {
            get
            {
                decimal value;
                if (Value < 1)
                {
                    value = Math.Round(Value, 3);
                }
                else if (Value < 10)
                {
                    value = Math.Round(Value, 2);
                }
                else if (Value < 100)
                {
                    value = Math.Round(Value, 1);
                }
                else
                {
                    value = Math.Round(Value, 0);    
                }
                
                switch (_type)
                {
                    case "Flow":
                        return value + " m3/s";    
                        break;
                    case "Stage":
                        return value + " mm";
                        break;
                    case "Rainfall":
                        return value + " mm in the past " + Hour + (Hour == 1 ? " hour" : " hours");
                        break;
                    case "E Coli":
                    case "Enterococci":
                        return Units.Replace("number", value.ToString());
                        break;
                    case "Water Temperature":
                        return value + " C";
                        break;
                    default:
                        return value.ToString();
                        break;
                }
            }
        }

        public string Units { get; set; }

        public int Hour { get; set; }

        public string Alarm { get; set; }
        
        public string AlarmText { get; set; }

        public DateTime LastUpdated { get; set; }

        public string Updated
        {
            get
            {
                return LastUpdated.ToShortDateString() + " " + LastUpdated.ToShortTimeString();
            }
        }

        public bool IsDayLightSavings
        {
            get
            {
                return TimeZone.CurrentTimeZone.IsDaylightSavingTime(DateTime.Now);
            }
        }

        public string GeoPos { get; set; }

        public MapPoint MapPoint
        {
            get
            {
                if (GeoPos == null)
                {
                    return null;
                }

                var positions = GeoPos.Split(' ');
                var mapPoint = new MapPoint {X = positions[0], Y = positions[1]};

                return mapPoint;
            }
        }

        public string GraphPath { get; set; }

        public bool HasForecast { get; set; }

        public bool UseForecast { get; set; }

        public string ImageUrl { get; set; }

        public string Change { get; set; }

        public string Axes { get; set; }

        public string Traces { get; set; }

        public string Thresholds { get; set; }
    }
}
