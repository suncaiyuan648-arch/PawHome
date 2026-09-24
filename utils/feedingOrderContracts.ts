/** Shared between the main-package mock API, toolbar and feeding subpackage. */
export type FeedingOrderVariant = 'mine' | 'yard'
/** Legacy route readers accept `owner`, then normalize it to `yard`. */
export type FeedingOrderVariantInput = FeedingOrderVariant | 'owner'
export type FeedingOrderDetailPerspective = 'yard-owner' | 'cloud-parent'
/** Legacy detail readers accept aliases and normalize them to a canonical perspective. */
export type FeedingOrderDetailPerspectiveInput = FeedingOrderDetailPerspective | 'yard' | 'owner'
export type FeedingOrderSort = 'smart' | 'newest' | 'status'

export interface FeedingOrderSortOption {
	readonly key: FeedingOrderSort
	readonly label: string
}
