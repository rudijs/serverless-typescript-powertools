import { APIGatewayProxyHandlerV2, APIGatewayProxyEventV2 } from "aws-lambda"
// import type { Context } from "aws-lambda"
import middy from "@middy/core"

import { Tracer, captureLambdaHandler } from "@aws-lambda-powertools/tracer"
import { Logger, injectLambdaContext } from "@aws-lambda-powertools/logger"
import { Metrics, MetricUnits, logMetrics } from "@aws-lambda-powertools/metrics"

const tracer = new Tracer({ serviceName: "demoTracerApp" })
const logger = new Logger({ serviceName: "demoTracerApp" })
const metrics = new Metrics({ namespace: "demoSstApp", serviceName: "demoTracerApp" })

const lambdaHandler: APIGatewayProxyHandlerV2 = async (event, context) => {
  // ### Experiment with Tracer

  // Service & Cold Start annotations will be added for you by the decorator/middleware

  // These traces will be added to the main segment (## index.handler)
  tracer.putAnnotation("awsRequestId", context.awsRequestId)
  tracer.putMetadata("eventPayload", event)

  // Create another subsegment & set it as active
  const handlerSegment = tracer.getSegment() // This is the custom segment created by Tracer for you (## index.handler)

  let subsegment = handlerSegment.addNewSubsegment("### Action1")
  tracer.setSegment(subsegment)

  let res
  try {
    logger.info("This is an INFO log with some context")

    metrics.addMetric("successfulBooking", MetricUnits.Count, 1)

    res = { foo: "bar" }

    console.log("task one!")
    tracer.putAnnotation("task", "one")
    await new Promise((resolve) => setTimeout(resolve, 500))
    subsegment.close()

    subsegment = handlerSegment.addNewSubsegment("### Action2")
    tracer.setSegment(subsegment)
    console.log("task two")
    tracer.putAnnotation("task", "two")
    await new Promise((resolve) => setTimeout(resolve, 300))
    subsegment.close()

    subsegment = handlerSegment.addNewSubsegment("### Action3")
    tracer.setSegment(subsegment)
    console.log("task three")
    tracer.putAnnotation("task", "three")
    await new Promise((resolve) => setTimeout(resolve, 200))
  } catch (err) {
    throw err
  } finally {
    // Close the subsegment you created (### MySubSegment)
    subsegment.close()

    // Set back the original segment as active (## index.handler)
    tracer.setSegment(handlerSegment)
    // The main segment (facade) will be closed for you at the end by the decorator/middleware
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `Request was received at ${event.requestContext.time}.`,
  }
}

export const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer)).use(injectLambdaContext(logger)).use(logMetrics(metrics))
