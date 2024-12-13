declare global {
  interface IObject {
    [key: string]: any;
  }

  interface IResult<T = any> {
    code: string;
    context: T;
    message: string;
  }
}

export {};