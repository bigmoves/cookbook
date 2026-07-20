import { PropsWithChildren, createContext, useContext, useMemo } from 'react'
import { Client } from '@atproto/lex-client'
import { useSession } from './SessionProvider'

/**
 * An unauthenticated {@link Client} instance, that can be used to perform
 * unauthenticated requests directly towards the Bluesky API.
 */
const unauthenticatedClient = new Client({ service: 'https://api.bsky.app' })

const BskyAgentContext = createContext(unauthenticatedClient)

export function BskyAgentProvider({ children }: PropsWithChildren) {
  const { session } = useSession()

  /**
   * A client that will perform authenticated requests towards the Bluesky
   * API, by proxying requests through the user's PDS. The `service` option
   * sets the `atproto-proxy` header that routes the request to the appview.
   *
   * @note Requires that at least one `rpc:` OAuth scope with
   * `aud=did:web:api.bsky.app#bsky_appview` is granted during the OAuth flow,
   * otherwise the PDS will reject any proxying attempts.
   */
  const authenticatedClient = useMemo(() => {
    if (!session) return null
    return new Client(session, { service: 'did:web:api.bsky.app#bsky_appview' })
  }, [session])

  return (
    <BskyAgentContext.Provider
      value={authenticatedClient || unauthenticatedClient}
    >
      {children}
    </BskyAgentContext.Provider>
  )
}

/**
 * Returns an unauthenticated {@link Client} to perform requests towards the
 * Bluesky API. Using an unauthenticated client will result in faster requests
 * (since no proxying will be involved), but only public data can be accessed.
 */
export function useUnauthenticatedBskyAgent() {
  return unauthenticatedClient
}

/**
 * Returns a {@link Client} to perform requests towards the Bluesky API. Use
 * `client.agent.did` to determine if the client is authenticated or not (if
 * `undefined`, the client is unauthenticated).
 */
export function useBskyAgent() {
  return useContext(BskyAgentContext)
}

/**
 * Like {@link useBskyAgent}, but will throw if the client is not authenticated
 * (i.e. used from non-logged in routes). Allows to retrieve the currently
 * authenticated user's DID by accessing `client.agent.did`.
 */
export function useAuthenticatedBskyAgent() {
  const client = useBskyAgent()
  if (!client.agent.did) {
    throw new Error(
      'useAuthenticatedBskyAgent should only be used from authenticated contexts'
    )
  }
  return client
}
