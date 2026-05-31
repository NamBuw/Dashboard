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
        edges: graph.edges.map((e) => ({ ...e })) as VisEdge[],
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
        groups: {
          root: { color: { background: "#0ea5e9", border: "#0284c7" } },
          bo_sach: { color: { background: "#3b82f6", border: "#2563eb" } },
          subject: { color: { background: "#10b981", border: "#059669" } },
          grade: { color: { background: "#f59e0b", border: "#d97706" } },
          lesson: { color: { background: "#ec4899", border: "#db2777" } },
          chunk: { color: { background: "#a78bfa", border: "#8b5cf6" } },
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
