declare global {
  interface IObject {
    [key: string]: any;
  }

  interface IResult<T = any> {
    code: string;
    context: T;
    message: string;
  }

  declare interface Window {
    $wujie: IObject;
  }

  declare type Ii18nAction = "add" | "update";
}

export {};