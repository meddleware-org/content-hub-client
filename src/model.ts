// The data model's enumerations, exactly as the API sends them (snake_case values; task types in
// SCREAMING_CASE). Each `*_VALUES` list is checked against vectors.json, which the service checks against
// its database CHECK constraints, so the three cannot drift.
//
// Role: one place that names every value the API can send for a status, type or kind, so the admin UI never hard-codes a string that the server might reject. Types are derived from
// the lists (`as const`), so adding a value here changes the type everywhere at once. Main exports: the `*_VALUES` lists and their types, and `ENUMERATIONS` (the table.column map the
// vectors use). Tested in `tests/vectors.test.ts`.

/** The allowed values of `roadmap_items.item_type`: the kind of a roadmap item (what sort of work it is). */
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
/** One of ITEM_TYPE_VALUES. */
export type ItemType = (typeof ITEM_TYPE_VALUES)[number]

/** The allowed values of `roadmap_items.status`: where a roadmap item stands: planned, in progress, done or cancelled. */
export const ITEM_STATUS_VALUES = ['planned', 'in_progress', 'done', 'cancelled'] as const
/** One of ITEM_STATUS_VALUES. */
export type ItemStatus = (typeof ITEM_STATUS_VALUES)[number]

/** The allowed values of `tasks.task_type`: the kind of a task (SCREAMING_CASE, as the API sends it). */
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
/** One of TASK_TYPE_VALUES. */
export type TaskType = (typeof TASK_TYPE_VALUES)[number]

/** The allowed values of `tasks.status`: where a task stands; the moves between them are in `TASK_TRANSITIONS`. */
export const TASK_STATUS_VALUES = ['planned', 'ready', 'in_progress', 'done', 'blocked'] as const
/** One of TASK_STATUS_VALUES. */
export type TaskStatus = (typeof TASK_STATUS_VALUES)[number]

/** The allowed values of `platform_definitions.category`: the category of a platform (social network, forum, directory, ad network, owned channel, …). */
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
/** One of PLATFORM_CATEGORY_VALUES. */
export type PlatformCategory = (typeof PLATFORM_CATEGORY_VALUES)[number]

/** The allowed values of `platform_definitions.posting_mode`: how posts reach a platform: through its API, a webhook, a feed, by hand, or not at all. */
export const POSTING_MODE_VALUES = ['api', 'webhook', 'feed', 'manual', 'none'] as const
/** One of POSTING_MODE_VALUES. */
export type PostingMode = (typeof POSTING_MODE_VALUES)[number]

/** The allowed values of `platform_definitions.counting_method`: how a platform counts the length of a post (see `count`). */
export const COUNTING_METHOD_VALUES = ['x_weighted', 'graphemes', 'utf16', 'codepoints', 'bytes'] as const
/** One of COUNTING_METHOD_VALUES. */
export type CountingMethod = (typeof COUNTING_METHOD_VALUES)[number]

/** The allowed values of `platform_definitions.markup`: the markup a platform accepts for a post body (see `render`). */
export const MARKUP_VALUES = ['plain', 'markdown', 'discord_md', 'telegram_html', 'bbcode'] as const
/** One of MARKUP_VALUES. */
export type Markup = (typeof MARKUP_VALUES)[number]

/** The allowed values of `posts.status`: where a post stands: draft, ready or archived. */
export const POST_STATUS_VALUES = ['draft', 'ready', 'archived'] as const
/** One of POST_STATUS_VALUES. */
export type PostStatus = (typeof POST_STATUS_VALUES)[number]

/** The allowed values of `platform_instances.status`: where one platform instance of a post stands; the moves and who may make them are in `INSTANCE_TRANSITIONS`. */
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
/** One of INSTANCE_STATUS_VALUES. */
export type InstanceStatus = (typeof INSTANCE_STATUS_VALUES)[number]

/** The allowed values of `platform_instances.external_status`: what the outside platform reports for an instance that is submitted for review rather than posted directly. */
export const EXTERNAL_STATUS_VALUES = [
  'proposed',
  'confirmed',
  'published',
  'submitted',
  'in_review',
  'approved',
  'rejected',
] as const
/** One of EXTERNAL_STATUS_VALUES. */
export type ExternalStatus = (typeof EXTERNAL_STATUS_VALUES)[number]

/** The allowed values of `delivery_attempts.outcome`: the result of one delivery attempt (including a dry run that sent nothing). */
export const DELIVERY_OUTCOME_VALUES = [
  'success',
  'failed',
  'unknown',
  'rate_limited',
  'validation_error',
  'dry_run',
] as const
/** One of DELIVERY_OUTCOME_VALUES. */
export type DeliveryOutcome = (typeof DELIVERY_OUTCOME_VALUES)[number]

/** The allowed values of `task_links.link_kind`: what a task link points at: a post, a platform instance or an external item. */
export const LINK_KIND_VALUES = ['post', 'platform_instance', 'external'] as const
/** One of LINK_KIND_VALUES. */
export type LinkKind = (typeof LINK_KIND_VALUES)[number]

/** The allowed values of `spend_caps.scope`: what a spending cap applies to: everything, one platform or one target. */
export const SPEND_SCOPE_VALUES = ['total', 'platform', 'target'] as const
/** One of SPEND_SCOPE_VALUES. */
export type SpendScope = (typeof SPEND_SCOPE_VALUES)[number]

/** The allowed values of `spend_ledger.kind`: the kind of a spending ledger entry: reserve, settle or release. */
export const SPEND_KIND_VALUES = ['reserve', 'settle', 'release'] as const
/** One of SPEND_KIND_VALUES. */
export type SpendKind = (typeof SPEND_KIND_VALUES)[number]

/** The allowed values of `snapshots.network`: the Sui network a snapshot describes. */
export const NETWORK_VALUES = ['localnet', 'testnet', 'mainnet'] as const
/** One of NETWORK_VALUES. */
export type Network = (typeof NETWORK_VALUES)[number]

/** Every enumeration under the `table.column` name the vectors use (the keys are the database columns, so a vector check can compare them one to one). */
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
