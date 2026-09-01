/**
 * PawIcon source manifest.
 *
 * The source files are Figma exports (or a normalized copy of a Figma
 * export for mono icons). The generated registry is the only source that
 * application code should consume.
 */
module.exports = {
  version: 1,
  // Optional design-approved optical metadata. scale is a ratio; offsets are
  // 24-unit design coordinates and are baked into the generated SVG. Never
  // use this hook for page-specific or runtime-size compensation.
  optical: {},
  mono: {
    'navigation/back': 'assets/paw-icons/mono/navigation/back.svg'
  },
  color: {
    'navigation/close': 'static/figma/feed-popup/close.svg',
    'navigation/chevron-right': 'static/figma/feed-popup/chevron.svg',
    'navigation/search': 'static/figma/yard-cats/search-icon.svg',
    'navigation/sort-arrow': 'static/figma/yard-cats/sort-arrow.svg',
    'navigation/list': 'static/figma/yard-cats/list-icon.svg',
    'navigation/action-arrow': 'static/figma/yard-cats/action-arrow.svg',
    'navigation/clock-disabled': 'static/figma/yard-cats/disabled-clock.svg',
    'navigation/expand-arrow': 'static/figma/add-kitten/expand-arrow.svg',
    'navigation/value-close': 'static/figma/add-kitten/value-close-figma.svg',
    'navigation/clear': 'static/figma/add-kitten/clear.svg',
    'navigation/delete-history': 'static/figma/search/delete-history.svg',
    'navigation/share-close': 'static/figma/share-action-sheet/close-icon.svg',

    'actions/camera': 'static/figma/add-kitten/camera.svg',
    'actions/like': 'static/figma/dynamic-detail/like-icon.svg',
    'actions/like-filled': 'static/figma/dynamic-detail/comment-like.svg',
    'actions/composer-voice': 'static/figma/dynamic-detail/composer-voice.svg',
    'actions/composer-emoji': 'static/figma/dynamic-detail/composer-emoji.svg',
    'actions/comment-voice': 'static/figma/dynamic-detail/comment-voice.svg',
    'actions/dynamic-share': 'static/figma/dynamic-detail/share-icon.svg',
    'actions/dynamic-join': 'static/figma/dynamic-detail/join-icon.svg',
    'actions/dynamic-adopt': 'static/figma/dynamic-detail/adopt-icon.svg',
    'actions/feed': 'static/figma/dynamic-detail/feed-icon.svg',
    'actions/album': 'static/figma/pet-detail/icon-album.svg',
    'actions/share': 'static/figma/pet-detail/icon-share.svg',
    'actions/edit': 'static/figma/pet-detail/icon-edit.svg',
    'actions/manage-pet': 'static/figma/pet-detail/icon-manage-pet.svg',
    'actions/manage-album': 'static/figma/pet-detail/icon-album.svg',
    'actions/delete': 'static/figma/pet-detail/icon-delete.svg',
    'actions/selection-check': 'static/figma/add-kitten/selection-check.svg',
    'actions/agreement-check': 'static/figma/feed-popup/agreement-check.svg',
    'actions/yard-feed': 'static/me/yard-feed.svg',
    'actions/yard-audit': 'static/me/yard-audit.svg',
    'actions/order-all': 'static/me/order-all.svg',
    'actions/order-pay': 'static/me/order-pay.svg',
    'actions/order-ship': 'static/me/order-ship.svg',
    'actions/order-receive': 'static/me/order-receive.svg',
    'actions/order-review': 'static/me/order-review.svg',
    'actions/location-pin': 'static/figma/home/location-pin.svg',
    'actions/yard-location': 'static/figma/yard-location-icon.svg',
    'actions/current-location': 'static/figma/city-current-location.svg',
    'actions/album-pin': 'static/figma/feature/album-menu-pin.svg',
    'actions/album-favorite': 'static/figma/feature/album-menu-favorite.svg',
    'actions/album-hide': 'static/figma/feature/album-menu-hide.svg',
    'actions/album-delete': 'static/figma/feature/album-menu-delete.svg',
    'actions/result-close': 'static/figma/result-sheet/close.svg',

    'common/message-interaction': 'static/figma/message/icon-interaction.svg',
    'common/message-shopping': 'static/figma/message/icon-shopping.svg',
    'common/message-service': 'static/figma/message/icon-service.svg',
    'common/message-system': 'static/figma/message/icon-system.svg',
    'common/message-activity': 'static/figma/message/icon-activity.svg',
    'common/message-pet': 'static/figma/message/icon-pet.svg',

    'status/check-outline': 'static/figma/adoption-flow/status-check-outline.svg',
    'status/check': 'static/figma/adoption-status-check.svg',
    'status/success-check': 'static/figma/result-sheet/success-check.svg',
    'status/jury-real': 'static/figma/jury-modal/icon-real.svg',
    'status/jury-fake': 'static/figma/jury-modal/icon-fake.svg',

    'badges/crown-left': 'static/figma/leaderboard/crown-left.svg',
    'badges/crown-center': 'static/figma/leaderboard/crown-center.svg',
    'badges/crown-right': 'static/figma/leaderboard/crown-right.svg',

    'brand/share-poster': 'static/figma/share-action-sheet/poster-icon.svg',
    'brand/share-link': 'static/figma/share-action-sheet/link-icon.svg',
    'brand/share-wechat': 'static/figma/share-action-sheet/wechat-icon.svg',
    'brand/share-moments': 'static/figma/share-action-sheet/moments-icon.svg',
    'brand/share-report': 'static/figma/share-action-sheet/report-icon.svg',
    'brand/feed-kibble': 'static/figma/feed-popup/kibble.svg',
    'brand/feed-bowl': 'static/figma/feed-popup/bowl.svg',
    'brand/feed-bag': 'static/figma/feed-popup/bag.svg'
  }
}
