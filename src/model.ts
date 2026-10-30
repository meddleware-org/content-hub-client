// The data model's enumerations, exactly as the API sends them (snake_case values; task types in
// SCREAMING_CASE). Each `*_VALUES` list is checked against vectors.json, which the service checks against
// its database CHECK constraints, so the three cannot drift.

export const ITEM_TYPE_VALUES = [
  'infra',
  'social',
  'content',
  'listing',
  'ad_campaign',
  'research',
  'engineering',
  'bot_discoverability',
  'trustless',
  'other',
] as const
export type ItemType = (typeof ITEM_TYPE_VALUES)[number]

export const ITEM_STATUS_VALUES = ['planned', 'in_progress', 'done', 'cancelled'] as const
export type ItemStatus = (typeof ITEM_STATUS_VALUES)[number]

export const TASK_TYPE_VALUES = [
  'ACCOUNT_SETUP',
  'SOCIAL_POST',
  'BLOG_ARTICLE',
  'LISTING_SUBMISSION',
  'AD_CAMPAIGN',
  'KOL_CAMPAIGN',
  'ENGINEERING',
  'RESEARCH',
  'OTHER',
] as const
export type TaskType = (typeof TASK_TYPE_VALUES)[number]

export const TASK_STATUS_VALUES = ['planned', 'ready', 'in_progress', 'done', 'blocked'] as const
export type TaskStatus = (typeof TASK_STATUS_VALUES)[number]

export const PLATFORM_CATEGORY_VALUES = [
  'social',
  'forum',
  'directory',
  'ad_network',
  'event',
  'content',
  'onchain',
  'partnership',
  'registry',
  'owned_channel',
  'internal',
] as const
export type PlatformCategory = (typeof PLATFORM_CATEGORY_VALUES)[number]

export const POSTING_MODE_VALUES = ['api', 'webhook', 'feed', 'manual', 'none'] as const
export type PostingMode = (typeof POSTING_MODE_VALUES)[number]

export const COUNTING_METHOD_VALUES = ['x_weighted', 'graphemes', 'utf16', 'codepoints', 'bytes'] as const
export type CountingMethod = (typeof COUNTING_METHOD_VALUES)[number]

export const MARKUP_VALUES = ['plain', 'markdown', 'discord_md', 'telegram_html', 'bbcode'] as const
export type Markup = (typeof MARKUP_VALUES)[number]

export const POST_STATUS_VALUES = ['draft', 'ready', 'archived'] as const
export type PostStatus = (typeof POST_STATUS_VALUES)[number]

export const INSTANCE_STATUS_VALUES = [
  'planned',
  'queued',
  'sending',
  'posted',
  'failed',
  'unknown',
  'manual_required',
  'cancelled',
] as const
export type InstanceStatus = (typeof INSTANCE_STATUS_VALUES)[number]

export const EXTERNAL_STATUS_VALUES = [
  'proposed',
  'confirmed',
  'published',
  'submitted',
  'in_review',
  'approved',
  'rejected',
] as const
export type ExternalStatus = (typeof EXTERNAL_STATUS_VALUES)[number]

export const DELIVERY_OUTCOME_VALUES = [
  'success',
  'failed',
  'unknown',
  'rate_limited',
  'validation_error',
  'dry_run',
] as const
export type DeliveryOutcome = (typeof DELIVERY_OUTCOME_VALUES)[number]

export const LINK_KIND_VALUES = ['post', 'platform_instance', 'external'] as const
export type LinkKind = (typeof LINK_KIND_VALUES)[number]

export const SPEND_SCOPE_VALUES = ['total', 'platform', 'target'] as const
export type SpendScope = (typeof SPEND_SCOPE_VALUES)[number]

export const SPEND_KIND_VALUES = ['reserve', 'settle', 'release'] as const
export type SpendKind = (typeof SPEND_KIND_VALUES)[number]

export const NETWORK_VALUES = ['localnet', 'testnet', 'mainnet'] as const
export type Network = (typeof NETWORK_VALUES)[number]

/** Every enumeration under the `table.column` name the vectors use. */
export const ENUMERATIONS: Readonly<Record<string, readonly string[]>> = {
  'roadmap_items.item_type': ITEM_TYPE_VALUES,
  'roadmap_items.status': ITEM_STATUS_VALUES,
  'tasks.task_type': TASK_TYPE_VALUES,
  'tasks.status': TASK_STATUS_VALUES,
  'platform_definitions.category': PLATFORM_CATEGORY_VALUES,
  'platform_definitions.posting_mode': POSTING_MODE_VALUES,
  'platform_definitions.counting_method': COUNTING_METHOD_VALUES,
  'platform_definitions.markup': MARKUP_VALUES,
  'posts.status': POST_STATUS_VALUES,
  'platform_instances.status': INSTANCE_STATUS_VALUES,
  'platform_instances.external_status': EXTERNAL_STATUS_VALUES,
  'delivery_attempts.outcome': DELIVERY_OUTCOME_VALUES,
  'task_links.link_kind': LINK_KIND_VALUES,
  'spend_caps.scope': SPEND_SCOPE_VALUES,
  'spend_ledger.kind': SPEND_KIND_VALUES,
  'snapshots.network': NETWORK_VALUES,
}
