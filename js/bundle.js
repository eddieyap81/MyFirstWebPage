(function (topojson,d3) {
  'use strict';

  const loadAndProcessData = () =>

    Promise
  		.all([
      	d3.csv('https://vizhub.com/eddieyap81/datasets/UN_Medium_2019.csv'),
      	d3.json('https://unpkg.com/visionscarto-world-atlas@0.0.6/world/50m.json')
    	])
  		.then(([csvData, topoJSONdata]) => {

        const rowById = csvData.reduce((accumulator, d) => {
        	accumulator[d['Country code']] = d;
        	return accumulator;
      	}, {});

      	const countries = topojson.feature(topoJSONdata, topoJSONdata.objects.countries);

      	countries.features.forEach(d => {
        	Object.assign(d.properties, rowById[+d.id]);
      	});


        const featuresWithPopulation = countries.features
        	.filter(d =>d.properties['2020'])
        	.map(d => {
          	d.properties['2020'] = +d.properties['2020'].replace(/ /g,'')* 1000;
            return d;
          });


        return {
        features:	countries.features,
        featuresWithPopulation
             };

    });

  const sizeLegend = (selection, props) => {
    const {sizeScale,  //unpack
           spacing,
           textOffset,
           numTicks,
           tickFormat
          } = props;

    const ticks = sizeScale.ticks(numTicks)
    	.filter(d => d != 0)
    	.reverse();

    const groups = selection.selectAll('g').data(ticks);

    const groupsEnter = groups
    	.enter().append('g')
    		.attr('class', 'tick'); //enter statement

    groupsEnter
      .merge(groups) //update statement
    		.attr('transform', (d, i) =>
          `translate(0, ${i * spacing})`);

    groups.exit().remove();

    groupsEnter.append('circle') //enter statement
    	.merge(groups.select('circle')) //update statement
    		.attr('r', sizeScale);

    groupsEnter.append('text') //enter statement
    	.merge(groups.select('text')) //update statement
    		.attr('x', sizeScale(numTicks) + textOffset)
    		.attr('dy', '0.32em')
    		.text(d => tickFormat(d));
  };

  const svg = d3.select('svg');

  const projection = d3.geoNaturalEarth1();
  const pathGenerator = d3.geoPath().projection(projection);
  const radiusValue = d => d.properties['2020'];

  const g = svg.append('g');

  const colorLegendG = svg.append('g')
  	.attr('transform', `translate(50,250)`);

  g.append('path')
  	.attr('class', 'sphere')
  	.attr('d', pathGenerator({type: 'Sphere'}));

  svg.call(d3.zoom().on('zoom', () => {
  	g.attr('transform', d3.event.transform);
  }));

  const populationFormat = d3.format(',');

  loadAndProcessData().then(countries => {

    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(countries.features, radiusValue)])
    	.range([0,33]);

    g.selectAll('path').data(countries.features)
  		.enter().append('path')
    		.attr('class', 'country')
    		.attr('d', pathGenerator)
    		.attr('fill', d => d.properties['2020'] ? '#d8d8d8': '#fec1c1')
    	.append('title')
    		.text(d => isNaN(radiusValue(d))
        	? 'Missing Data'
          : [d.properties['Region, subregion, country or area *'],
            	populationFormat(radiusValue(d))
            ].join(': '));

    countries.featuresWithPopulation.forEach(d => {
    	d.properties.projected = projection(d3.geoCentroid(d));
    });


    g.selectAll('circle').data(countries.featuresWithPopulation)
  		.enter().append('circle')
    		.attr('class', 'country-circle')
    		.attr('cx', d => d.properties.projected[0])
        .attr('cy', d => d.properties.projected[1])
        .attr('r', d => sizeScale(radiusValue(d)));

    g.append('g')
    	.attr('transform', `translate(55,200)`)
    	.call(sizeLegend, {
    		sizeScale,
      	spacing: 45,
      	textOffset: 40,
      	numTicks: 5,
      	tickFormat: populationFormat
    	})
    	.append('text')
    		.attr('class', 'legend-title')
    		.text('Population')
    		.attr('y', -50)
    		.attr('x', -30);
  });

}(topojson,d3));
