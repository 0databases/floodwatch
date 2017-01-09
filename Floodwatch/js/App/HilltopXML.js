var riverFlowXMLTemplate = '<HilltopImage>' +
    '  <Size X="500" Y="400" />' +
    '  <Format>GIF</Format>' +
    '  <BackgroundColour>White</BackgroundColour>' +
    '  <Graph>' +
    '    <Labels>' +
    '      <TraceLabel>' +
    '        <Text>%measurement% at %site% (Plot ends %ftime%)</Text>' +
    '      </TraceLabel>' +
    '    </Labels>' +
    '    <Axes>' +
    '      <Axis Direction="Horizontal">' +
    '        <From>29/02/2016 8:43 a.m.</From>' +
    '        <To>1/03/2016 8:43 p.m.</To>' +
    '        <TickSpacing>6 Hours</TickSpacing>' +
    '      </Axis>' +
    '      <Axis Direction="Vertical" AxisNumber="0">' +
    '        <Min>0</Min>' +
    '        <Max>3000</Max>' +
    '      </Axis>' +
    '    </Axes>' +
    '    <Traces>' +
    '      <Trace Site="{SITE_NAME}" Measurement="Simulated Flow" AxisNumber="0">' +
    '        <Pen>' +
    '          <Colour>Blue</Colour>' +
    '          <Thickness>2</Thickness>' +
    '        </Pen>' +
    '      </Trace>' +
    '    </Traces>' +
    '    <Thresholds>' +
    '      <Line Value="0.0000" Colour="Black" Title="" />' +
    '      <Region Min="0.0000" Max="1200.0000" Colour="White" />' +
    '      <Line Value="1200.0000" Colour="Black" Title="2 year flood" />' +
    '      <Region Min="1200.0000" Max="1500.0000" Colour="Light Yellow" />' +
    '      <Line Value="1500.0000" Colour="Black" Title="4 year flood, road closed at Daltons culvert" />' +
    '      <Region Min="1500.0000" Max="2450.0000" Colour="Light Orange" />' +
    '      <Line Value="2450.0000" Colour="Black" Title="30 year flood eg Jul 2012" />' +
    '      <Region Min="2450.0000" Max="3000.0000" Colour="Rose" />' +
    '    </Thresholds>' +
    '  </Graph>' +
    '</HilltopImage>';


var riverFlowXMLTemplateGifGen = '<HilltopImage>' +
    '  <Size X="500" Y="400" />' +
    '<Format>GIF' +
    '</Format>' +
    '<BackgroundColour>White' +
    '</BackgroundColour>' +
    '<Graph>' +
    '<AxisColour>Black' +
    '</AxisColour>' +
    '<InnerBackgroundColour>Pale Sky Blue' +
    '</InnerBackgroundColour>' +
    '<AltInnerBackgroundColour>#eeeeff' +
    '</AltInnerBackgroundColour>' +
    '<GraticuleColour>Blue' +
    '</GraticuleColour>' +
    '<Labels>' +
        '<TraceLabel>' +
            '<Text>%measurement% at %site% (Plot ends %ftime%)' +'</Text>' +
        '</TraceLabel>' +
    '</Labels>' +
    '<Axes>' +
    '<Axis Direction="Horizontal">' +
    '<From>{UTC_FROM_DAYLIGHT_SAVINGS}</From>' +
    '<To>{UTC_TO_DAYLIGHT_SAVINGS}</To>' +
        '<TickSpacing>6 Hours</TickSpacing>' +
      '</Axis>' +
    '{SITE_AXIS}' +
    '</Axes>' +
    '{SITE_TRACES}' +
    '{SITE_THRESHOLDS}' +
    '</Graph>' +
    '</HilltopImage>';


var riverLevelXMLTemplateGifGen = '<HilltopImage>' +
    '<Size X="500" Y="400" />' +
    '<Format>GIF</Format>' +
    '<BackgroundColour>White</BackgroundColour>' +
    '<Graph>' +
    '<Labels>' +
    '<TraceLabel>' +
    '<Text>%measurement% at %site% (Plot ends %ftime%)</Text>' +
    '</TraceLabel>' +
    '</Labels>' +
    '<Axes>' +
    '<Axis Direction="Horizontal">' +
    '<From>{UTC_FROM_DAYLIGHT_SAVINGS}</From>' +
    '<To>{UTC_TO_DAYLIGHT_SAVINGS}</To>' +
    '<TickSpacing>6 Hours</TickSpacing>' +
    '</Axis>' +
    '{SITE_AXIS}' +
    '</Axes>' +
    '{SITE_TRACES}' +
    '{SITE_THRESHOLDS}' +
    '</Graph>' +
    '</HilltopImage>';