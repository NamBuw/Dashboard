"use client";
import { useEffect, useRef } from "react";
import type { Network, Data, Node as VisNode, Edge as VisEdge } from "vis-network";
import type { GraphNode, GraphEdge } from "@/lib/kg-types";

interface Props {
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  onNodeClick: (node: GraphNode) => void;
}

export function BrowseGraphView({ graph, onNodeClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !graph) return;
    let net: Network | null = null;
    let destroyed = false;

    // Dynamic import: vis-network chạm DOM nên không thể import lúc SSR
    (async () => {
      const { Network } = await import("vis-network/standalone/esm/vis-network");
      if (destroyed || !ref.current) return;
      const data: Data = {
        nodes: graph.nodes as VisNode[],
        edges: graph.edges.map((e) => ({ from: e.from, to: e.to, dashes: e.dashes ?? false })) as VisEdge[],
      };
      net = new Network(ref.current, data, {
        nodes: { shape: "dot", font: { size: 14, color: "#e5e7eb" }, borderWidth: 2 },
        edges: {
          smooth: { enabled: true, type: "continuous", roundness: 0.5 },
          color: { color: "#475569" },
          arrows: "to",
        },
        physics: {
          forceAtlas2Based: { gravitationalConstant: -50, springLength: 100, springConstant: 0.08 },
          solver: "forceAtlas2Based",
          stabilization: { iterations: 150 },
        },
        // Cohesive palette aligned with --cat-* / chart-colors (canvas can't read CSS vars).
        groups: {
          root: { color: { background: "#3b6fe0", border: "#2e5cc4" } },
          bo_sach: { color: { background: "#4cc3e0", border: "#2ba8c8" } },
          subject: { color: { background: "#3fbf8e", border: "#2fa376" } },
          grade: { color: { background: "#e6a93a", border: "#c98f24" } },
          lesson: { color: { background: "#6aa9e6", border: "#3b6fe0" } },
          concept: { color: { background: "#8b6fe0", border: "#6f54c4" } },
          work: { color: { background: "#e8675f", border: "#cf4f47" } },
          section: { color: { background: "#eb8f87", border: "#e8675f" } },
          chunk: { color: { background: "#9aa3b2", border: "#7c8694" } },
        },
        interaction: { hover: true, tooltipDelay: 200 },
      });
      net.on("click", (params: { nodes: (string | number)[] }) => {
        if (params.nodes.length > 0) {
          const node = graph.nodes.find((n) => n.id === params.nodes[0]);
          if (node && node.group !== "root") onNodeClick(node);
        }
      });
    })();

    return () => { destroyed = true; if (net) net.destroy(); };
  }, [graph, onNodeClick]);

  return <div ref={ref} className="w-full h-[600px] bg-card border border-border rounded-lg" />;
}
