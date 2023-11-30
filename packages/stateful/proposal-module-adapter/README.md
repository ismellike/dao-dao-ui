# @dao-dao/stateful/proposal-module-adapter

Author: [@NoahSaso](https://github.com/NoahSaso)

## Adapters

| Adapter                                               | Summary                   |
| ----------------------------------------------------- | ------------------------- |
| [DaoProposalSingle](./adapters/DaoProposalSingle)     | Single choice proposals   |
| [DaoProposalMultiple](./adapters/DaoProposalMultiple) | Multiple choice proposals |

## Layout

| Location               | Summary                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [adapters](./adapters) | Proposal module adapters.                                                                                                                                                |
| [react](./react)       | The external React interface used by apps and packages when using this proposal module adapter system. This uses the core logic under the hood.                          |
| [recoil](./recoil)     | The external [Recoil](https://recoiljs.org) interface used by apps and packages when using this proposal module adapter system. This uses the core logic under the hood. |
| [core.ts](./core.ts)   | The core logic that matches and loads an adapter from the available adapters.                                                                                            |

## What is it?

This is a proposal module adapter package. It creates a common interface for
various components and pieces of data that apps need to access which change
based on the proposal module used by a given proposal. For example, a single
choice proposal will need to display two voting choices, whereas a multiple
choice proposal will need to display a variable number of choices.

## Why is this necessary?

The alternative is to create a `ProposalModuleType` and litter the codebase with
conditional statements which would contribute to poor readability and
extensibility. This makes data fetching and error handling difficult and
unclear: because we can't conditionally call React hooks, we would attempt to
load all data that could potentially be needed by any proposal module, using
conditional statements to check which data we expect to be defined. This leads
to, unsurprisingly, confusing and unreadable code.

## React Setup

### **1. Wrap the app**

Add the `ProposalModuleAdapterProvider` to your app, likely at a high enough
level to encompass entire pages. At this point, you must already know the
available proposal modules and proposal ID of the relevant proposal so that the
correct adapter can be chosen and its interface passed down to descendant
components. You will also need to pass some options, like the contract address
of the DAO's core contract and its chain ID.

```tsx
import { ProposalModuleAdapterProvider } from '@dao-dao/stateful/proposal-module-adapter'

const ProposalPage = () => (
  <ProposalModuleAdapterProvider
    initialOptions={{
      chain,
      coreAddress,
    }}
    proposalModules={proposalModules}
    proposalId={proposalId}
  >
    {children}
  </ProposalModuleAdapterProvider>
)
```

In the `@dao-dao/dapp` Next.js app, `proposalModules` and `coreAddress` are
fetched via `getStaticProps` and passed to a common page wrapper component, on
each page, and `proposalId` is extracted from the URL parameters.

### **2. Use the hooks**

Now that the library has been setup, we can use the hook anywhere as a
descendant of the Provider to access the proposal module adapter interface.

```tsx
import { SuspenseLoader } from '@dao-dao/stateful'
import { Loader } from '@dao-dao/stateless'
import { useProposalModuleAdapter } from '@dao-dao/stateful/proposal-module-adapter'

const ProposalVoteInfo = () => {
  const {
    ui: { ProposalVoteInfoInternal },
  } = useProposalModuleAdapter()

  return (
    <SuspenseLoader fallback={<Loader />}>
      <ProposalVoteInfoInternal />
    </SuspenseLoader>
  )
}
```

We can also use `matchAndLoadCommon` to get the common objects that don't depend
on a specific `proposalId`, but are specific to a proposal module. These are
things such as a hook to list all proposals, used in `ProposaList`, or
components to display configuration, such as the voting configuration.

Here is an example that displays a dropdown of proposal modules and lets you
view the voting configuration for each one:

```tsx
import { matchAndLoadCommon } from '@dao-dao/stateful/proposal-module-adapter'

export const DaoInfo = () => {
  const { coreAddress, proposalModules } = useDaoInfoContext()

  const components = useMemo(
    () =>
      proposalModules.map((proposalModule) => ({
        DaoInfoVotingConfiguration: matchAndLoadCommon(proposalModule, {
          chainId,
          coreAddress,
        }).components.DaoInfoVotingConfiguration,
        proposalModule,
      })),
    [coreAddress, proposalModules]
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const { DaoInfoVotingConfiguration } = components[selectedIndex]

  return (
    <div>
      <select
        onChange={({ target: { value } }) => setSelectedIndex(Number(value))}
        value={selectedIndex}
      >
        {components.map(({ proposalModule }, index) => (
          <option key={proposalModule.address} value={index}>
            {proposalModule.contractName}
          </option>
        ))}
      </select>

      <DaoInfoVotingConfiguration />
    </div>
  )
}
```

## Writing an adapter

It's very easy to write an adapter, especially because TypeScript will tell you
what fields and types you need based on the shared interface. You can also
reference the existing adapters which follow the exact same pattern.

All you need to do is define an adapter object and add it to the list of
adapters in `core.ts`.

```ts
import { ProposalModuleAdapter } from '@dao-dao/types/proposal-module-adapter'

const MyProposalModuleAdapter: ProposalModuleAdapter = {
  id: 'my_proposal_module_adapter_id',
  contractNames: [
    'my-proposal-module-v1',
    'my-proposal-module-v2',
  ],

  loadCommon: (options) => ({
    hooks: {
      ...
    },

    components: {
      ...
    },
  }),

  load: (options) => ({
    hooks: {
      ...
    },

    components: {
      ...
    },
  }),

  queries: {
    ...
  },

  functions: {
    ...
  },
}
```

There's one more thing to be aware of when writing adapters... the
`useProposalModuleAdapterOptions` hook!

### **useProposalModuleAdapterOptions**

This hook simply provides the `options` passed to the
`ProposalModuleAdapterProvider` (with `proposalModuleAddress`, `proposalId`, and
`proposalNumber` added), so you can easily access the `coreAddress` as well as
other common info instead of needing to manually pass them around.
