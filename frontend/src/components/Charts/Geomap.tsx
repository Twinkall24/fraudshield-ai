import React, { useEffect, useRef } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import * as d3 from 'd3';

interface GeoDataPoint {
  city: string;
  country: string;
  lat: number;
  lng: number;
  fraudCount: number;
  totalCount: number;
}

interface GeoMapProps {
  data: GeoDataPoint[];
}

export const GeoMap: React.FC<GeoMapProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create projection (simple world map)
    const projection = d3
      .geoMercator()
      .scale(140)
      .center([0, 20])
      .translate([width / 2, height / 2]);

    // Draw world map background
    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#ccc');

    // Add grid lines
    const gridLines = d3.range(-180, 181, 30);
    svg
      .selectAll('.grid-line')
      .data(gridLines)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', (d) => projection([d, -90])?.[0] || 0)
      .attr('y1', (d) => projection([d, -90])?.[1] || 0)
      .attr('x2', (d) => projection([d, 90])?.[0] || 0)
      .attr('y2', (d) => projection([d, 90])?.[1] || 0)
      .attr('stroke', '#ddd')
      .attr('stroke-width', 0.5);

    // Size scale for bubbles
    const maxTotal = d3.max(data, (d) => d.totalCount) || 100;
    const radiusScale = d3.scaleSqrt().domain([0, maxTotal]).range([5, 40]);

    // Color scale based on fraud rate
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 0.5, 1])
      .range(['#4caf50', '#ff9800', '#f44336']);

    // Create tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '12px')
      .style('border-radius', '4px')
      .style('font-size', '13px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 10000);

    // Add bubbles for each location
    const bubbles = svg
      .selectAll('.bubble')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'bubble')
      .attr('transform', (d) => {
        const coords = projection([d.lng, d.lat]);
        return `translate(${coords?.[0] || 0},${coords?.[1] || 0})`;
      });

    // Add circles
    bubbles
      .append('circle')
      .attr('r', 0)
      .attr('fill', (d) => {
        const fraudRate = d.fraudCount / d.totalCount;
        return colorScale(fraudRate);
      })
      .attr('opacity', 0.6)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 0.9).attr('stroke-width', 3);

        const fraudRate = ((d.fraudCount / d.totalCount) * 100).toFixed(1);
        tooltip
          .style('opacity', 1)
          .html(
            `
            <strong>${d.city}, ${d.country}</strong><br/>
            Total Transactions: ${d.totalCount}<br/>
            Fraud Detected: ${d.fraudCount}<br/>
            Fraud Rate: <strong style="color: #ff9800">${fraudRate}%</strong>
          `
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px');
      })
      .on('mousemove', function (event) {
        tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 10 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.6).attr('stroke-width', 2);
        tooltip.style('opacity', 0);
      })
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .attr('r', (d) => radiusScale(d.totalCount));

    // Add location labels for major cities
    bubbles
      .filter((d) => d.totalCount > 20)
      .append('text')
      .attr('dy', (d) => radiusScale(d.totalCount) + 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text((d) => d.city);

    // Add legend
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 20)`);

    legend
      .append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Fraud Rate');

    const legendData = [
      { color: '#4caf50', label: 'Low (0-30%)' },
      { color: '#ff9800', label: 'Medium (30-70%)' },
      { color: '#f44336', label: 'High (70-100%)' },
    ];

    legendData.forEach((item, i) => {
      const legendRow = legend.append('g').attr('transform', `translate(0, ${i * 20 + 15})`);

      legendRow.append('circle').attr('cx', 6).attr('cy', 6).attr('r', 6).attr('fill', item.color);

      legendRow
        .append('text')
        .attr('x', 20)
        .attr('y', 10)
        .style('font-size', '11px')
        .text(item.label);
    });

    // Add bubble size legend
    const sizeLegend = svg
      .append('g')
      .attr('class', 'size-legend')
      .attr('transform', `translate(20, ${height - 80})`);

    sizeLegend
      .append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Transaction Volume');

    const sizes = [10, 50, 100];
    sizes.forEach((size, i) => {
      const radius = radiusScale(size);
      sizeLegend
        .append('circle')
        .attr('cx', i * 60 + 30)
        .attr('cy', 40)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', '#666')
        .attr('stroke-width', 1);

      sizeLegend
        .append('text')
        .attr('x', i * 60 + 30)
        .attr('y', 60)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .text(size);
    });

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [data]);

  return (
    <Paper sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Geographic Fraud Distribution
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Bubble size represents transaction volume, color indicates fraud rate
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <svg ref={svgRef}></svg>
      </Box>
    </Paper>
  );
};