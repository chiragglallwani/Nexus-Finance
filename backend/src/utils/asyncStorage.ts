import { AsyncLocalStorage } from "async_hooks";
import { type NextFunction, type Request, type Response } from "express";

const asyncStorage = new AsyncLocalStorage();

export const asyncStorageMiddleware = (req: Request, res: Response, next: NextFunction) => {
     asyncStorage.run(new Map(), () => {
          next();
     });
};

export const setAsyncStorage = <T>(data: T) => {
     const store = asyncStorage.getStore();
     if (store) {
          Object.assign(store, data);
     } else {
          throw new Error("Async storage not found");
     }
};

export const getAsyncStorage = () => {
     return asyncStorage.getStore();
};

export const getTenantId = async () => {
     const store = getAsyncStorage() as { tenantId: string };
     const tenantId = store.tenantId;
     if (tenantId) {
          return tenantId;
     }
     throw new Error("Tenant ID not found");
};
