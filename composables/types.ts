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
  interface Notebook {
    metadata: {
      name: string;
      labels: any;
      annotations: any;
      create_date: Date;
    };
    template_pod: {
      metadata: {
        name: string;
        labels: any;
        annotations: any;
        create_date: Date;
      };
      containers: [
        {
          name: string;
          image: string;
          image_pull_policy: string;
          env: any;
          args: string[];
          command: string[];
          volume_mounts: [
            { 
              name: string;
              mountPath: string;
            }
          ]
          cpu: string;
          memory: string;
          gpu: string;          
        }
      ];
      image_pull_secrets: string[];
      volumes: [
        { 
          name: string;
          type: string;
          type_name: string;
        }
      ]
      service_account_name: string;
        
    }
  }
}