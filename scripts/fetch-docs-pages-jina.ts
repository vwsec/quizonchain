/**
 * Fetches each Soneium docs URL via Jina Reader (https://r.jina.ai/) for
 * smoke-testing content quality and dead links.
 *
 * Run: npx tsx scripts/fetch-docs-pages-jina.ts
 */
import { SONEIUM_DOCS_PAGES } from "../lib/docsPages"

const JINA_READER_PREFIX = "https://r.jina.ai/"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  for (let i = 0; i < SONEIUM_DOCS_PAGES.length; i++) {
    const url = SONEIUM_DOCS_PAGES[i]
    const readerUrl = `${JINA_READER_PREFIX}${url}`

    console.debug("\n" + "=".repeat(80))
    console.debug(`[${i + 1}/${SONEIUM_DOCS_PAGES.length}] source: ${url}`)
    console.debug(`reader: ${readerUrl}`)

    try {
      const res = await fetch(readerUrl, {
        headers: {
          Accept: "text/plain",
        },
      })
      const body = await res.text()
      console.debug(`status: ${res.status} ${res.statusText}`)
      console.debug(`bodyLength: ${body.length}`)
      console.debug("--- response body ---")
      console.debug(body)
    } catch (err) {
      console.error("fetch error:", err)
    }

    if (i < SONEIUM_DOCS_PAGES.length - 1) {
      await delay(400)
    }
  }
  console.debug("\n" + "=".repeat(80))
  console.debug("done")
}

main().catch(console.error)
