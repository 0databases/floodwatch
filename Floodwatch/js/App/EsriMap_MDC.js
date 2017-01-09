//var map;
var propertyLayer;
var property_no;
var property_noList = [];
var visible = [];
var contextLayerVisiblity = [];
var dynamicLayerVisibility = [];

require([
        //"esri/basemaps",
        "dojo/_base/lang",
        "dojo/_base/Color",
        "esri/config",
        //"dojo/_base/event",
        //"dojo/touch",
        "esri/dijit/HomeButton",
        'dojo/dnd/Moveable',
        //"esri/layers/WFSLayer",
        //"esri/dijit/Scalebar",
        //"esri/dijit/Search",
        //"esri/geometry/webMercatorUtils",          
        "esri/InfoTemplate",
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/layers/ArcGISTiledMapServiceLayer",
        //"esri/layers/FeatureLayer",
        //"esri/layers/ImageParameters",
        //"esri/layers/LabelLayer",
        "esri/graphic",
        "esri/layers/GraphicsLayer",
        "esri/geometry/Point",
        "esri/geometry/Extent",
        "esri/map",
        "esri/SpatialReference",
        //"esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol", "esri/symbols/PictureMarkerSymbol", "esri/symbols/TextSymbol",
        //"esri/renderers/SimpleRenderer",
        //"esri/tasks/query", "esri/tasks/QueryTask",
        "dojo/dom-construct",
        "dojo/dom", "dojo/on",
         "dojo/query",
         'dojo/dom-class'
        ,
        "dojo/parser", "dojo/ready", "dojo/_base/array", "dojo/domReady!", "dojo/NodeList-traverse", "dojo/dom-construct"
],
    function (
lang,
        //esriBasemaps,
        Color,
        esriConfig,
        //event,
        //touch,
        HomeButton,
        Moveable,
        InfoTemplate,
        ArcGISDynamicMapServiceLayer,
        ArcGISTiledMapServiceLayer,
        //FeatureLayer,
        //ImageParameters,
        //LabelLayer,
        Graphic,
        GraphicsLayer,
        Point,
        //Polygon,
        Extent,
        Map,
        SpatialReference,
        //SimpleFillSymbol,
        SimpleMarkerSymbol,
        SimpleLineSymbol, PictureMarkerSymbol, TextSymbol,
        //SimpleRenderer,h
        //Query, QueryTask,
        domConstruct,
        dom, on,
        query,
        domClass,
        //,
        parser, ready, arrayUtils, documentDojo
    ) {

        var globalSpatialReference = new SpatialReference({ wkid: 2193 });

        var picture =
        {
            small: { width: 20, height: 20 },
            large: { width: 40, height: 40 }
        }


        var baseServer = "xxxxx.xxxxx.govt.nz";
        var baseURL = "http://" + baseServer + "/environmentaldataservice/Floodwatch/";

        var rssFeedRiverFlow = baseURL + '/Flow/1/Feed.json';
        var rssFeedRiverLevel = baseURL + '/Stage/1/Feed.json';
        var rssFeedRainfall = baseURL + '/Rainfall/{HOUR}/Feed.json';

        //var rssFeedRiverFlow = 'http://xxxxx.xxxxx.govt.nz/rss/FloodWatch/Flow/1/Feed.rss';
        //var rssFeedRiverLevel = 'http://xxxxx.xxxxx.govt.nz/rss/FloodWatch/Stage/1/Feed.rss';
        //var rssFeedRainfall = 'http://xxxxx.xxxxx.govt.nz/rss/FloodWatch/Rainfall/{HOUR}/Feed.rss';

        //No Longer required...But can use if want graphs
        var hilltopURL = 'http://xxxxx.xxxxx.govt.nz/floodwatch/data.hts?Service=Hilltop&Request=Gifgen'; //POST
        var gifgenURL = 'http://xxxxx.xxxxx.govt.nz/GifGen/gifgen.ashx';

        //var labelFontSize = 8;
        var labelFontSize = {
            small: 7,
            large: 10
        }



        map = new Map("map", {
            //basemap: "topo",  //For full list of pre-defined basemaps, navigate to http://arcg.is/1JVo6Wd
            //center: [1679000, 5402000], //center: [173.96, -42.51], // longitude, latitude
            displayGraphicsOnPan: false, // graphics are turned off whenever the map is panned.
            infoWindow: null,//new PoxpupMobile(null,dojo.create("div")) ,
            logo: false,
            spatialReference: 2193,
        });


        var colors =
        {
            Blue: "#3FA4F0",    //ok
            Gray: "#B8C7CF",    //no data
            Orange: "#FF8E1E",  //warning
            Red: "#FF1D25",     //alert
            Yellow: "#FFCE00",     //alert
            Green: "#7AC443"     //alert
        }

        var borderColors =
        {
            Blue: "#003968",    //ok
            Gray: "#58595B",    //no data
            Orange: "#6B3000",  //warning
            Red: "#720013",     //alert
            Yellow: "#875600",     //alert
            Green: "#006838"     //alert
        }

        var sr = new SpatialReference({ "wkid": 2193 });
        /*	set spatial reference, extent and map content */

        //map.spatialReference = sr;
        var basemap0 = new ArcGISTiledMapServiceLayer("BASEMAP_URL", {
            visible: true
        });
        var lowResolutionAerials = new ArcGISTiledMapServiceLayer("LOW_RES_AERIAL_URL", {
            opacity: 1,
            minScale: 40000,
            visible: true
        });




        var riverBoundaryLayer = new ArcGISDynamicMapServiceLayer("RIVER_URL", {
            visible: true
        });

        //River layer is in other data sets. Only turn on rivers
        var riverLayerID = 13;
        riverBoundaryLayer.setVisibleLayers([riverLayerID]);

        //var imageParameters = new ImageParameters();
        //imageParameters.format = "jpeg"; //set the image type to PNG24, note default is PNG8.

        map.addLayers([basemap0, lowResolutionAerials, /*highResolutionAerials,*/ riverBoundaryLayer]);
        //contextLayer0.on("load", contextVisiblity);




        $.fn.outerHTML = function (s) {
            return s
                ? this.before(s).remove()
                : $("<p>").append(this.eq(0).clone()).html();
        };

        jQuery.support.cors = true;


        function handleHilltopDataJSON(idx, item, positionArray) {
            //console.log(
            //var sitePos = $(item).find('[srsName="EPSG:2193"]').children().html() || $(item).find('[srsName="EPSG:2193"]').children().text(); //returns East/North 5368310 1660681 //TEXT for IE 

            try {

                var siteName = item.Hilltop;
                var value = item.Value;
                var units = item.Units;
                var alarm = item.Alarm;
                var alarmtext = item.AlarmText;
                var isdaylightsavings = item.IsDayLightSavings;
                var hilltop = item.Hilltop;
                var label = item.Label;
                var change = item.Change;
                var forecast = item.HasForecast;
                var imageurl = item.ImageUrl;
                var graphUrl = item.GraphPath;
                var lastUpdated = item.LastUpdated; //('a10\\:updated').html(); ??IE ROCKS
                var lastUpdatedText = item.fileUpdatedDate;
                var valueFormatted = item.ValueFormated;

                //window.item = $(item);
                //var axis = $(item).find('Axis')[0].outerHTML || $(item).find('Axis').outerHTML();
                //var traces = $(item).find('Traces')[0].outerHTML || $(item).find('Traces').outerHTML();
                //var thresholds = '';

                //var doesHaveThreshold = $(item).find('Thresholds')[0];

                //if (doesHaveThreshold) {
                //    thresholds = $(item).find('Thresholds')[0].outerHTML || $(item).find('Thresholds').outerHTML();
                //}

                var northing = item.MapPoint.Y;
                var easting = item.MapPoint.X;

                //var hilltopXML = {
                //    axis: axis,
                //    traces: traces,
                //    thresholds: thresholds
                //}

                positionArray.push({
                    title: siteName || 'Unkown',
                    value: value,
                    position: { easting: easting, northing: northing },
                    easting: easting,
                    northing: northing,
                    //description: description,
                    units: units,
                    alarm: alarm,
                    alarmtext: alarmtext,
                    isdaylightsavings: isdaylightsavings,
                    hilltop: hilltop,
                    lastUpdatedText: lastUpdatedText,
                    valueFormatted: valueFormatted,
                    //hilltopXML: hilltopXML,
                    label: label,
                    change: change,
                    forecast: forecast,
                    imageurl: imageurl,
                    graphUrl: graphUrl,
                    lastUpdated: lastUpdated
                });

            } catch (ex) {

            }
        }





        function handleHilltopData(idx, item, positionArray) {
            //console.log(
            var sitePos = $(item).find('[srsName="EPSG:2193"]').children().html() || $(item).find('[srsName="EPSG:2193"]').children().text(); //returns East/North 5368310 1660681 //TEXT for IE 
            var siteName = $(item).find('title').text();
            var description = $(item).find('description').text();
            var units = $(item).find('units').text();
            var alarm = $(item).find('alarm').text();
            var alarmtext = $(item).find('alarmtext').text();
            var isdaylightsavings = $(item).find('isdaylightsavings').text();
            var hilltop = $(item).find('hilltop').text();
            var label = $(item).find('label').text();
            var change = $(item).find('change').text();
            var forecast = $(item).find('forecast').text();
            var imageurl = $(item).find('imageurl').text();
            var lastUpdated = $(item).children()[2].innerHTML || $(item).children()[2].textContent; //('a10\\:updated').html(); ??IE ROCKS

            window.item = $(item);
            var axis = $(item).find('Axis')[0].outerHTML || $(item).find('Axis').outerHTML();
            var traces = $(item).find('Traces')[0].outerHTML || $(item).find('Traces').outerHTML();
            var thresholds = '';

            var doesHaveThreshold = $(item).find('Thresholds')[0];

            if (doesHaveThreshold) {
                thresholds = $(item).find('Thresholds')[0].outerHTML || $(item).find('Thresholds').outerHTML();
            }

            var northing = sitePos.substring(0, sitePos.indexOf(' '));
            var easting = sitePos.substring(sitePos.indexOf(' ') + 1, 100);

            var hilltopXML = {
                axis: axis,
                traces: traces,
                thresholds: thresholds
            }

            positionArray.push({
                title: siteName || 'Unkown',
                position: { easting: easting, northing: northing },
                easting: easting,
                northing: northing,
                description: description,
                units: units,
                alarm: alarm,
                alarmtext: alarmtext,
                isdaylightsavings: isdaylightsavings,
                hilltop: hilltop,
                hilltopXML: hilltopXML,
                label: label,
                change: change,
                forecast: forecast,
                imageurl: imageurl,
                lastUpdated: lastUpdated
            });
        }

        function retrieveDataArray(data) {
            var positionArray = [];
            $(data.Sites)
                //.find('item')
                .each(function (idx, item) {
                    //handleHilltopData(idx, item, positionArray);
                    handleHilltopDataJSON(idx, item, positionArray);
                    //);
                });
            return positionArray;
        }

        function zoomToGraphicsExtent(positionArray, callback) {
            var extent = {
                min: {
                    X: 9999999999,
                    Y: 9999999999
                },
                max: {
                    X: 0,
                    Y: 0
                },
            }
            positionArray.forEach(function (item) {

                var curEasting = parseInt(item.easting);
                if (curEasting < extent.min.X) {
                    extent.min.X = curEasting;
                }

                if (curEasting > extent.max.X) {
                    extent.max.X = curEasting;
                }

                var curNorthing = parseInt(item.northing);
                if (curNorthing < extent.min.Y) {
                    extent.min.Y = curNorthing;
                }

                if (curNorthing > extent.max.Y) {
                    extent.max.Y = curNorthing;
                }


            });
            if (callback) {
                callback(extent);
            }
        }


        function clearGraphics() {
            var glNames = map.graphicsLayerIds;

            glNames.forEach(function (item) {
                map.getLayer(item).clear();
            });
        }



        var labelBox = {
            large: {
                height: "48",
                width: "118",
                size: "130",
                offsetX: 40

            },
            small: {
                height: "48",
                width: "110",
                size: "110",
                offsetX: 30
            }
        }
        window.labelBox = labelBox;


        function loadSiteLabels(rssFeedURL, feedID, callback) {

            var cacheBusterHilltop = new Date().getMilliseconds();




            $.get(rssFeedURL + '?id=' + cacheBusterHilltop).then(function (data) {

                map.graphics.clear();
                var existingLayer = map.getLayer(feedID);
                var mobileFullScreenInfoWindowShowing = $('#showInfo').css('display') === 'block';
                var isInfoWindowOpenAlready = map.infoWindow.isShowing || mobileFullScreenInfoWindowShowing;
                if (existingLayer) {
                    existingLayer.clear();
                }

                var positionArray = retrieveDataArray(data);


                zoomToGraphicsExtent(positionArray, callback);

                function createInfoTemplate(site, feedID) {
                    //Info Template
                    //var infoTemplateString =  "Measurement: " + site.description + " " + site.units;
                    var niceTime = "";
                    var rainfalladdition = "";

                    try {
                        niceTime = new moment(site.lastUpdated).format("D/MM/YYYY h:mm a");
                        var hour = feedID.match(/rainfall([0-9]{1,2})hour/i);
                        if (hour && hour.length > 1) {
                            rainfalladdition = " in the past " + hour[1] + " hour";
                            if (hour[1] != "1") {
                                rainfalladdition += 's';
                            }
                        }
                    } catch (ex) {

                    }

                    var infoTemplateString = "As At: " + (niceTime || ' unknown');




                    //infoTemplateString += "<br>" + "Alarm: " + site.alarm;
                    //infoTemplateString += "<br>" + "Alarm Text: " + site.alarmtext;
                    //infoTemplateString += "<br>" + "forecast: " + site.forecast;

                    //infoTemplateString += "<br>" + "Last Updated: " + site.lastUpdated;
                    //infoTemplateString += "<br>" + "<img width='500' height='400' id='imageReplace' class='ImageReplace' src='" + 'test' + "'/>";
                    var cb = new Date().getMilliseconds();
                    infoTemplateString += "<br>" + "<img width='500' height='400' id='imageReplace' src='" + site.graphUrl + "?id=" + cb + "'/>";
                    //if (graphURL) {
                    //    infoTemplateString += "<br>" + "<img id='imageReplace' src='" + graphURL + "'/>";
                    //} else {
                    //    infoTemplateString += "<br>No Image Available";
                    //}
                    //infoTemplateString += "<br>" + "<img src='" + site.imageurl + "'/>";
                    if (site.isdaylightsavings) {
                        infoTemplateString += "<br>" + "Add one hour for Daylight Savings time";
                        //infoTemplateString += "<br>Refresh Time: " + new moment().format("ss");
                    }


                    var title = site.title + " - " + site.value + " " + site.units + rainfalladdition;

                    var infoTemplate = new InfoTemplate(title, infoTemplateString);
                    return infoTemplate;
                };


                function createGraphics(site, pt, feedID) {
                    var whiteColorArray = [255, 255, 255, 255]; //White too hard to read for some.
                    var blackColorArray = [0, 0, 0, 255];

                    var TextSymbolJson = {
                        // This is the main readable label  
                        "type": "esriTS",
                        //"haloColor": [0, 0, 0, 255],
                        //"haloSize": 5,
                        "color": blackColorArray, //[255, 255, 255, 255],
                        "verticalAlignment": "middle",
                        "horizontalAlignment": "left",
                        "font": {
                            "family": "Arial",
                            "size": labelFontSize.small,
                            "style": "normal",
                            "weight": "bold",
                            "decoration": "none"
                        }
                    };


                    var TS = new TextSymbol(TextSymbolJson);
                    TS.setOffset(0, 6);

                    var TSNL = new TextSymbol(TextSymbolJson);

                    var infoTemplate = createInfoTemplate(site, feedID);

                    TS.setText(site.label);


                    //Image
                    var imagePath = 'images/' + feedID + '_' + site.alarm + '.png';
                    if (feedID.match(/rainfall*/i)) {
                        //strip out the sub feed hour info
                        imagePath = 'images/' + 'rainfall' + '_' + site.alarm + '.png';
                    }

                    var pictureMarkerSymbol = new PictureMarkerSymbol(imagePath, picture.small.width, picture.small.height);
                    pictureMarkerSymbol.setOffset(-15, 0);
                    pictureMarkerSymbol.setColor(new Color([255, 255, 0, 0.5]));
                    var labelPointGraphic = new Graphic(pt, pictureMarkerSymbol);
                    labelPointGraphic.attributes = site;
                    labelPointGraphic.setInfoTemplate(infoTemplate);


                    var labelTextPointGraphic = new Graphic(pt, TS);
                    labelTextPointGraphic.attributes = site;
                    labelTextPointGraphic.setInfoTemplate(infoTemplate);


                    TSNL.setOffset(0, -6);
                    TSNL.setText(site.value + " " + site.units);
                    var labelTextPointGraphicNeLine = new Graphic(pt, TSNL);
                    labelTextPointGraphicNeLine.attributes = site;
                    labelTextPointGraphicNeLine.setInfoTemplate(infoTemplate);


                    var length = site.label.length;
                    var width = labelBox.small.width;
                    var size = labelBox.small.size;
                    var offsetX = labelBox.small.offsetX; //
                    var height = labelBox.small.height;


                    if (length > 13) {
                        width = labelBox.large.width;
                        size = labelBox.large.size;
                        offsetX = labelBox.large.offsetX; //
                    }
                    var iconPath = "M0 " + height + " L0 16 L" + width + " 16 L" + width + " " + height + " Z";



                    //function shadeColor1(color, percent) { // deprecated. See below.
                    //    var num = parseInt(color.slice(1), 16), amt = Math.round(2.55 * percent), R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
                    //    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
                    //}


                    var alarmColor = colors[site.alarm] || colors.Gray;
                    var alarmColorBorder = borderColors[site.alarm] || borderColors.Gray;
                    var initColor = alarmColor;

                    var sls = new SimpleLineSymbol(
                        SimpleLineSymbol.STYLE_SOLID,
                        //new Color([255, 0, 0]),
                        new Color(alarmColorBorder),
                        2
                    );


                    function createSymbol(path, color) {
                        var markerSymbol = new SimpleMarkerSymbol();
                        markerSymbol.setPath(path);
                        markerSymbol.setColor(new dojo.Color(color));
                        markerSymbol.setOutline(sls);
                        markerSymbol.setSize(size);
                        markerSymbol.setOffset(offsetX, 0);
                        return markerSymbol;
                    }

                    var labelBoxGraphic = new Graphic(pt, createSymbol(iconPath, initColor));
                    labelBoxGraphic.attributes = site;
                    ///map.graphics.add(graphic);


                    labelBoxGraphic.setInfoTemplate(infoTemplate);


                    return { labelBoxGraphic: labelBoxGraphic, labelPointGraphic: labelPointGraphic, labelTextPointGraphic: labelTextPointGraphic, labelTextPointGraphicNeLine: labelTextPointGraphicNeLine, infoTemplate: infoTemplate }
                }




                var gl = new GraphicsLayer({ id: feedID });

                if (existingLayer) {
                    gl = existingLayer;
                }

                function showInfoWindow(evt) {
                    //$('#imageReplace').attr("src", window.hilltopSource);
                    map.infoWindow.resize(550, 550);
                }

                map.infoWindow.on("show", showInfoWindow);

                //dojo.connect(map.infoWindow, "onShow", showInfoWindow);


                function updateSiteInfoWindows(site, options, evt) {
                    map.infoWindow.hide();

                    $('#imageReplace2').attr("src", ""); //Default Graphic back to empty straight up.
                    $('#imageReplace').attr("src", ""); //Default Graphic back to empty straight up.

                    // Executes in XS and SM breakpoints
                    //Set in INLINE SCRIPT OF HTML
                    if (floodwatchIsMobile) {
                        // ...
                        $('#showInfo').show();
                    }

                    var hide = true;
                    if (options && !options.zoomTo) {
                        hide = false;
                    } else {
                        //Seems to have to be this way for IE
                        if (evt && floodwatchIsIE) {
                            //var whenCentered = map.centerAt(evt.mapPoint);
                            var whenCentered = map.centerAt(map.extent.getCenter());

                            whenCentered.then(function () {


                                map.infoWindow.setContent(evt.graphic.infoTemplate.content);
                                map.infoWindow.setTitle(evt.graphic.infoTemplate.title);

                                map.infoWindow.show(evt.mapPoint); //{x: 100, y: 200} new Point(100,200)
                            });
                        }


                    }


                    //var callback = function (src, options) {
                    //    console.log('src updated');


                    //    //Remove
                    //    //$('#showInfo').show();
                    //    $('#imageReplace').attr('src', src);
                    //    console.log('replacing imaage');


                    //}
                    //getGraph(site, callback);
                    //Update Image 2 with Hilltop graph
                    var cb = new Date().getMilliseconds();
                    $('#imageReplace2').attr('src', site.graphUrl + "?id=" + cb);
                    $('#imageReplace').attr('src', site.graphUrl + "?id=" + cb);
                    $('.contentPane').css('background-color', colors[site.alarm] || colors.Gray);
                    $('#showInfo').css('background-color', colors[site.alarm] || colors.Gray);

                    var daylightString = '';
                    if (site.isdaylightsavings) {
                        daylightString += "Add one hour for Daylight Savings time";
                    }

                    var niceTime = "";
                    var rainfalladdition = "";

                    try {
                        niceTime = new moment(site.lastUpdated).format("D/MM/YYYY h:mm a");
                        var hour = feedID.match(/rainfall([0-9]{1,2})hour/i);
                        if (hour && hour.length > 1) {
                            rainfalladdition = " in the past " + hour[1] + " hour";
                            if (hour[1] != "1") {
                                rainfalladdition += 's';
                            }
                        }
                    } catch (ex) {

                    }

                    var headerString = "As At: " + (niceTime || ' unknown');

                    //var headerString = "As at " + site.lastUpdated;

                    $('#titeBar').text(site.title + " - " + site.value + " " + site.units + rainfalladdition);
                    $('#contentMobile').text(headerString);
                    $('#daylightSavingsText').text(daylightString);
                    //map.infoWindow.show(evt.mapPoint, map.getInfoWindowAnchor(evt.mapPoint));
                    //map.infoWindow.move(evt.pt);

                    //console.log('graphic clicked');

                    //if (hide) {
                    map.infoWindow.hide();
                    //}
                }

                function graphicClickEventHandler(evt, options) {


                    var site = evt.graphic.attributes;
                    updateSiteInfoWindows(site, options, evt);

                }

                //gl.on('click', graphicClickEventHandler)



                function getGraphicsFromEvent(evt) {
                    //evt.graphic.setSymbol(highlightSymbol);
                    //map.infoWindow.show(evt.screenPoint,map.getInfoWindowAnchor(evt.screenPoint));
                    //console.log("TEST IN");
                    var sp = evt.screenPoint;
                    //alert_coords(evt.screenPoint);

                    //Dont set opacity - move to bottom of list.
                    //Set placeholder g so can get back to here.
                    var elem = $(evt.srcElement);
                    //var g = evt.graphic;
                    ////g.symbol.setSymbol(iconPathBig);
                    //g.symbol.setSize(200);
                    //g.draw();


                    var $text1;
                    var $text2;
                    var $image;
                    var $path;

                    if (elem[0].tagName == "text") {

                        //$text2 = elem.next();
                        //$text1 = elem;
                        //$image = elem.prev();
                        $path = elem.prev().prev();
                        //Text could be either previous or next
                        if (elem.prev()[0].tagName == "text") {
                            //$text1 = elem.prev();
                            //$text2 = elem;
                            //$image = elem.prev().prev();
                            //$path = elem.prev().prev().prev();


                            $path = elem.prev().prev().prev();


                        }


                        $image = $path.next();
                        $text1 = $image.next();
                        $text2 = $text1.next();


                    } else if (elem[0].tagName == "image") {


                        //$image = elem;
                        //$path = elem.prev();
                        //$text1 = elem.next();
                        //$text2 = elem.next().next();

                        $path = elem.prev();
                        $image = $path.next();
                        $text1 = $image.next();
                        $text2 = $text1.next();


                        //$('#map_graphics_layer').append(elem);
                        //$('#map_graphics_layer').append(elem.prev());
                        //$('#map_graphics_layer').append(elem.next());
                        //$('#map_graphics_layer').append(elem.next().next());

                    } else if (elem[0].tagName == "path") {
                        $path = elem;
                        $image = $path.next();
                        $text1 = $image.next();
                        $text2 = $text1.next();


                        //$('#map_graphics_layer').append(elem);
                        //$('#map_graphics_layer').append(elem.next());
                        //$('#map_graphics_layer').append(elem.next().next());
                        //$('#map_graphics_layer').append(elem.next().next().next());
                    }

                    return {
                        $text1: $text1,
                        $text2: $text2,
                        $image: $image,
                        $path: $path
                    }

                }


                function getGraphicsFromEventIE(evt) {
                    var sp = evt.screenPoint;
                    var elem = evt.srcElement;

                    var $text1, $text2, $image, $path;
                    elem.prev = elem.previousElementSibling;
                    elem.next = elem.nextElementSibling;

                    if (elem.tagName == "text") {
                        $path = elem.previousElementSibling.previousElementSibling;
                        if (elem.previousElementSibling.tagName == "text") {
                            $path = elem.previousElementSibling.previousElementSibling.previousElementSibling;
                        }


                    } else if (elem.tagName == "image") {

                        $path = elem.previousElementSibling;


                    } else if (elem.tagName == "path") {
                        $path = elem;

                    }

                    $image = $path.nextElementSibling;
                    $text1 = $image.nextElementSibling;
                    $text2 = $text1.nextElementSibling;

                    return {
                        $text1: $text1,
                        $text2: $text2,
                        $image: $image,
                        $path: $path
                    }

                }


                function getGraphicsFromEventDojo(evt) {

                    var elem = $(evt.srcElement);
                    elem.attr("id", "tempElementID1");

                    var $text1;
                    var $text2;
                    var $image;
                    var $path;
                    var dojoElemt = query('#' + 'tempElementID1');
                    if (elem[0].tagName == "text") {
                        $path = dojoElemt.prev().prev();
                        if (elem.prev()[0].tagName == "text") {
                            $path = dojoElemt.prev().prev().prev();
                        }

                    } else if (elem[0].tagName == "image") {
                        $path = dojoElemt.prev();

                    } else if (elem[0].tagName == "path") {
                        $path = dojoElemt;
                    }

                    $image = $path.next();
                    $text1 = $image.next();
                    $text2 = $text1.next();

                    elem.attr("id", null);
                    return {
                        $text1: $text1,
                        $text2: $text2,
                        $image: $image,
                        $path: $path
                    }

                }


                function resizeGraphics(graphicsClicked, largerOrSmaller) {
                    return true;
                    if (largerOrSmaller === 'larger') {
                        //console.log('larger');
                        var curTransform = graphicsClicked.$path.attr("transform");

                        var hasbeenTransformed = curTransform.match(/scale\(1\.5\) translate\(0,-4\)/) || curTransform.match(/scale\(1\.5\) translate\(0 -4\)/);
                        if (!hasbeenTransformed) {
                            graphicsClicked.$path.attr("transform", graphicsClicked.$path.attr("transform") + " scale(1.5) translate(0,-4)");
                        }

                        graphicsClicked.$text1.css("font-size", labelFontSize.large + "pt");
                        graphicsClicked.$text1.css("line-size", "4em");
                        graphicsClicked.$text2.css("font-size", labelFontSize.large + "pt");
                        graphicsClicked.$text2.css("line-size", "4em");
                        graphicsClicked.$image.css("height", picture.large.height + "px");
                        graphicsClicked.$image.css("width", picture.large.width + "px");

                        graphicsClicked.$image.attr("height", picture.large.height);
                        graphicsClicked.$image.attr("width", picture.large.width);


                        if (graphicsClicked.$text1.attr('data-size-large') != 'Y') {
                            graphicsClicked.$text1.attr('x', parseInt(graphicsClicked.$text1.attr('x')) + 7);
                            graphicsClicked.$text2.attr('x', parseInt(graphicsClicked.$text2.attr('x')) + 7);
                            graphicsClicked.$text1.attr('y', parseInt(graphicsClicked.$text1.attr('y')) + 7);
                            graphicsClicked.$text2.attr('y', parseInt(graphicsClicked.$text2.attr('y')) + 7);
                            graphicsClicked.$text1.attr('data-size-large', 'Y');
                        }
                    } else {
                        //console.log('smaller');
                        var oldMatrix = graphicsClicked.$path.attr("transform").replace(/ scale\(1\.5\) translate\(0 -4\)/g, '').replace(/ scale\(1\.5\) translate\(0,-4\)/g, '');
                        graphicsClicked.$path.attr("transform", oldMatrix);


                        graphicsClicked.$text1.css("font-size", labelFontSize.small + "pt");
                        graphicsClicked.$text2.css("font-size", labelFontSize.small + "pt");
                        graphicsClicked.$image.css("height", picture.small.height + "px");
                        graphicsClicked.$image.css("width", picture.small.width + "px");

                        graphicsClicked.$image.attr("height", picture.small.height);
                        graphicsClicked.$image.attr("width", picture.small.width);

                        if (graphicsClicked.$text1.attr('data-size-large') === 'Y') {
                            graphicsClicked.$text1.attr('x', parseInt(graphicsClicked.$text1.attr('x')) - 7);
                            graphicsClicked.$text2.attr('x', parseInt(graphicsClicked.$text2.attr('x')) - 7);
                            graphicsClicked.$text1.attr('y', parseInt(graphicsClicked.$text1.attr('y')) - 7);
                            graphicsClicked.$text2.attr('y', parseInt(graphicsClicked.$text2.attr('y')) - 7);
                            graphicsClicked.$text1.attr('data-size-large', 'N');
                        }
                    }
                }

                function graphicsMouseOutHandler(evt) {
                    var graphicsClicked = getGraphicsFromEvent(evt);
                    //event.stop(evt);
                    resizeGraphics(graphicsClicked, 'smaller');
                    $('.overLayInfo').remove();

                };


                //$('#' + feedID + '_layer').append(graphicsClicked.$path);
                //$('#' + feedID + '_layer').append(graphicsClicked.$image);
                //$('#' + feedID + '_layer').append(graphicsClicked.$text1);
                //$('#' + feedID + '_layer').append(graphicsClicked.$text2);

                function addHoverBox(graphicsClicked) {
                    //  $(document).append("<div style='height:100px;width:100px;position:fixed;z-index:999999;background-color:blue;'>TEST</div>");
                    return;
                    var left = graphicsClicked.$path.position().left;
                    var top = graphicsClicked.$path.position().top;
                    var height = '40'; //graphicsClicked.$path[0].getBBox().height;
                    var width = '140'; //graphicsClicked.$path[0].getBBox().wdith;
                    var color = colors.Blue;
                    var border = "1 px solid blue;";
                    var style = 'color:white;height:' + height + 'px;width:' + width + 'px;position:fixed;z-index:999999;background-color:' + color + ';left:' + left + 'px;top:' + top + 'px;' + border;
                    var textContent = 'Pelorus at Daltons';
                    var t1 = graphicsClicked.$text1.text();
                    var t2 = graphicsClicked.$text2.text();
                    textContent = t1 + "<br/>" + t2;
                    $('body').append("<div class='overLayInfo' style='" + style + "'>" + textContent + "</div>");
                }


                function graphicsMouseOverHandler(evt) {
                    //event.stop(evt);
                    //var graphicsClicked = getGraphicsFromEvent(evt);
                    var graphicsClicked = getGraphicsFromEvent(evt);


                    //ONLY IF ON MOBILE!
                    if (floodwatchIsMobile) {
                        graphicClickEventHandler(evt, { zoomTo: false });
                    }



                    //var graphicsClickedJQuery = {
                    //    $text1: $(graphicsClicked.$text1),
                    //    $text2: $(graphicsClicked.$text2),
                    //    $image: $(graphicsClicked.$image),
                    //    $path: $(graphicsClicked.$path)
                    //}

                    //resizeGraphics(graphicsClickedJQuery, 'larger');


                    var graphicsLayer = '#graphicsLayer5_layer';
                    graphicsLayer = '#' + feedID + '_layer';
                    var glSVG = $(graphicsLayer);
                    //dojo.disconnect(map_onMouseOut_handle);
                    //map_onMouseOut_handle = dojo.connect(gl, "onMouseOut", graphicsMouseOutHandler);

                    var refNode = query('#' + feedID + '_layer');
                    var pos = 'last';
                    //To Dojo Style

                    //dojo.place(graphicsClicked.$path.clone(true)[0], refNode[0], pos);
                    //dojo.place(graphicsClicked.$image.clone(true)[0], refNode[0], pos);
                    //dojo.place(graphicsClicked.$text1.clone(true)[0], refNode[0], pos);
                    //dojo.place(graphicsClicked.$text2.clone(true)[0], refNode[0], pos);

                    //dojo.connect(gl, "onClick", graphicClickEventHandler);
                    //var mouseOverHanlder = gl.on("mouse-over", graphicsMouseOverHandler);
                    //var mouseOutHanlder = gl.on("mouse-out", graphicsMouseOutHandler);


                    $('#' + feedID + '_layer').append(graphicsClicked.$path);
                    $('#' + feedID + '_layer').append(graphicsClicked.$image);
                    $('#' + feedID + '_layer').append(graphicsClicked.$text1);
                    $('#' + feedID + '_layer').append(graphicsClicked.$text2);

                    //addHoverBox(graphicsClicked);


                    //dojo.connect(gl, "onClick", graphicClickEventHandler);

                    //document.getElementById(feedID + '_layer').appendChild(graphicsClicked.$path);
                    //document.getElementById(feedID + '_layer').appendChild(graphicsClicked.$image);
                    //document.getElementById(feedID + '_layer').appendChild(graphicsClicked.$text1);
                    //document.getElementById(feedID + '_layer').appendChild(graphicsClicked.$text2);


                }

                window.graphicsMouseOverHandler = graphicsMouseOverHandler;

                //var map_onMouseOut_handle = dojo.connect(gl, "onMouseOut", graphicsMouseOutHandler);

                //on(gl, touch.press, function() { alert('Touched'); });


                //function graphicClickEventHandlerdelayed(evt) {
                //    setTimeout(graphicClickEventHandler, 100, evt);

                //}


                function pretendClick() {

                    //alert('click');
                    $('#riverFlow_layer').trigger("click", arguments);


                }
                // dojo.connect(gl, "onClick", graphicClickEventHandler);

                var mouseOverHanlder = gl.on("mouse-over", graphicsMouseOverHandler);
                var mouseOutHanlder = gl.on("mouse-out", graphicsMouseOutHandler);
                var c = gl.on("mouse-up", graphicClickEventHandler);
                //var c = gl.on("click", graphicClickEventHandler);

                //var mousedOutHanlder = gl.on("mouse-down", pretendClick);
                //dojo.connect(gl, "onMouseOver", graphicsMouseOverHandler);

                //dojo.connect(gl, "onMouseOut", graphicsMouseOutHandler);


                //gl.on("mouse-out", graphicsMouseOutHandler);


                window.mdcgl = gl;

                map.addLayer(gl);


                var currentWindowAttributes;
                if (isInfoWindowOpenAlready) {
                    var feature = map.infoWindow.getSelectedFeature();
                    if (feature) {
                        currentWindowAttributes = feature.attributes;
                    } else {
                        var title = $('#showInfo #titeBar').text();
                        title = title.substring(0, title.indexOf('-') - 1);
                        currentWindowAttributes = {
                            title: title

                        }
                    }

                }


                positionArray.forEach(function (item, idx) {

                    var site = item;
                    var pt = new Point(site.position.easting, site.position.northing, sr);
                    //Box

                    var graphicsList = createGraphics(site, pt, feedID);

                    if (isInfoWindowOpenAlready && currentWindowAttributes.title == site.title) {
                        //Update Info Window
                        updateSiteInfoWindows(site);
                        //map.infoWindow.setContent(graphicsList.infoTemplate.content);
                        //map.infoWindow.setTitle(graphicsList.infoTemplate.title);
                        //function callback(src) {
                        //    console.log('src updated');


                        //    //Remove
                        //    //$('#showInfo').show();
                        //    $('#imageReplace').attr('src', src);
                        //    console.log('replacing imaage');
                        //}
                        //getGraph(site, callback);
                    }





                    gl.add(graphicsList.labelBoxGraphic);
                    gl.add(graphicsList.labelPointGraphic);
                    gl.add(graphicsList.labelTextPointGraphic);
                    gl.add(graphicsList.labelTextPointGraphicNeLine);
                });
                if (isInfoWindowOpenAlready) {
                    map.infoWindow.hide();
                    map.infoWindow.show();
                }
                //console.log('Loaded Data for: ' + feedID);

            });
        };

        //window.loadSiteLabels = loadSiteLabels;

        //function addGraphic(graphic) {
        //    var SVGRect = graphic.node.getBBox();
        //    var rect = document.createElementNS("http://www.w3.org/2000/svg",
        //    "rect");
        //    rect.setAttribute("x", SVGRect.x);
        //    rect.setAttribute("y", SVGRect.y);
        //    rect.setAttribute("width", SVGRect.width);
        //    rect.setAttribute("height", SVGRect.height);
        //    rect.setAttribute("fill", "yellow");
        //    domConstruct.place(rect, graphic.node, "before");
        //}


        var feedList = ["RiverFlow", "RiverLevel", "Rainfall1Hour", "Rainfall2Hour", "Rainfall6Hour", "Rainfall12Hour", "Rainfall24Hour"];

        var feeds = {
            RiverFlow: { id: "RiverFlow", url: rssFeedRiverFlow },
            RiverLevel: { id: "RiverLevel", url: rssFeedRiverLevel },
            Rainfall1Hour: { id: "Rainfall1Hour", url: rssFeedRainfall.replace('{HOUR}', 1) },
            Rainfall2Hour: { id: "Rainfall2Hour", url: rssFeedRainfall.replace('{HOUR}', 2) },
            Rainfall6Hour: { id: "Rainfall6Hour", url: rssFeedRainfall.replace('{HOUR}', 6) },
            Rainfall12Hour: { id: "Rainfall12Hour", url: rssFeedRainfall.replace('{HOUR}', 12) },
            Rainfall24Hour: { id: "Rainfall24Hour", url: rssFeedRainfall.replace('{HOUR}', 24) }
        }

        function loadMapAndGraphics() {
            //after map loads, connect to listen to mouse move & drag events
            //map.on('labels', 'graphic-node-add', function(graphic) {
            //    addGraphic(graphic);
            //});

            if (window.location.hash === "#layerOn") {
                //Turn layer window on.
                $('#Layers').addClass('active');
            }

            var handle = query(".title", map.infoWindow.domNode)[0];
            var dnd = new Moveable(map.infoWindow.domNode, {
                handle: handle
            });

            on(dnd, 'FirstMove', function () {
                // hide pointer and outerpointer (used depending on where the pointer is shown)
                var arrowNode = query(".outerPointer", map.infoWindow.domNode)[0];
                domClass.add(arrowNode, "hidden");

                var arrowNode = query(".pointer", map.infoWindow.domNode)[0];
                domClass.add(arrowNode, "hidden");
            }.bind(this));


            map.infoWindow.hide();

            //if (!rssFeedRiverFlow || !rssFeedRiverLevel) {
            //    alert('error');
            //}

            //$('#bs-example-navbar-collapse-1 a.dropdown-toggle').click(function (e) {
            //    e.preventDefault();
            //    $('.tab-pane.active').removeClass('active');

            //});

            //Sub Menu links do nothing
            //$('#bs-example-navbar-collapse-1 a.dropdown-toggle').closest('li.dropdown').find('>ul').click(function (e) {
            //    $(this).closest('.dropdown').addClass('open');
            //    //return false;
            //});

            $('#rainfallSwitch').on('change', function () {
                $('#rainfallOptions').toggle();
            });

            $('#bs-example-navbar-collapse-1 a.tab').click(function (e) {
                e.preventDefault();


                if ($($(this).attr('href')).hasClass('active')) {
                    $($(this).attr('href')).removeClass('active');
                } else {
                    $('.tab-pane.active').removeClass('active');
                    $($(this).attr('href')).addClass('active');
                }



            });



            //$('#bs-example-navbar-collapse-1 a.tab').click(function (e) {
            //    e.preventDefault();

            //    $('.tab-pane.active').removeClass('active');
            //    $(this).tab('show');
            //    //$('li.active').removeClass('active');
            //});


            $('.close').on("click",
                function (item) {
                    $('.tab-pane.active').removeClass('active');
                }
                );

            $('#closeGraph').on("click", function () {
                map.infoWindow.hide();
                $('#showInfo').hide();

            });

            loadSiteLabels(feeds.RiverFlow.url, feeds.RiverFlow.id, function (myExtent) {

                var startExtent = new Extent(myExtent.min.X, myExtent.min.Y, myExtent.max.X, myExtent.max.Y,
                        globalSpatialReference);


                var startExtent = new Extent();
                startExtent.xmin = myExtent.min.X;
                startExtent.ymin = myExtent.min.Y;
                startExtent.xmax = myExtent.max.X;
                startExtent.ymax = myExtent.max.Y;
                startExtent.spatialReference = sr;
                window.startExtent = startExtent;
                ;
                map.setExtent(startExtent.expand(1.2));

            });




        }

        var loadMapAndGraphicsHanlder = map.on("load", loadMapAndGraphics);

        //function unloadHandler() {
        //    loadMapAndGraphicsHanlder.remove();
        //    myUnload.remove();
        //}
        //var myUnload = map.on("unload", unloadHandler);

        ///*  Home Button & Scale Bar */
        var home = new HomeButton({
            map: map,
            center: [1679000, 5402000],
            zoom: 14
        }, "HomeButton");
        home.startup();

        var elems = Array.prototype.slice.call(document.querySelectorAll('.js-switch'));

        elems.forEach(function (html) {
            var switchery = new Switchery(html);
        });


       


        $('li input').change(function (evt) {

            var feedId = $(this).attr('data-feed-id');
            map.infoWindow.hide();

            //If Rainfall checkBox set current feed to radio box below
            if (feedId === 'rainfall') {
                var currentRainFallSelected = $(this).closest('li').find('[type="radio"]:checked').attr('data-feed-id');

                feedId = currentRainFallSelected;


                var rainfallGraphicsLayers = $(this).closest('ul').find('[type="radio"]');

                //Turn off all rainfall layers
                rainfallGraphicsLayers.each(function (idx, item) {
                    var curLayer = map.getLayer($(item).attr('data-feed-id'));
                    if (curLayer) {
                        curLayer.setVisibility(false);
                    }
                });

            }

            //If radio box turn off other feeds
            if (feedId.match(/rainfall*/i)) {
                var currentRainFallSelected = $(this).closest('li').find('[type="radio"]:checked').attr('data-feed-id');

                feedId = currentRainFallSelected;


                var rainfallGraphicsLayers = $(this).closest('ul').find('[type="radio"]');

                //Turn off all rainfall layers
                rainfallGraphicsLayers.each(function (idx, item) {
                    var curLayer = map.getLayer($(item).attr('data-feed-id'));
                    if (curLayer) {
                        curLayer.setVisibility(false);
                    }
                });

            }


            var graphicsLayer = map.getLayer(feedId);


            if (!graphicsLayer && $(this).val()) {
                var newFeed = feeds[feedId];
                loadSiteLabels(newFeed.url, newFeed.id);
                return;
            }

            if ($(this).prop('checked')) {
                //turn on layer
                graphicsLayer.setVisibility(true);
            } else {
                //turn off layer
                graphicsLayer.setVisibility(false);
            }
        });


        function hillTopDate(fromDate, isDaylightSavings, minusHalf) {
            var Day = fromDate.getUTCDate();
            var Month = fromDate.getUTCMonth() + 1; //Zero Based??
            var Year = fromDate.getUTCFullYear();
            var Hour = fromDate.getUTCHours();
            var Minute = fromDate.getUTCMinutes();
            var amPM = " a.m.";

            if (isDaylightSavings) {
                Hour = Hour + 1;
            }

            var val = Day + '/' + Month + '/' + Year + ' ' + Hour + ':' + Minute + amPM;;
            return val;
        }


        function getGraph(site, callback) {
            //var riverFlowXML = riverFlowXMLTemplate.replace('{SITE_NAME}', site.title).replace('{MEASUREMENT}', site.);
            var FromDate = new moment().utc().add(-12, 'hours');
            var ToDate = moment().utc().add(24, 'hours');



            var utcDateFromHandleDaylightSavings = FromDate.format("D/M/YYYY h:mm a").replace('am', 'a.m.').replace('pm', 'p.m.');
            var utcDateTOHandleDaylightSavings = ToDate.format("D/M/YYYY h:mm a").replace('am', 'a.m.').replace('pm', 'p.m.');;

            var riverFlowXML = riverFlowXMLTemplateGifGen.replace('{SITE_AXIS}', site.hilltopXML.axis);
            riverFlowXML = riverFlowXML.replace('{UTC_FROM_DAYLIGHT_SAVINGS}', utcDateFromHandleDaylightSavings);
            riverFlowXML = riverFlowXML.replace('{UTC_TO_DAYLIGHT_SAVINGS}', utcDateTOHandleDaylightSavings);
            riverFlowXML = riverFlowXML.replace('{SITE_TRACES}', site.hilltopXML.traces);
            riverFlowXML = riverFlowXML.replace('{SITE_THRESHOLDS}', site.hilltopXML.thresholds);

            //IE returns some XML with case changed!!!! So we need to fix it as hilltop has case sensitivity for some tags!!
            riverFlowXML = riverFlowXML.replace(/<([a-z])/g, function (v) { return v.toUpperCase(); }).replace(/<\/([a-z])/g, function (v) { return v.toUpperCase(); }); //Thanks IE


            $.ajax({
                url: gifgenURL, //hilltopURL
                type: "POST",
                data: riverFlowXML,
                success: function (n) {
                    //console.log('Successfully retrieved graph');
                    //console.log(n);
                    //alert('Graph Loaded:' + n);
                    callback(n);
                    //window.hilltopSource = n;
                    //$('#imageReplace2').attr("src", n);
                },
                error: function (n, t) {
                    console.log(t);
                }
            });

        }

        //window.getGraph = getGraph;


        function refreshMapData() {
            //Which Layers are pre loaded?

            feedList.forEach(function (item) {
                var feedItem = feeds[item];
                var graphicsLayer = map.getLayer(feedItem.id);

                if (graphicsLayer) {
                    loadSiteLabels(feedItem.url, feedItem.id);
                }
            });
        }

        function startTimer(duration, display, doAction) {

            var timer = duration, minutes, seconds;
            setInterval(function () {
                minutes = parseInt(timer / 60, 10);
                seconds = parseInt(timer % 60, 10);

                minutes = minutes < 10 ? "0" + minutes : minutes;
                seconds = seconds < 10 ? "0" + seconds : seconds;

                display.text('Refresh in: ' + minutes + ":" + seconds);

                if (--timer < 0) {
                    timer = duration;
                    doAction();
                }
            }, 1000);
        }

        var fiveMinutes = 60 * 5,
             displayNode = $('div.timer span');
        startTimer(fiveMinutes, displayNode, refreshMapData);

        window.refreshMapData = refreshMapData;

        //function getMapWidthHeight() {
        //    alert("Width = " + map.width + "; Height = " + map.height);
        //};
    });
