import React, { useEffect, useRef } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import * as d3 from 'd3';

interface ScoreDistributionProps {
  data: number[];
}

export const ScoreDistribution: React.FC<ScoreDistributionProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create histogram
    const histogram = d3
      .histogram()
      .domain([0, 1])
      .thresholds(20);

    const bins = histogram(data);

    // Scales
    const x = d3.scaleLinear().domain([0, 1]).range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (d) => d.length) || 0])
      .range([height, 0]);

    // X axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((d) => `${(+d * 100).toFixed(0)}%`));

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Fraud Score');

    // Y axis
    svg.append('g').call(d3.axisLeft(y));

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Frequency');

    // Color scale
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 0.3, 0.7, 1])
      .range(['#4caf50', '#8bc34a', '#ff9800', '#f44336']);

    // Bars
    svg
      .selectAll('rect')
      .data(bins)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d.x0 || 0) + 1)
      .attr('y', height)
      .attr('width', (d) => Math.max(0, x(d.x1 || 0) - x(d.x0 || 0) - 2))
      .attr('height', 0)
      .attr('fill', (d) =>colorScale(((d.x0 ?? 0) + (d.x1 ?? 0)) / 2))      .attr('opacity', 0.8)
      .on('mouseover', function () {
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.8);
      })
      .transition()
      .duration(800)
      .attr('y', (d) => y(d.length))
      .attr('height', (d) => height - y(d.length));

    // Add threshold line at 0.7
    svg
      .append('line')
      .attr('x1', x(0.7))
      .attr('x2', x(0.7))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#f44336')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    svg
      .append('text')
      .attr('x', x(0.7))
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#f44336')
      .style('font-weight', 'bold')
      .text('Fraud Threshold');
  }, [data]);

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Fraud Score Distribution
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Histogram showing distribution of fraud scores across all transactions
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <svg ref={svgRef}></svg>
      </Box>
    </Paper>
  );
};