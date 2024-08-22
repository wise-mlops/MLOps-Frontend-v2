declare global {
  interface ResponseBody {
    code: number;
    message? : string;
    result: any;
    description?: string;
  }  
}