import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
// https://www.d3-graph-gallery.com/graph/line_confidence_interval.html

interface Area {
  x: number;
  y0: number;
  y1: number;
}
interface Line {
  x: number;
  y: number;
}

export interface ChartData {
  lines: { data: Line[] }[];
  areas: { opacity?: number; data: Area[] }[];
  title: string;
}

interface SelectedPoints {
  allLines: Line[];
  allAreas: Area[];
  allPoints: (Line | Area)[];
}

interface IProps {
  data: ChartData;
  options: {
    yDomain: [number, number];
    xDomain: [number, number];
    yTickFormat?: any;
    xTickFormat?: any;
  };
  calloutMessage?: {
    (selected: SelectedPoints): {
      text: string;
      yCallout?: number;
      xCallout?: number;
    };
  };
}

interface ChartElements {
  svg: d3.Selection<SVGGElement, unknown, null, undefined>;
  dataArea: d3.Selection<SVGGElement, unknown, null, undefined>;
  title: d3.Selection<SVGTextElement, unknown, null, undefined>;
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
  areas: d3.Selection<SVGPathElement, Area[], null, undefined>[];
  lines: d3.Selection<SVGPathElement, Line[], null, undefined>[];
}
type GenericSelection = d3.Selection<any, any, any, any>;

export const Chart = (props: IProps) => {
  const d3Container = useRef(null);

  // set the dimensions and margins of the graph
  const margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 380 - margin.left - margin.right,
    height = 360 - margin.top - margin.bottom;

  const [chartElements, setChartElements] = useState(
    null as ChartElements | null
  );

  useEffect(() => {
    if (chartElements?.svg) chartElements.svg.remove();

    // append the svg object to the body of the page
    const newSvg = d3
      .select(d3Container.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    newSvg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "rgba(0,0,0,0)");

    const dataArea = newSvg.append("g");

    // Add X axis --> it is a date format
    const x = d3.scaleLinear().domain(props.options.xDomain).range([0, width]);
    newSvg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickFormat(props.options.xTickFormat));

    // Add Y axis
    const y = d3.scaleLinear().domain(props.options.yDomain).range([height, 0]);
    newSvg
      .append("g")
      .call(d3.axisLeft(y).tickFormat(props.options.yTickFormat));

    // add the title
    const title = newSvg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 0 + margin.top)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(props.data.title);

    // add the hover callout
    const bisect = (mouse: [number, number]): SelectedPoints => {
      // mouse = [x,y] coordinates of the mouse

      const allXvalues = new Set<number>();
      props?.data?.areas?.forEach((item) =>
        item.data.forEach((point) => allXvalues.add(point.x))
      );
      props?.data?.lines?.forEach((item) =>
        item.data.forEach((point) => allXvalues.add(point.x))
      );

      let closestX = 0;
      const xPos = x.invert(mouse[0]);
      Array.from(allXvalues).forEach((xValue) => {
        if (closestX === 0) closestX = xValue;
        if (Math.abs(xPos - xValue) < Math.abs(xPos - closestX))
          closestX = xValue;
      });

      const allLines = [] as Line[];
      const allAreas = [] as Area[];
      props?.data?.areas?.forEach((item) =>
        item.data.forEach(
          (point) => point.x === closestX && allAreas.push(point)
        )
      );
      props?.data?.lines?.forEach((item) =>
        item.data.forEach(
          (point) => point.x === closestX && allLines.push(point)
        )
      );

      return {
        allAreas,
        allLines,
        allPoints: [...allAreas, ...allLines],
      };
    };

    const callout = (g: GenericSelection, value: string) => {
      if (!value) return g.style("display", "none");

      g.style("display", null)
        .style("pointer-events", "none")
        .style("font", "10px sans-serif");

      const path = g
        .selectAll("path")
        .data([null])
        .join("path")
        .attr("fill", "white")
        .attr("stroke", "black");

      const text = g
        .selectAll("text")
        .data([null])
        .join("text")
        .call((text) =>
          text
            .selectAll("tspan")
            .data((value + "").split(/\n/))
            .join("tspan")
            .attr("x", 0)
            .attr("y", (d, i) => `${i * 1.1}em`)
            .style("font-weight", (_, i) => (i ? null : "bold"))
            .text((d) => d)
        );

      const { y, width: w, height: h } = (text as any).node().getBBox();

      text.attr("transform", `translate(${-w / 2},${-27 - y})`);
      /*
      m 185 189
      h 62
      l 5 5
      l 5 -5
      h 62
      v -32
      h -135
      z

      */
      path.attr(
        "d",
        `M${-w / 2 - 10},-5H-5l5,5l5,-5H${w / 2 + 10}v-${h + 20}h-${w + 20}z`
      );
    };

    const tooltip = newSvg.append("g");

    newSvg.on("touchmove mousemove", function (event) {
      const [mouseX, mouseY] = d3.pointer(event, this);
      const selectedPoints = bisect(mouseX);
      if (!selectedPoints.allPoints.length || !props.calloutMessage) return;

      const xPos = selectedPoints.allPoints[0]?.x;
      // const yPos = allLines[0]?.y;
      // const yMax = Math.max(...(allAreas || []).map(p => p.y1));
      // const yMin = Math.min(...(allAreas || []).map(p => p.y0));

      // const text = `Max ${yMax}, Min ${yMin}, value ${yPos}`;

      const { text, xCallout, yCallout } = props.calloutMessage(selectedPoints);

      tooltip
        .attr(
          "transform",
          `translate(${x(xCallout || xPos)},${
            yCallout ? y(yCallout) : mouseY
          })`
        )
        .call(callout, text);
    });

    newSvg.on("touchend mouseleave", () => tooltip.call(callout, null));

    // persist everything
    setChartElements({
      ...chartElements,
      svg: newSvg,
      dataArea,
      x,
      y,
      title,
      areas: [],
      lines: [],
    });
  }, [props.options]);

  useEffect(() => {
    setChartElements((chartElements) => {
      if (!chartElements) return chartElements;

      const { dataArea, x, y, areas, lines } = chartElements;
      const newAreas: typeof areas = [];
      const newLines: typeof lines = [];

      props.data.areas.forEach((area, idx) => {
        const elem = areas[idx] || dataArea.append("path");
        newAreas[idx] = elem;
        elem
          .datum(area.data)
          .attr("fill", "#cce5df")
          .attr("stroke", "none")
          .attr("opacity", area.opacity !== undefined ? area.opacity : 1)
          .attr(
            "d",
            d3
              .area<Area>()
              .x((d) => x(d.x))
              .y0((d) => y(d.y0))
              .y1((d) => y(d.y1))
          );
      });

      props.data.lines.forEach((line, idx) => {
        const elem = lines[idx] || dataArea.append("path");
        newLines[idx] = elem;
        elem
          .datum(line.data)
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr(
            "d",
            d3
              .line<Line>()
              .x((d) => x(d.x))
              .y((d) => y(d.y))
          );
      });

      for (let i = newAreas.length; i < areas.length; i++) areas[i].remove();
      for (let i = newLines.length; i < lines.length; i++) lines[i].remove();
      return { ...chartElements, areas: newAreas, lines: newLines };
    });
  }, [props.data, chartElements?.svg]);

  return (
    <>
      <svg
        className="d3-component"
        width={400}
        height={200}
        ref={d3Container}
      />
    </>
  );
};

// /* App */
// export const MyApp = () => {
//   return (
//     <div className="my-app">
//       <MyD3Component data={[1, 2, 3]} />
//     </div>
//   );
// };
