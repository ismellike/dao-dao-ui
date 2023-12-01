// Constants NOT derived from environment variables.

export const SITE_IMAGE = '/social.jpg'

// 3 days
export const POLYTONE_TIMEOUT_SECONDS = 3 * 24 * 60 * 60

// DAO name min/max and description max defined in core.
export const MIN_DAO_NAME_LENGTH = 3
export const MAX_DAO_NAME_LENGTH = 50
export const MAX_META_CHARS_PROPOSAL_DESCRIPTION = 200

export const DAO_STATIC_PROPS_CACHE_SECONDS = 60

export const NEW_DAO_TOKEN_DECIMALS = 6

// This will not change with environment.
export const MAX_NUM_PROPOSAL_CHOICES = 20

// Discord notifier (https://github.com/DA0-DA0/discord-notifier-cf-worker)
export const DISCORD_NOTIFIER_SIGNATURE_TYPE = 'Discord Notifier'

// Following DAOs
export const FOLLOWING_DAOS_PREFIX = 'following:'

// The key for the item in the DAO core contract that contains the payroll
// config.
export const DAO_CORE_PAYROLL_CONFIG_ITEM_KEY = 'payroll'
// The key for the item in the DAO core contract that contains the accent color.
export const DAO_CORE_ACCENT_ITEM_KEY = 'accent'

// Me balances page
export const HIDDEN_BALANCE_PREFIX = 'hiddenBalance:'

// Supported NFT video extensions. If an NFT image is a video, we'll try to
// render a video player instead of an image.
export const NFT_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'avi']

// Widgets
// The namespace (prefix) of widgets stored in a DAO's core items list.
export const DAO_WIDGET_ITEM_NAMESPACE = 'widget:'

// The namespace (prefix) of cw721 contracts stored in a DAO's core items list.
// This workaround is necessary for contracts that don't conform to the expected
// contract info response.
export const CW721_WORKAROUND_ITEM_KEY_PREFIX = 'cw721:'
// The namespace (prefix) of cw721 contracts for polytone accounts stored in a
// DAO's core items list. Polytone proxies cannot register cw721 like the DAO
// core contract can, so we need to store this separately.
export const POLYTONE_CW721_ITEM_KEY_PREFIX = 'polytone_cw721:'

// Osmosis API
export const OSMOSIS_API_BASE = 'https://api-osmosis.imperator.co'

// KVPK prefix for saved Me page transactions.
export const ME_SAVED_TX_PREFIX = 'savedTx:'

export const CHAIN_GAS_MULTIPLIER = 2

export const NUM_FEATURED_DAOS = 10

// Neutron governance DAO.
export const NEUTRON_GOVERNANCE_DAO =
  'neutron1suhgf5svhu4usrurvxzlgn54ksxmn8gljarjtxqnapv8kjnp4nrstdxvff'

// DAOs with these names will be excluded from search.
export const INACTIVE_DAO_NAMES = ['[archived]', '[deleted]']

// The namespace (prefix) of enabled vetoable DAOs stored in the items list.
export const VETOABLE_DAOS_ITEM_KEY_PREFIX = 'showVetoableDao:'
