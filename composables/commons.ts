const config = useAppConfig()

//config.api.url



export function arrayToYaml(arr: any[], indent: string = ''): string {
  return arr.map(item => valueToYaml(item, indent)).join('\n');
}

function objectToYaml(obj: Record<string, any>, indent: string = ''): string {
  return Object.entries(obj)
    .map(([key, value]) => `${indent}${key}: ${valueToYaml(value, indent + '  ')}`)
    .join('\n');
} 

function valueToYaml(value: any, indent: string = ''): string {
  if (value === null || value === undefined) {
    return 'null';
  } else if (typeof value === 'string') {
    return value.includes('\n') ? `|\n${indent}  ${value.replace(/\n/g, `\n${indent}  `)}` : `"${value}"`;
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  } else if (Array.isArray(value)) {
    return value.length === 0 ? '[]' : '\n' + value.map(v => `${indent}- ${valueToYaml(v, indent + '  ')}`).join('\n');
  } else if (typeof value === 'object') {
    return '\n' + objectToYaml(value, indent + '  ');
  }
  
  return String(value);
}


/* Convert Json to Yaml */
export const jsonToYaml = (jsonData: string) => {
  // Parse the JSON string into a JavaScript object
  const data = JSON.parse(jsonData);  
  // Helper function to convert a JavaScript object to a YAML string
  const convertToYaml = (obj: any, indent: number = 0) => {
    let yamlString = '';
    const indentSpaces = ' '.repeat(indent);

    if (typeof obj === 'object' && obj !== null) {
      // If obj is an array, iterate through each element
      if (Array.isArray(obj)) {
        for (const element of obj) {
          yamlString += `${indentSpaces}- ${convertToYaml(element, indent + 2)}`;
        }
      } else {
        // Check if object contains only one key
        const keys = Object.keys(obj);
        const keyCount = keys.length;

        for (let i = 0; i < keyCount; i++) {
          const key = keys[i];
          const value = obj[key];

          // Check if the value is an object or array
          if (typeof value === 'object' && value !== null) {
            // Add key and colon
            yamlString += `${indentSpaces}${key}:`;
            // Check if the object has only one key
            const childKeys = Object.keys(value);
            const childKeyCount = childKeys.length;
            if (childKeyCount === 1 && typeof value[childKeys[0]] !== 'object') {
              // If the child object has only one key, keep value on the same line
              yamlString += ` ${JSON.stringify(value[childKeys[0]])}\n`;
            } else {
              // Otherwise, proceed with normal indentation
              yamlString += `\n${convertToYaml(value, indent + 2)}`;
            }
          } else {
            // Convert primitive types (string, number, boolean, null)
            yamlString += `${indentSpaces}${key}: ${JSON.stringify(value)}\n`;
          }
        }
      }
    } else {
      // Convert primitive types (string, number, boolean, null)
      if (obj === null) {
        yamlString += 'null\n';
      } else if (typeof obj === 'boolean') {
        yamlString += `${obj}\n`;
      } else {
        yamlString += `${JSON.stringify(obj)}\n`;
      }
    }

    return yamlString;
  }

  // Convert the data object to a YAML string
  return convertToYaml(data);
}

// Pod 로그는 공통 함수 사용
export const getPodLogs = async (
  namespace: string,
  podName: string,
  container?: string,
  tailLines: number = 100,
  sinceSeconds?: number
) => {
  const params = new URLSearchParams();
  if (container) params.append('container', container);
  params.append('tail_lines', tailLines.toString());
  params.append('timestamps', 'true');
  if (sinceSeconds) params.append('since_seconds', sinceSeconds.toString());

  let url = encodeURI(`/k8s-managements/namespaces/${namespace}/pods/${podName}/logs/advanced?${params.toString()}`)
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response;
};
