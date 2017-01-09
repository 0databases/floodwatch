using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Linq;
using MDC.EnvironmentalDataService.App.Models;

namespace MDC.EnvironmentalDataService.App.Data
{
    public class HillTopDb
    {
        private static DbContext GetDbContext()
        {
            var connectionString = ConfigurationManager.ConnectionStrings["Hilltop"].ConnectionString;
            var dbContext = new DbContext(connectionString);
            
            return dbContext;
        }

        public static List<ConfigurationParameter> GetAllConfigurationParams(string configurationName)
        {
            try
            {
                var dbContext = GetDbContext();
                //var procedure = ConfigurationManager.AppSettings["GetConfigurationParams"];

                var sqlView = "SELECT CommonName, ConfigurationName, Period ";
                sqlView += "FROM dbo.vUsrGetConfigurationParams ";
                sqlView += "WHERE ConfigurationName = @ConfigurationName OR @ConfigurationName = ''";
                
                var configuration = new SqlParameter("ConfigurationName", configurationName);

                var list = dbContext.Database.SqlQuery<ConfigurationParameter>(sqlView, configuration).ToList();
                Console.WriteLine("Configuration Count: " + list.Count);
                return list;
            }
            catch (Exception ex)
            {
                throw new Exception(string.Format("Error to get the data from GetAllConfigurationParams(): ") + ex.Message);
            }
        }

        public static List<HilltopFeed> GetAllFeedsByConfigurationNameMeasurePeriod(string configurationName, string commonName, int period = 1)
        {
            try
            {
                var dbContext = GetDbContext();

                var sqlView = "SELECT ThresholdOrder, AxisMinimum, AxisMaximum, Easting, Northing, Minimum, Maximum, Colour, Indicator, GraphText, HasForecast, UseForecast, Label, InfoUrl, SiteName, CommonName ";
                sqlView += "FROM dbo.vUsrMeasureSiteThresholdTmp ";
                sqlView += "WHERE ConfigurationName = @ConfigurationName AND CommonName = @CommonName AND Period = @Period ";
                sqlView += "ORDER BY ThresholdOrder";

                var configuration = new SqlParameter("ConfigurationName", configurationName);
                var measure = new SqlParameter("CommonName", commonName);
                var hour = new SqlParameter("Period", period);

                var list = dbContext.Database.SqlQuery<HilltopFeed>(sqlView, configuration, measure, hour).ToList();
                
                return list;
            }
            catch (Exception ex)
            {
                throw new Exception(string.Format("Error to get the data from GetAllFeedsByConfigurationNameMeasurePeriod(configurationName= {0}, commonName= {1}, period= {2}): ", configurationName, commonName, period) + ex.Message);
            }
        }


    }
}