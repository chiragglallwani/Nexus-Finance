import { EventEmitter } from "events";
import logger from "../config/logger";

class EventService extends EventEmitter {
     constructor() {
          super();
          this.setMaxListeners(20);
     }

     publishEvent(eventName: string, data: unknown) {
          setImmediate(() => {
               this.emit(eventName, data);
          });
     }

     registerHandlers = () => {
          // this.on(EventTypes.USER_CREATED, this.handleUserCreated);
          // Object.values(EventTypes).forEach((eventName) => {
          //   this.on(eventName, (payload: any) => {
          //     logger.info(`Event ${eventName} received`, { payload });
          //   });
          // });
     };

     emitEventHelper(eventType: string, payload: unknown) {
          try {
               this.publishEvent(eventType, payload);
          } catch (error: unknown) {
               if (error instanceof Error) {
                    logger.error(`Error publishing event ${eventType}`, {
                         error: error.message,
                    });
               }
          }
     }
}

export default new EventService();
