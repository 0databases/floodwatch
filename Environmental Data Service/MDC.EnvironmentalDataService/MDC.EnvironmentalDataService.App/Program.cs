using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MDC.EnvironmentalDataService.App
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Getting Feeds");
            if (args.Any())
            {
                var configuration = args[0];
                Console.WriteLine("Configuration: " + configuration);
                FeedManager.GenerateFeeds(configuration);    
            }
            else
            {
                FeedManager.GenerateFeeds();    
            }
            Console.WriteLine("End Feeds");
        }
    }
}
