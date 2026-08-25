/**
 * 微信小程序 image 的 src 不能为布尔 false / 非字符串，否则会请求 /components/false。
 */
export function safeImgSrc(v, fallback = "/static/avatarlog.png") {
  if (typeof v === "string" && v.trim().length > 0) return v;
  return typeof fallback === "string" && fallback.trim().length > 0 ? fallback : "/static/avatarlog.png";
}
