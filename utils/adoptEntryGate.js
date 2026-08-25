/**
 * 前端演示：在动态详情、院子详情等页首次点击底部「领养」时展示「领养次数」类提示弹窗。
 * 用户点击「我知道了」后写入本地，之后点击领养直接进入选猫流程；接入后端后改为接口判断。
 */
const STORAGE_KEY = "PAW_ADOPT_ENTRY_HINT_DISMISSED";

export function shouldShowAdoptEntryHint() {
  try {
    return uni.getStorageSync(STORAGE_KEY) !== "1";
  } catch (e) {
    return true;
  }
}

export function dismissAdoptEntryHint() {
  try {
    uni.setStorageSync(STORAGE_KEY, "1");
  } catch (e) {}
}

/** 仅调试：恢复首次进入需弹窗 */
export function resetAdoptEntryHintForDev() {
  try {
    uni.removeStorageSync(STORAGE_KEY);
  } catch (e) {}
}
