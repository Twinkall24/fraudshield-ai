import React, { useEffect, useRef } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import * as d3 from 'd3';

interface TimeHeatmapProps {
  data: number[][];
}

export const TimeHeatmap: React.FC<TimeHeatmapProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 50, right: 30, bottom: 70, left: 70 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Days of week
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Hours of day
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Create scales
    const x = d3.scaleBand().range([0, width]).domain(hours.map(String)).padding(0.05);

    const y = d3.scaleBand().range([height, 0]).domain(days).padding(0.05);

    // Color scale
    const maxValue = d3.max(data.flat()) || 100;
    const colorScale = d3
      .scaleSequential()
      .interpolator(d3.interpolateReds)
      .domain([0, maxValue]);

    // Add X axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'middle')
      .style('font-size', '12px');

    // X axis label
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Hour of Day');

    // Add Y axis
    svg.append('g').call(d3.axisLeft(y)).selectAll('text').style('font-size', '12px');

    // Y axis label
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Day of Week');

    // Create tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 10000);

    // Add cells
    svg
      .selectAll()
      .data(
        data.flatMap((row, dayIndex) =>
          row.map((value, hourIndex) => ({
            day: days[dayIndex],
            hour: hourIndex,
            value,
          }))
        )
      )
      .enter()
      .append('rect')
      .attr('x', (d) => x(String(d.hour)) || 0)
      .attr('y', (d) => y(d.day) || 0)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .style('fill', (d) => colorScale(d.value))
      .style('stroke', 'white')
      .style('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).style('stroke', '#333').style('stroke-width', 2);

        tooltip
          .style('opacity', 1)
          .html(
            `<strong>${d.day} ${d.hour}:00</strong><br/>Fraud Rate: ${d.value.toFixed(1)}%`
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px');
      })
      .on('mousemove', function (event) {
        tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 10 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).style('stroke', 'white').style('stroke-width', 1);
        tooltip.style('opacity', 0);
      });

    // Add title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Fraud Patterns by Time');

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, [data]);

  return (
    <Paper sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Time-based Fraud Heatmap
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Darker colors indicate higher fraud rates at specific times
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <svg ref={svgRef}></svg>
      </Box>
    </Paper>
  );
};