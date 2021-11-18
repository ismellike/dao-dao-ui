import WalletLoader from 'components/WalletLoader'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'

import LineAlert from 'components/LineAlert'
import { useProposal } from 'hooks/proposals'
import ProposalDetails from 'components/ProposalDetails'

const contractAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS || ''

const Proposal: NextPage = () => {
  const router = useRouter()
  const proposalId = router.query.proposalId as string

  const {
    walletAddress,
    loading,
    error,
    proposal,
    votes,
    transactionHash,
    vote,
    execute,
    close,
  } = useProposal(contractAddress, proposalId)

  const initialMessage: string | undefined = router.query.initialMessage as any
  const initialMessageStatus: 'success' | 'error' | undefined = router.query
    .initialMessageStatus as any

  const initialMessageComponent =
    initialMessage && initialMessageStatus ? (
      <LineAlert msg={initialMessage} variant={initialMessageStatus} />
    ) : null

  return (
    <WalletLoader loading={loading}>
      <div className="flex flex-col w-full">
        <div className="grid bg-base-100 place-items-center">
          {initialMessageComponent}
          {!proposal ? (
            <div className="text-center m-8">
              No proposal with that ID found.
            </div>
          ) : (
            <div className="container mx-auto w-96 lg:w-6/12 max-w-full text-left">
              <ProposalDetails
                proposal={proposal}
                walletAddress={walletAddress}
                votes={votes}
                vote={vote}
                execute={execute}
                close={close}
              />

              {error && (
                <LineAlert className="mt-2" variant="error" msg={error} />
              )}

              {transactionHash.length > 0 && (
                <div className="mt-8">
                  <LineAlert
                    variant="success"
                    msg={`Success! Transaction Hash: ${transactionHash}`}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </WalletLoader>
  )
}

export default Proposal
