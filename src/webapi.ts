import { message } from "antd";
import axios from "axios";
import { getTerminalFn, } from "./kit";

const i18nAxios = axios.create({
    baseURL: 'http://127.0.0.1:8888/',
});

/** 请求拦截器 */
i18nAxios.interceptors.request.use(
    config => {
        const headers = config?.headers;
        if(headers && Object.keys(headers).length) {
            Object.assign(headers, {
                terminal: getTerminalFn(),
            })
        }

        return config;
    }, 
    error => Promise.reject(error),
);

/** 成功响应码 */
const SUCCESS_CODE = "000000";

/**
 * 查询列表
 * @param params 
 */
export const languageListFn = async (params: IObject): Promise<Partial<IObject>> => {
    let context = {};

    try {
        const result = await i18nAxios.post<IResult>(`language/list`, {...params});
        context = result?.data?.context || {};
    } catch (error) {
        console.error(error);
    }

    return context;
}

/**
 * 保存
 * @param list 
 */
export const languageBulkWriteFn = async (list: Array<IObject>) => {
    let context = false;

    try {
        const result = await i18nAxios.post<IResult>(`language/bulkWrite`, {
            list,
        });
        
        context = result?.data?.code === SUCCESS_CODE;
        const msg = result?.data?.message;
        if(context) {
            message.success(msg || "操作成功");
        }else {
            message.error(msg || "操作失败");
        }
    } catch (error) {
        console.error(error);
        message.error("操作失败");
    }

    return context;
}

/**
 * 翻译
 * @param params 
 */
export const fanyiBaiDuFn = async (params: IObject) => {
    let context = null;

    try {
        const result = await i18nAxios.post<IResult>(`fanyi/baidu`, {...params});
        context = result?.data?.context || "";

        const isSuccess = result?.data?.code === SUCCESS_CODE;
        const msg = result?.data?.message;
        if(!isSuccess) {
            message.error(msg || "操作失败");
        }
    } catch (error) {
        console.error(error);
        message.error("操作失败");
    }

    return context;
}

/**
 * 删除
 * @param ids 
 */
export const languageDeleteManyFn = async (ids: Array<string>) => {
    let context = false;

    try {
        const result = await i18nAxios.post<IResult>(`language/deleteMany`, {
            ids,
        });
        
        context = result?.data?.code === SUCCESS_CODE;
        const msg = result?.data?.message;
        if(context) {
            message.success(msg || "操作成功");
        }else {
            message.error(msg || "操作失败");
        }
    } catch (error) {
        console.error(error);
        message.error("操作失败");
    }

    return context;
}

/**
 * 导出
 * @param params 
 */
export const languageExportFn = async (params: IObject) => {
    let context = false;

    try {
        const terminal = getTerminalFn();
        const result = await i18nAxios.post(
            `language/export`, 
            {...params}, { 
            responseType: 'blob',
        });
        
        const url = window.URL.createObjectURL(result?.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ params?.language || "" }-${ terminal }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        message.success("操作成功");
        context = true;
    } catch (error) {
        console.error(error);
        message.error("操作失败");
    }

    return context;
}
