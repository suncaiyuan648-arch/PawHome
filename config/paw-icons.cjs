/**
 * PawIcon source manifest.
 *
 * The source files are Figma exports (or a normalized copy of a Figma
 * export for mono icons). The generated registry is the only source that
 * application code should consume.
 */
module.exports = {
  version: 3,
  // Every icon source is a fresh Figma export stored under sourceRoot.
  sourceRoot: 'assets/paw-icons/source',
  families: {
    'order-entry': { slot: 28 },
    'yard-side-action': { slot: 24 }
  },
  // Metadata is audit/build input only. PawIcon runtime consumes the
  // generated canonical assets and never reads sourceFrame or slot. Display
  // frames above 25px keep an explicit numeric slot so a render at the
  // original Figma size remains faithful; the five standard optical tokens
  // remain the default for system icons.
  meta: {
  'navigation/back': {
    sourceFrame: { width: 24, height: 24 },
    slot: 24,
    figmaNodeId: '1548:5',
    sourceLabel: 'Figma node 1548:5'
  },
  'navigation/close': {
    sourceFrame: { width: 12, height: 12 },
    slot: 16,
    figmaNodeId: '62:36780',
    sourceLabel: 'Figma node 62:36780'
  },
  'navigation/chevron-right': {
    sourceFrame: { width: 6, height: 10 },
    slot: 12,
    figmaNodeId: '62:42089',
    sourceLabel: 'Figma node 62:42089'
  },
  'navigation/member-progress-arrow': {
    sourceFrame: { width: 10, height: 10 },
    slot: 12,
    figmaNodeId: '62:41100',
    sourceLabel: 'Figma node 62:41100'
  },
  'navigation/order-chevron-right': {
    sourceFrame: { width: 7, height: 11 },
    slot: 16,
    figmaNodeId: '62:41146',
    sourceLabel: 'Figma node 62:41146'
  },
  'navigation/yard-link-chevron': {
    sourceFrame: { width: 5, height: 7 },
    slot: 12,
    figmaNodeId: '62:41165',
    sourceLabel: 'Figma node 62:41165'
  },
  'navigation/search': {
    sourceFrame: { width: 14, height: 16 },
    slot: 20,
    figmaNodeId: '62:23876',
    sourceLabel: 'Figma node 62:23876'
  },
  'navigation/sort-arrow': {
    sourceFrame: { width: 8, height: 5 },
    slot: 12,
    figmaNodeId: '62:25159',
    sourceLabel: 'Figma node 62:25159'
  },
  'navigation/list': {
    sourceFrame: { width: 19, height: 19 },
    slot: 24,
    figmaNodeId: '62:25180',
    sourceLabel: 'Figma node 62:25180'
  },
  'navigation/action-arrow': {
    sourceFrame: { width: 14, height: 14 },
    slot: 16,
    figmaNodeId: '62:25911',
    sourceLabel: 'Figma node 62:25911'
  },
  'navigation/clock-disabled': {
    sourceFrame: { width: 14, height: 14 },
    slot: 16,
    figmaNodeId: '62:43079',
    sourceLabel: 'Figma node 62:43079'
  },
  'navigation/expand-arrow': {
    sourceFrame: { width: 12, height: 6 },
    slot: 16,
    figmaNodeId: '62:37446',
    sourceLabel: 'Figma node 62:37446'
  },
  'navigation/value-close': {
    sourceFrame: { width: 26, height: 26 },
    slot: 26,
    figmaNodeId: '62:39053',
    sourceLabel: 'Figma node 62:39053'
  },
  'navigation/form-amount-chevron': {
    sourceFrame: { width: 16, height: 16 },
    slot: 20,
    figmaNodeId: '62:24505',
    sourceLabel: 'Figma node 62:24505'
  },
  'navigation/form-chevron': {
    sourceFrame: { width: 7, height: 10 },
    slot: 12,
    figmaNodeId: '62:24507',
    sourceLabel: 'Figma node 62:24507'
  },
  'navigation/form-clear': {
    sourceFrame: { width: 16, height: 16 },
    slot: 20,
    figmaNodeId: '62:24537',
    sourceLabel: 'Figma node 62:24537'
  },
  'navigation/clear': {
    sourceFrame: { width: 16, height: 16 },
    slot: 20,
    figmaNodeId: '62:24537',
    sourceLabel: 'Figma node 62:24537'
  },
  'navigation/delete-history': {
    sourceFrame: { width: 19, height: 19 },
    slot: 24,
    figmaNodeId: '62:29053',
    sourceLabel: 'Figma node 62:29053'
  },
  'navigation/share-close': {
    sourceFrame: { width: 11, height: 11 },
    slot: 16,
    figmaNodeId: '62:25949',
    sourceLabel: 'Figma node 62:25949'
  },
  'actions/camera': {
    sourceFrame: { width: 28, height: 28 },
    slot: 28,
    figmaNodeId: '62:24489',
    sourceLabel: 'Figma node 62:24489'
  },
  'actions/like': {
    sourceFrame: { width: 15, height: 15 },
    slot: 20,
    figmaNodeId: '62:27466',
    sourceLabel: 'Figma node 62:27466'
  },
  'actions/like-filled': {
    sourceFrame: { width: 13, height: 14 },
    slot: 16,
    figmaNodeId: '62:24004',
    sourceLabel: 'Figma node 62:24004'
  },
  'actions/composer-voice': {
    sourceFrame: { width: 13, height: 18 },
    slot: 20,
    figmaNodeId: '62:27816',
    sourceLabel: 'Figma node 62:27816'
  },
  'actions/composer-emoji': {
    sourceFrame: { width: 17, height: 17 },
    slot: 20,
    figmaNodeId: '62:27475',
    sourceLabel: 'Figma node 62:27475'
  },
  'actions/comment-voice': {
    sourceFrame: { width: 14, height: 14 },
    slot: 16,
    figmaNodeId: '62:27508',
    sourceLabel: 'Figma node 62:27508'
  },
  'actions/dynamic-share': {
    sourceFrame: { width: 21, height: 21 },
    slot: 24,
    figmaNodeId: '62:27707',
    sourceLabel: 'Figma node 62:27707'
  },
  'actions/dynamic-join': {
    sourceFrame: { width: 21, height: 22 },
    slot: 24,
    figmaNodeId: '62:27717',
    sourceLabel: 'Figma node 62:27717'
  },
  'actions/dynamic-adopt': {
    sourceFrame: { width: 21, height: 19 },
    slot: 24,
    figmaNodeId: '62:27720',
    sourceLabel: 'Figma node 62:27720'
  },
  'actions/feed': {
    sourceFrame: { width: 32, height: 32 },
    slot: 32,
    figmaNodeId: '62:27691',
    sourceLabel: 'Figma node 62:27691'
  },
  'actions/album': {
    sourceFrame: { width: 17, height: 17 },
    slot: 20,
    figmaNodeId: '62:29907',
    sourceLabel: 'Figma node 62:29907'
  },
  'actions/share': {
    sourceFrame: { width: 21, height: 21 },
    slot: 24,
    figmaNodeId: '62:30016',
    sourceLabel: 'Figma node 62:30016'
  },
  'actions/edit': {
    sourceFrame: { width: 20, height: 20 },
    slot: 24,
    figmaNodeId: '62:30007',
    sourceLabel: 'Figma node 62:30007'
  },
  'actions/manage-pet': {
    sourceFrame: { width: 18, height: 18 },
    slot: 20,
    figmaNodeId: '62:29900',
    sourceLabel: 'Figma node 62:29900'
  },
  'actions/manage-album': {
    sourceFrame: { width: 17, height: 17 },
    slot: 20,
    figmaNodeId: '62:29907',
    sourceLabel: 'Figma node 62:29907'
  },
  'actions/delete': {
    sourceFrame: { width: 11, height: 13 },
    slot: 16,
    figmaNodeId: '62:29914',
    sourceLabel: 'Figma node 62:29914'
  },
  'actions/selection-check': {
    sourceFrame: { width: 15, height: 11 },
    slot: 20,
    figmaNodeId: '62:28222',
    sourceLabel: 'Figma node 62:28222'
  },
  'actions/agreement-check': {
    sourceFrame: { width: 12, height: 13 },
    slot: 16,
    figmaNodeId: '62:31380',
    sourceLabel: 'Figma node 62:31380'
  },
  'actions/yard-feed': {
    sourceFrame: { width: 21, height: 21 },
    slot: 24,
    family: 'yard-side-action',
    figmaNodeId: '62:41155',
    sourceLabel: 'Figma node 62:41155'
  },
  'actions/yard-audit': {
    sourceFrame: { width: 20, height: 20 },
    slot: 24,
    family: 'yard-side-action',
    figmaNodeId: '62:41218',
    sourceLabel: 'Figma node 62:41218'
  },
  'actions/order-all': {
    sourceFrame: { width: 25, height: 25 },
    slot: 28,
    family: 'order-entry',
    figmaNodeId: '62:41106',
    sourceLabel: 'Figma node 62:41106'
  },
  'actions/order-pay': {
    sourceFrame: { width: 18, height: 18 },
    slot: 28,
    family: 'order-entry',
    figmaNodeId: '62:41112',
    sourceLabel: 'Figma node 62:41112'
  },
  'actions/order-ship': {
    sourceFrame: { width: 22, height: 22 },
    slot: 28,
    family: 'order-entry',
    figmaNodeId: '62:41121',
    sourceLabel: 'Figma node 62:41121'
  },
  'actions/order-receive': {
    sourceFrame: { width: 20, height: 20 },
    slot: 28,
    family: 'order-entry',
    figmaNodeId: '62:41129',
    sourceLabel: 'Figma node 62:41129'
  },
  'actions/order-review': {
    sourceFrame: { width: 19, height: 19 },
    slot: 28,
    family: 'order-entry',
    figmaNodeId: '62:41137',
    sourceLabel: 'Figma node 62:41137'
  },
  'actions/location-pin': {
    sourceFrame: { width: 7, height: 13 },
    slot: 16,
    figmaNodeId: '62:23905',
    sourceLabel: 'Figma node 62:23905'
  },
  'actions/yard-location': {
    sourceFrame: { width: 12, height: 12 },
    slot: 16,
    figmaNodeId: '62:42066',
    sourceLabel: 'Figma node 62:42066'
  },
  'actions/current-location': {
    sourceFrame: { width: 17, height: 17 },
    slot: 20,
    figmaNodeId: '62:28161',
    sourceLabel: 'Figma node 62:28161'
  },
  'actions/album-pin': {
    sourceFrame: { width: 10, height: 13 },
    slot: 16,
    figmaNodeId: '62:36090',
    sourceLabel: 'Figma node 62:36090'
  },
  'actions/album-favorite': {
    sourceFrame: { width: 13, height: 13 },
    slot: 16,
    figmaNodeId: '62:36089',
    sourceLabel: 'Figma node 62:36089'
  },
  'actions/album-hide': {
    sourceFrame: { width: 14, height: 9 },
    slot: 16,
    figmaNodeId: '62:36088',
    sourceLabel: 'Figma node 62:36088'
  },
  'actions/album-delete': {
    sourceFrame: { width: 11, height: 13 },
    slot: 16,
    figmaNodeId: '62:36087',
    sourceLabel: 'Figma node 62:36087'
  },
  'actions/result-close': {
    sourceFrame: { width: 12, height: 12 },
    slot: 16,
    figmaNodeId: '62:36780',
    sourceLabel: 'Figma node 62:36780'
  },
  'actions/login-phone': {
    sourceFrame: { width: 20, height: 20 },
    slot: 24,
    figmaNodeId: '62:42149',
    sourceLabel: 'Figma node 62:42149'
  },
  'common/message-interaction': {
    sourceFrame: { width: 21, height: 23 },
    slot: 28,
    figmaNodeId: '62:42383',
    sourceLabel: 'Figma node 62:42383'
  },
  'common/message-shopping': {
    sourceFrame: { width: 24, height: 24 },
    slot: 28,
    figmaNodeId: '62:42391',
    sourceLabel: 'Figma node 62:42391'
  },
  'common/message-service': {
    sourceFrame: { width: 24, height: 24 },
    slot: 28,
    figmaNodeId: '62:42400',
    sourceLabel: 'Figma node 62:42400'
  },
  'common/message-system': {
    sourceFrame: { width: 27, height: 27 },
    slot: 27,
    figmaNodeId: '62:42410',
    sourceLabel: 'Figma node 62:42410'
  },
  'common/message-activity': {
    sourceFrame: { width: 22, height: 22 },
    slot: 24,
    figmaNodeId: '62:42419',
    sourceLabel: 'Figma node 62:42419'
  },
  'common/message-pet': {
    sourceFrame: { width: 29, height: 29 },
    slot: 29,
    figmaNodeId: '62:42428',
    sourceLabel: 'Figma node 62:42428'
  },
  'status/check-outline': {
    sourceFrame: { width: 17, height: 17 },
    slot: 20,
    figmaNodeId: '62:32653',
    sourceLabel: 'Figma node 62:32653'
  },
  'status/check': {
    sourceFrame: { width: 17, height: 17 },
    slot: 20,
    figmaNodeId: '62:32653',
    sourceLabel: 'Figma node 62:32653'
  },
  'status/success-check': {
    sourceFrame: { width: 18, height: 18 },
    slot: 20,
    figmaNodeId: '62:36668',
    sourceLabel: 'Figma node 62:36668'
  },
  'status/jury-real': {
    sourceFrame: { width: 60, height: 60 },
    slot: 60,
    figmaNodeId: '62:35988',
    sourceLabel: 'Figma node 62:35988'
  },
  'status/jury-fake': {
    sourceFrame: { width: 60, height: 60 },
    slot: 60,
    figmaNodeId: '62:38785',
    sourceLabel: 'Figma node 62:38785'
  },
  'badges/crown-left': {
    sourceFrame: { width: 21, height: 21 },
    slot: 24,
    figmaNodeId: '62:35671',
    sourceLabel: 'Figma node 62:35671'
  },
  'badges/crown-center': {
    sourceFrame: { width: 22, height: 22 },
    slot: 24,
    figmaNodeId: '62:35643',
    sourceLabel: 'Figma node 62:35643'
  },
  'badges/crown-right': {
    sourceFrame: { width: 21, height: 21 },
    slot: 24,
    figmaNodeId: '62:35695',
    sourceLabel: 'Figma node 62:35695'
  },
  'brand/share-poster': {
    sourceFrame: { width: 27, height: 27 },
    slot: 27,
    figmaNodeId: '62:25956',
    sourceLabel: 'Figma node 62:25956'
  },
  'brand/share-link': {
    sourceFrame: { width: 29, height: 29 },
    slot: 29,
    figmaNodeId: '62:25963',
    sourceLabel: 'Figma node 62:25963'
  },
  'brand/share-wechat': {
    sourceFrame: { width: 25, height: 25 },
    slot: 28,
    figmaNodeId: '62:25987',
    sourceLabel: 'Figma node 62:25987'
  },
  'brand/login-wechat': {
    sourceFrame: { width: 20, height: 20 },
    slot: 24,
    figmaNodeId: '62:42153',
    sourceLabel: 'Figma node 62:42153'
  },
  'brand/share-moments': {
    sourceFrame: { width: 38, height: 38 },
    slot: 38,
    figmaNodeId: '62:25972',
    sourceLabel: 'Figma node 62:25972'
  },
  'brand/share-report': {
    sourceFrame: { width: 27, height: 27 },
    slot: 27,
    figmaNodeId: '62:25993',
    sourceLabel: 'Figma node 62:25993'
  },
  'brand/feed-kibble': {
    sourceFrame: { width: 20, height: 15 },
    slot: 24,
    figmaNodeId: '62:38883',
    sourceLabel: 'Figma node 62:38883'
  },
  'brand/feed-bowl': {
    sourceFrame: { width: 32, height: 32 },
    slot: 32,
    figmaNodeId: '62:38854',
    sourceLabel: 'Figma node 62:38854'
  },
  'brand/feed-bag': {
    sourceFrame: { width: 43, height: 43 },
    slot: 43,
    figmaNodeId: '62:38895',
    sourceLabel: 'Figma node 62:38895'
  },
  },
  // Optional design-approved optical metadata. scale is a ratio; offsets are
  // 24-unit design coordinates and are baked into the generated SVG. Never
  // use this hook for page-specific or runtime-size compensation.
  optical: {},
  mono: {
    'navigation/back': 'assets/paw-icons/source/navigation/back.svg'
  },
  color: {
    'navigation/close': 'assets/paw-icons/source/navigation/close.svg',
    'navigation/chevron-right': 'assets/paw-icons/source/navigation/chevron-right.svg',
    'navigation/member-progress-arrow': 'assets/paw-icons/source/navigation/member-progress-arrow.svg',
    'navigation/order-chevron-right': 'assets/paw-icons/source/navigation/order-chevron-right.svg',
    'navigation/yard-link-chevron': 'assets/paw-icons/source/navigation/yard-link-chevron.svg',
    'navigation/search': 'assets/paw-icons/source/navigation/search.svg',
    'navigation/sort-arrow': 'assets/paw-icons/source/navigation/sort-arrow.svg',
    'navigation/list': 'assets/paw-icons/source/navigation/list.svg',
    'navigation/action-arrow': 'assets/paw-icons/source/navigation/action-arrow.svg',
    'navigation/clock-disabled': 'assets/paw-icons/source/navigation/clock-disabled.svg',
    'navigation/expand-arrow': 'assets/paw-icons/source/navigation/expand-arrow.svg',
    'navigation/value-close': 'assets/paw-icons/source/navigation/value-close.svg',
    'navigation/form-amount-chevron': 'assets/paw-icons/source/navigation/form-amount-chevron.svg',
    'navigation/form-chevron': 'assets/paw-icons/source/navigation/form-chevron.svg',
    'navigation/form-clear': 'assets/paw-icons/source/navigation/form-clear.svg',
    'navigation/clear': 'assets/paw-icons/source/navigation/clear.svg',
    'navigation/delete-history': 'assets/paw-icons/source/navigation/delete-history.svg',
    'navigation/share-close': 'assets/paw-icons/source/navigation/share-close.svg',
    'actions/camera': 'assets/paw-icons/source/actions/camera.svg',
    'actions/like': 'assets/paw-icons/source/actions/like.svg',
    'actions/like-filled': 'assets/paw-icons/source/actions/like-filled.svg',
    'actions/composer-voice': 'assets/paw-icons/source/actions/composer-voice.svg',
    'actions/composer-emoji': 'assets/paw-icons/source/actions/composer-emoji.svg',
    'actions/comment-voice': 'assets/paw-icons/source/actions/comment-voice.svg',
    'actions/dynamic-share': 'assets/paw-icons/source/actions/dynamic-share.svg',
    'actions/dynamic-join': 'assets/paw-icons/source/actions/dynamic-join.svg',
    'actions/dynamic-adopt': 'assets/paw-icons/source/actions/dynamic-adopt.svg',
    'actions/feed': 'assets/paw-icons/source/actions/feed.svg',
    'actions/album': 'assets/paw-icons/source/actions/album.svg',
    'actions/share': 'assets/paw-icons/source/actions/share.svg',
    'actions/edit': 'assets/paw-icons/source/actions/edit.svg',
    'actions/manage-pet': 'assets/paw-icons/source/actions/manage-pet.svg',
    'actions/manage-album': 'assets/paw-icons/source/actions/manage-album.svg',
    'actions/delete': 'assets/paw-icons/source/actions/delete.svg',
    'actions/selection-check': 'assets/paw-icons/source/actions/selection-check.svg',
    'actions/agreement-check': 'assets/paw-icons/source/actions/agreement-check.svg',
    'actions/yard-feed': 'assets/paw-icons/source/actions/yard-feed.svg',
    'actions/yard-audit': 'assets/paw-icons/source/actions/yard-audit.svg',
    'actions/order-all': 'assets/paw-icons/source/actions/order-all.svg',
    'actions/order-pay': 'assets/paw-icons/source/actions/order-pay.svg',
    'actions/order-ship': 'assets/paw-icons/source/actions/order-ship.svg',
    'actions/order-receive': 'assets/paw-icons/source/actions/order-receive.svg',
    'actions/order-review': 'assets/paw-icons/source/actions/order-review.svg',
    'actions/location-pin': 'assets/paw-icons/source/actions/location-pin.svg',
    'actions/yard-location': 'assets/paw-icons/source/actions/yard-location.svg',
    'actions/current-location': 'assets/paw-icons/source/actions/current-location.svg',
    'actions/album-pin': 'assets/paw-icons/source/actions/album-pin.svg',
    'actions/album-favorite': 'assets/paw-icons/source/actions/album-favorite.svg',
    'actions/album-hide': 'assets/paw-icons/source/actions/album-hide.svg',
    'actions/album-delete': 'assets/paw-icons/source/actions/album-delete.svg',
    'actions/result-close': 'assets/paw-icons/source/actions/result-close.svg',
    'actions/login-phone': 'assets/paw-icons/source/actions/login-phone.svg',
    'common/message-interaction': 'assets/paw-icons/source/common/message-interaction.svg',
    'common/message-shopping': 'assets/paw-icons/source/common/message-shopping.svg',
    'common/message-service': 'assets/paw-icons/source/common/message-service.svg',
    'common/message-system': 'assets/paw-icons/source/common/message-system.svg',
    'common/message-activity': 'assets/paw-icons/source/common/message-activity.svg',
    'common/message-pet': 'assets/paw-icons/source/common/message-pet.svg',
    'status/check-outline': 'assets/paw-icons/source/status/check-outline.svg',
    'status/check': 'assets/paw-icons/source/status/check.svg',
    'status/success-check': 'assets/paw-icons/source/status/success-check.svg',
    'status/jury-real': 'assets/paw-icons/source/status/jury-real.svg',
    'status/jury-fake': 'assets/paw-icons/source/status/jury-fake.svg',
    'badges/crown-left': 'assets/paw-icons/source/badges/crown-left.svg',
    'badges/crown-center': 'assets/paw-icons/source/badges/crown-center.svg',
    'badges/crown-right': 'assets/paw-icons/source/badges/crown-right.svg',
    'brand/share-poster': 'assets/paw-icons/source/brand/share-poster.svg',
    'brand/share-link': 'assets/paw-icons/source/brand/share-link.svg',
    'brand/share-wechat': 'assets/paw-icons/source/brand/share-wechat.svg',
    'brand/login-wechat': 'assets/paw-icons/source/brand/login-wechat.svg',
    'brand/share-moments': 'assets/paw-icons/source/brand/share-moments.svg',
    'brand/share-report': 'assets/paw-icons/source/brand/share-report.svg',
    'brand/feed-kibble': 'assets/paw-icons/source/brand/feed-kibble.svg',
    'brand/feed-bowl': 'assets/paw-icons/source/brand/feed-bowl.svg',
    'brand/feed-bag': 'assets/paw-icons/source/brand/feed-bag.svg'
  }
}
