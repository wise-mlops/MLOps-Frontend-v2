import type { Edge, Node, ViewportTransform } from "@vue-flow/core";

declare global {
  interface ResponseBody {
    code: number;
    message? : string;
    result: any;
    description?: string;
  }  

  interface Pipeline {
    pipeline_name: string;
    pipeline_description: string;
    nodes : Node[];
    edges: Edge[];
    position: [x: number, y: number];
    zoom: number;
    viewport: ViewportTransform
    created_at: Date;
    updated_at: Date;

  }
}