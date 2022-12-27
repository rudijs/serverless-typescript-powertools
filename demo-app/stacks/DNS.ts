import { StackContext } from "@serverless-stack/resources"

const MAPPING: Record<string, string> = {
  production: "signals.cryptomarketscreener.com",
  staging: "staging.signals.cryptomarketscreener.com",
  dev: "dev.signals.cryptomarketscreener.com",
}

export function DNS(props: StackContext) {
  const zone = MAPPING[props.app.stage] || "dev.signals.cryptomarketscreener.com"
  const domain = MAPPING[props.app.stage] || `${props.app.stage}.dev.signals.cryptomarketscreener.com`

  props.stack.addOutputs({
    zone,
    domain,
  })

  return { zone, domain }
}
