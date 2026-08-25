/** 投喂列表 / 详情演示数据（接口就绪后替换） */
const AV = "/static/avatarlog.png";
const IMG = "/static/home-feed-1.png";

const timelineTpl = () => [
  {
    day: "23",
    month: "6月",
    indexText: "3/5",
    catIcons: [AV, AV, AV, AV],
    text: "你家的猫咪被我照顾的很好，别担心",
    imgs: [IMG, IMG, AV],
  },
  {
    day: "22",
    month: "6月",
    indexText: "2/5",
    catIcons: [AV, AV, AV, AV],
    text: "今天又来投喂小猫了，感谢幸福人生的投粮，会继续用心反馈～",
    imgs: [IMG, IMG, AV],
  },
  {
    day: "21",
    month: "6月",
    indexText: "1/5",
    catIcons: [AV, AV, AV, AV],
    text: "今天又来投喂小猫了，感谢幸福人生的投粮，会继续用心反馈～",
    imgs: [IMG, IMG, AV],
  },
];

const logisticsTpl = () => [
  { text: "已签收", time: "2026-2-21 17:37" },
  { text: "已发货", time: "2026-2-21 17:37" },
  { text: "仓库分拣打包中", time: "2026-2-21 17:37" },
  { text: "已下单", time: "2026-2-21 17:37" },
];

function detailBase(id, headerStatusText, headerStatusTone, feedbackProgress) {
  return {
    id,
    yardId: "1",
    ownerPawId: "feeding-detail-owner",
    yardName: "平安是福",
    yardTag: "小院",
    ownerLevel: 1,
    avatar: AV,
    weightText: "投喂4斤",
    feedAmountLine: "投粮4斤",
    time: "2026-2-5 13:23:56",
    orderNo: "YCQ092182",
    headerStatusText,
    headerStatusTone,
    feedbackProgress,
    timeline: timelineTpl(),
    logistics: logisticsTpl(),
  };
}

export const feedingDetailById = {
  f1: detailBase("f1", "3天23:34:45后超时", "red", "2/5"),
  f2: detailBase("f2", "已超时", "red", "2/5"),
  f3: detailBase("f3", "全部完成", "green", "5/5"),
};

/** 图1：我的投喂列表 */
export const myFeedingRows = [
  {
    id: "f1",
    pawId: "my-feed-f1",
    yardId: "1",
    avatar: AV,
    level: 1,
    name: "平安是福",
    weightLine: "投粮4斤",
    time: "2026-2-5 13:23:56",
    statusText: "已反馈",
    statusTone: "green",
    statusBadge: 3,
    progress: "3/5",
  },
  {
    id: "f2",
    pawId: "my-feed-f2",
    yardId: "1",
    avatar: AV,
    level: 1,
    name: "平安是福",
    weightLine: "投粮4斤",
    time: "2026-2-5 13:23:56",
    statusText: "已反馈",
    statusTone: "green",
    statusBadge: 4,
    progress: "4/5",
  },
  {
    id: "f3",
    pawId: "my-feed-f3",
    yardId: "1",
    avatar: AV,
    level: 1,
    name: "平安是福",
    weightLine: "投粮4斤",
    time: "2026-2-5 13:23:56",
    statusText: "全部完成",
    statusTone: "green",
    statusBadge: 0,
    progress: "5/5",
  },
];

/** 图2：小院投喂 / 投喂订单列表 */
export const yardFeedOrderRows = [
  {
    id: "f1",
    pawId: "yard-feed-f1",
    yardId: "1",
    avatar: AV,
    name: "平安是福",
    level: 1,
    weightLine: "投喂4斤",
    time: "2026-2-5 13:23:56",
    bottomTag: "已反馈2/5次",
    topKind: "countdown",
    topText: "3天23:34:45后超时",
  },
  {
    id: "f2",
    pawId: "yard-feed-f2",
    yardId: "1",
    avatar: AV,
    name: "平安是福",
    level: 1,
    weightLine: "投喂4斤",
    time: "2026-2-5 13:23:56",
    bottomTag: "已反馈2/5次",
    topKind: "timeout",
    topText: "已超时",
  },
  {
    id: "f3",
    pawId: "yard-feed-f3",
    yardId: "1",
    avatar: AV,
    name: "平安是福",
    level: 1,
    weightLine: "投喂4斤",
    time: "2026-2-5 13:23:56",
    bottomTag: "已反馈5/5次",
    topKind: "done",
    topText: "全部完成",
  },
];
