import { PropsWithChildren, createContext, useContext, useMemo } from 'react'
import { Client } from '@atproto/lex-client'
import { useSession } from './SessionProvider'

/**
 * A {@link Client} bound to the user's OAuth session, used to make
 * authenticated requests directly towards the user's PDS.
 *
 * @note An `OAuthSession` already satisfies lex-client's `Agent` interface (it
 * exposes both `did` and `fetchHandler`), so it can be passed straight into
 * `new Client(session)` without any adapter.
 */
export const PdsAgentContext = createContext<Client | null>(null)

export function PdsAgentProvider({ children }: PropsWithChildren) {
  const { session } = useSession()

  const client = useMemo<Client | null>(() => {
    if (!session) return null
    return new Client(session)
  }, [session])

  return (
    <PdsAgentContext.Provider value={client}>
      {children}
    </PdsAgentContext.Provider>
  )
}

/**
 * Returns an authenticated {@link Client} to perform requests towards the
 * user's PDS. Will throw if used outside of an authenticated context. The
 * authenticated user's DID is available via `client.agent.did`.
 */
export function usePdsAgent(): Client {
  const client = useContext(PdsAgentContext)
  if (client) return client

  throw new Error('usePdsAgent should only be used from authenticated contexts')
}
