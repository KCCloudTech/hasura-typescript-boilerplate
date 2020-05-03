/* eslint-disable id-blacklist */
import { Handler, Request } from "express";
import events from "../events";
import { EventTriggerPayload } from "../events/types";
import * as env from "../shared/env";
import { logger, LOG_LEVEL_WARN } from "../shared/logger";
import {
  HASURA_EVENT_TRIGGER_ERROR_STATUS,
  HASURA_EVENT_TRIGGER_SUCCESS_STATUS
} from "../shared/types";

export const eventHandler: Handler = (req, res) => {
  const extraLoggingInfo = {
    startTime: new Date()
  };

  const body = req.body as EventTriggerPayload;

  const childLogger = logger.child({
    type: "trigger"
  });

  if (!body || !body.trigger || !body.trigger.name) {
    const error = { message: "Empty trigger name" };

    childLogger.log({
      error,
      level: LOG_LEVEL_WARN,
      ...serializeTriggerRequest(req, extraLoggingInfo),
      message: error.message,
      http_code: HASURA_EVENT_TRIGGER_SUCCESS_STATUS
    });

    return res.status(400)
      .json(error);
  }

  const ev = events[body.trigger.name];

  if (!ev) {
    const error = {
      message: `trigger name ${body.trigger.name} doesn't exist`
    };

    childLogger.log({
      error,
      message: error.message,
      level: LOG_LEVEL_WARN,
      ...serializeTriggerRequest(req, extraLoggingInfo),
      http_code: HASURA_EVENT_TRIGGER_ERROR_STATUS
    });

    return res.status(HASURA_EVENT_TRIGGER_ERROR_STATUS)
      .json(error);

  }

  return ev({ request: req, logger: childLogger }, body)
    .then((result) => {

      childLogger.info(`executed trigger ${body.trigger.name} successfully`, {
        ...serializeTriggerRequest(req, extraLoggingInfo),
        response: env.DEBUG ? result : undefined,
        http_code: HASURA_EVENT_TRIGGER_SUCCESS_STATUS
      });

      return res.status(HASURA_EVENT_TRIGGER_SUCCESS_STATUS)
        .json(result);
    })
    .catch((err) => {

      logger.error(err.message, {
        ...serializeTriggerRequest(req, extraLoggingInfo),
        error: err,
        http_code: HASURA_EVENT_TRIGGER_ERROR_STATUS
      });

      return res.status(HASURA_EVENT_TRIGGER_ERROR_STATUS)
        .json({
          code: err.code,
          message: err.message
        });
    });
};

type ExtraLoggingInfo = {
  readonly startTime: Date
};

function serializeTriggerRequest(req: Request, info: ExtraLoggingInfo): any {
  const body = req.body as EventTriggerPayload;

  return {
    request_body: req.body,
    request_header: req.headers,
    trigger_name: body.trigger.name,
    latency: new Date().getTime() - info.startTime.getTime()
  };
}
