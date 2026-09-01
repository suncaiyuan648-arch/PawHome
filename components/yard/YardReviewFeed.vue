<template>
  <view class="yard-review-feed" :class="{ 'yard-review-feed--flat': hideStatusTab }">
    <YardCommentComposer v-if="showCommentBar" :comment-total-text="commentTotalText" :avatar-src="composerAvatar"
      :placeholder="composerPlaceholder" @voice="onComposerVoice" @pick-image="onComposerPickImage" />
    <view v-else-if="hideStatusTab && commentTotalText" class="comment-cap">
      <text class="comment-cap-txt">{{ commentTotalText }}</text>
    </view>
    <view class="review">
      <view v-if="!hideStatusTab" class="status-tab">
        <view class="status-item" :class="{ active: activeTab === 'dynamic' }" style="margin-right: 32px"
          @click="changeReview('dynamic')">
          <view class="tab-text">动态</view>
          <image v-if="activeTab === 'dynamic'" class="tab-icon" src="/static/tiao.png"></image>
        </view>
        <view class="status-item" :class="{ active: activeTab === 'throw' }" @click="changeReview('throw')">
          <view class="tab-text">投粮记录</view>
          <image v-if="activeTab === 'throw'" class="tab-icon" src="/static/tiao.png"></image>
        </view>
      </view>
      <view v-if="hideStatusTab || activeTab === 'dynamic'" class="reviewList">
        <view class="review-item">
          <view class="avatar" @click.stop="openReviewMainUser">
            <image class="avatar-img" src="/static/avatarlog.png"></image>
          </view>
          <view class="review-content">
            <view class="review-name" @click.stop="openReviewMainUser">
              <view>姜栋</view>
              <LevelCapsule :level="1" />
            </view>
            <view class="review-text">
              <view class="avatar-group">
                <view v-for="n in 4" :key="'ag-' + n" :style="{ left: `${(n - 1) * 15}px`, 'z-index': n }"
                  class="avatar-box">
                  <image class="avatar-img" src="/static/avatarlog.png"></image>
                </view>
              </view>
              <view class="review-text-full"><text>来自花开富贵投喂的4斤猫粮</text></view>
            </view>
            <view class="review-context">
              <view class="review-long-text">
                <text>{{
                  isReviewExpanded(reviewRowKey) || !isReviewLong ? reviewText : reviewPreview
                }}</text>
                <text v-if="isReviewLong && !isReviewExpanded(reviewRowKey)" class="review-toggle"
                  @click.stop="toggleReview(reviewRowKey)"><text>...</text><text
                    class="review-toggle-word">全文</text></text>
                <text v-if="isReviewLong && isReviewExpanded(reviewRowKey)" class="review-toggle"
                  @click.stop="toggleReview(reviewRowKey)">收起</text>
              </view>
            </view>
            <view class="voice-msg" :class="{ 'voice-msg--playing': mainVoicePlaying }" @click.stop="toggleMainVoice">
              <view class="voice-msg__inner">
                <uni-icons type="sound" :size="18" color="#384d7b"></uni-icons>
                <view class="voice-msg__wave">
                  <view v-for="(h, wi) in mainVoiceBars" :key="'wb-' + wi" class="voice-msg__bar"
                    :style="{ height: h + 'px' }"></view>
                </view>
              </view>
              <text class="voice-msg__dur">{{ mainVoiceDuration }}</text>
            </view>
            <view class="review-media">
              <NineGridLayout :NineGridList="list9" containerWidth="300" BorderRadiusSize="0" />
            </view>
            <view class="reply">
              <view class="reply-info"><text>昨天 20:45 江西</text>
                <view class="reply-btn" @tap.stop="openReplySheet('main')">回复</view>
              </view>
              <view class="reply-num" @tap.stop="toggleMainReviewLike">
                <image class="reply-icon" :src="safeImgSrc(mainReviewLiked ? zan2 : zan1)" mode="aspectFit" />
                <text>{{ mainReviewLikes }}</text>
              </view>
            </view>
            <view class="comment-list">
              <view v-for="r in visibleReplies" :key="'r-' + r.id" class="comment-item">
                <image class="comment-avatar-img" :src="safeImgSrc(r.avatar)" mode="aspectFill"
                  @click.stop="openReplyUser(r)"></image>
                <view class="comment-body">
                  <view class="comment-header">
                    <view class="comment-name" @click.stop="openReplyUser(r)">
                      <text>{{ r.name }}</text>
                      <view v-if="r.tag" class="comment-tag"><text>{{ r.tag }}</text></view>
                    </view>
                  </view>
                  <view v-if="r.kind === 'voice'" class="comment-voice" @click.stop="playReplyVoice(r)">
                    <view class="comment-voice__inner" :class="{ 'comment-voice__inner--on': playingReplyId === r.id }">
                      <uni-icons type="sound" :size="16" color="#384d7b"></uni-icons>
                      <view class="comment-voice__wave">
                        <view v-for="(h, vi) in r.voiceBars" :key="r.id + '-v-' + vi" class="comment-voice__bar"
                          :style="{ height: h + 'px' }"></view>
                      </view>
                    </view>
                    <text class="comment-voice__dur">{{ r.duration }}</text>
                  </view>
                  <view v-else class="comment-text">{{ r.text }}</view>
                  <view class="comment-meta">
                    <view class="comment-meta-left">
                      <text>{{ r.meta }}</text>
                      <text class="comment-reply" @tap.stop="openReplySheet(r.id)">回复</text>
                    </view>
                    <view class="comment-like" @tap.stop="toggleReplyLike(r)">
                      <image class="comment-like-icon" :src="safeImgSrc(r.liked ? zan2 : zan1)" mode="aspectFit" />
                      <text>{{ r.likes }}</text>
                    </view>
                  </view>
                </view>
              </view>
              <view v-if="hiddenReplyCount > 0 && !replyExpanded" class="comment-expand"
                @click.stop="replyExpanded = true">
                <text>展开 {{ hiddenReplyCount }} 条回复</text>
              </view>
              <view v-if="hiddenReplyCount > 0 && replyExpanded" class="comment-expand comment-expand--collapse"
                @click.stop="replyExpanded = false">
                <text>收起</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!hideStatusTab && activeTab === 'throw'" class="throw-records">
        <view v-for="item in throwRecords" :key="item.id" class="throw-row">
          <image class="throw-row__avatar" :src="safeImgSrc(item.avatar)" mode="aspectFill"
            @click.stop="openThrowUser(item)"></image>
          <view class="throw-row__grow">
            <view class="throw-row__name-lv" @click.stop="openThrowUser(item)">
              <text class="throw-row__name">{{ item.name }}</text>
              <LevelCapsule :level="item.level" />
            </view>
          </view>
          <text class="throw-row__weight">{{ item.weightText }}</text>
          <view class="throw-row__fb">
            <text class="throw-row__fb-txt">{{ item.feedbackText }}</text>
          </view>
        </view>
      </view>
    </view>

    <ReplyComposerSheet v-model:visible="replySheetVisible" :reply-to-name="replyTargetName" @send="onReplySheetSend"
      @voice="onReplySheetVoice" @pick-image="onReplySheetPickImage" />
  </view>
</template>

<script>
import NineGridLayout from "@/components/libai-NineGridLayout/libai-NineGridLayout.vue";
import uniIcons from "@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue";
import YardCommentComposer from "@/components/yard/YardCommentComposer.vue";
import ReplyComposerSheet from "@/components/ReplyComposerSheet.vue";
import LevelCapsule from "@/components/LevelCapsule.vue";
import { safeImgSrc } from "@/utils/safeImgSrc.js";
import { openUserProfile } from "@/utils/profileNav.js";

export default {
  name: "YardReviewFeed",
  components: { NineGridLayout, uniIcons, YardCommentComposer, ReplyComposerSheet, LevelCapsule },
  props: {
    /** 为 true 时隐藏「动态 / 投粮记录」Tab（动态详情页评论流样式） */
    hideStatusTab: {
      type: Boolean,
      default: false,
    },
    /** 例如：共 2026 条评论 */
    commentTotalText: {
      type: String,
      default: "",
    },
    /** 动态详情页底部评论条（头像 + 输入框 + 麦克风 / 图片） */
    showCommentBar: {
      type: Boolean,
      default: false,
    },
    composerAvatar: {
      type: String,
      default: "/static/me/yard-feed.svg",
    },
    composerPlaceholder: {
      type: String,
      default: "有话要说，告诉她这条路并不孤单",
    },
  },
  data() {
    return {
      replySheetVisible: false,
      replySheetTarget: null,
      replyExpanded: false,
      previewReplyCount: 2,
      mainVoicePlaying: false,
      mainVoiceTimer: null,
      playingReplyId: null,
      replyVoiceTimer: null,
      mainVoiceDuration: "12″",
      mainVoiceBars: [6, 10, 5, 12, 7, 11, 8],
      mainReviewLiked: false,
      mainReviewLikes: 12,
      mockReplies: [
        {
          id: 1,
          name: "姜栋",
          tag: "楼主",
          kind: "text",
          text: "给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞",
          avatar: "/static/avatarlog.png",
          meta: "昨天 20:45 江西",
          likes: 32,
          liked: false,
        },
        {
          id: 2,
          name: "小院春风",
          kind: "text",
          text: "猫猫真可爱，下次我也带点猫粮过去～",
          avatar: "/static/user.png",
          meta: "昨天 21:12 湖北",
          likes: 8,
          liked: false,
        },
        {
          id: 3,
          name: "爱心人士",
          kind: "voice",
          duration: "8″",
          avatar: "/static/user.png",
          meta: "昨天 22:01 广东",
          likes: 5,
          liked: false,
          voiceBars: [5, 9, 6, 11, 7, 8, 6],
        },
        {
          id: 4,
          name: "夜猫子",
          kind: "text",
          text: "加油！支持小院～",
          avatar: "/static/avatarlog.png",
          meta: "今天 08:30 河南",
          likes: 3,
          liked: false,
        },
        {
          id: 5,
          name: "粮满多",
          kind: "text",
          text: "已投喂，注意查收～",
          avatar: "/static/user.png",
          meta: "今天 09:05 江苏",
          likes: 2,
          liked: false,
        },
        {
          id: 6,
          name: "橘座办事处",
          kind: "text",
          text: "下次组团去看猫！",
          avatar: "/static/avatarlog.png",
          meta: "今天 10:18 四川",
          likes: 1,
          liked: false,
        },
      ],
      reviewRowKey: "main",
      activeTab: "dynamic",
      /** 投粮记录 Tab 列表（对接接口后替换） */
      throwRecords: [
        {
          id: "t1",
          name: "平安是福",
          level: 1,
          avatar: "/static/user.png",
          weightText: "投粮200克",
          feedbackText: "已反馈2/5次",
        },
        {
          id: "t2",
          name: "平安是福",
          level: 1,
          avatar: "/static/user.png",
          weightText: "投粮200克",
          feedbackText: "已反馈2/5次",
        },
        {
          id: "t3",
          name: "平安是福",
          level: 1,
          avatar: "/static/user.png",
          weightText: "投粮200克",
          feedbackText: "已反馈2/5次",
        },
        {
          id: "t4",
          name: "平安是福",
          level: 1,
          avatar: "/static/user.png",
          weightText: "投粮200克",
          feedbackText: "已反馈2/5次",
        },
      ],
      reviewExpandedMap: {},
      reviewText:
        "小灰灰是去年冬天快过年的时候发现的流浪猫，一开始胆子很小，后面熟了之后才愿意跟我接触，希望多多投喂，谢谢，感谢大家的帮助和支持，我一定会好好照顾这些可爱的小生命，让它们健康成长。小灰灰是去年冬天快过年的时候发现的流浪猫，一开始胆子很小，后面熟了之后才愿意跟我接触，希望多多投喂，谢谢，感谢大家的帮助和支持，我一定会好好照顾这些可爱的小生命，让它们健康成长。小灰灰是去年冬天快过年的时候发现的流浪猫，一开始胆子很小，后面熟了之后才愿意跟我接触，希望多多投喂，谢谢，感谢大家的帮助和支持，我一定会好好照顾这些可爱的小生命，让它们健康成长。",
      zan1:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAeCAYAAAA/xX6fAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAF+SURBVEiJvZdbtoMgDEVPWJ3XpUOqDqA6gMiQpBMz/bjElVK10JaeL1FwmwcJEioVQvAicgXgAUBERudcvFwusWQ91cCYeSCi6+aLiM4lUFcDNLBIRGcRGQFEAEhWv9SpFMbMg153XXdWcHKxR3LxKxVbSER/wH/M7P3S2FUDkSxwzj0AQgj+60DrztyiZVkU+HD/I6AmS+5OKxG5fQVorev7fsifa2xLdQgMIfgC6zzwHNtqIDMPIjKnYdyyziZMabaedOGyLN64x5s50ey7B6U1AIBpmuatORpb/eBT2rizLswmj1uWqbL4+Z05HgCYGX3fD2TqY0wTRqDcRTapDj5szQOapkl0cGTNJ7JGrUlTmmXvyLzbV3WLd2Wr0U+ApvDffgKEKQ7NgXnhbw7MS2NToC19uuWaArd6ZVOgcefaK5sB9/poM+BeH3UoPIvU6OiUsJ5LRWRm5vGTmmp/AdL46ZRAAKAd45va6z4OALquo6MTWYUi0m/AXqu7A58a2QJRlyArAAAAAElFTkSuQmCC",
      zan2:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAcCAYAAAB/E6/TAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAE4SURBVEiJvZYxVoNAFEXvo05va+EyACcLcQG6iZBduAnX4IRhAR4b25xjZW/NtwiJRCFMQuBVw5n5//Lf8IcRZ8jS1CGtAAeAtFZZFjGxiobkeYHZqmPKK4TlUHwSC+qESG+AszR1VwFZnhc98EUD7Kr0fNAJ3cUujAN1782vpM1oUK9tO22H4qNBmN2fmL0FoK79KFBTjRtKoqq6HHSib/5qEAKthrU0dSSJa6xyEbFbdtb53o+hrv2+WgFYlr1GJm+9or4wu4lYt1ZZFjpYFBt4iaS1LMtskuTH8mNPhli5uUCTV/QOgLSZZY8UguawzsP438Swmmae3DqFIJi+os/9YGrQ4QycFKQQHuYAPbcfEuDjSom/W2OvEB6PQWZPVwItWpB/F8pEVeUxWwIvI0Ees2XfrfUHCTFt74bNhAQAAAAASUVORK5CYII=",
      list9: [
        "https://img2.baidu.com/it/u=2294066987,2848080806&fm=253&fmt=auto&app=120&f=JPEG?w=688&h=1215",
        "https://img1.baidu.com/it/u=859607673,960376049&fm=253&fmt=auto&app=138&f=JPEG?w=750&h=500",
        "https://img2.baidu.com/it/u=70470028,1003557371&fm=253&fmt=auto&app=120&f=JPEG?w=1280&h=800",
        "https://img1.baidu.com/it/u=620762706,3267928372&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500",
        "https://img1.baidu.com/it/u=2278717026,2923133725&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=665",
        "https://img0.baidu.com/it/u=1170221409,3321766761&fm=253&fmt=auto&app=138&f=JPEG?w=750&h=500",
        "https://img2.baidu.com/it/u=669729424,1761575290&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500",
        "https://img2.baidu.com/it/u=2294066987,2848080806&fm=253&fmt=auto&app=120&f=JPEG?w=688&h=1215",
        "https://img0.baidu.com/it/u=3207802179,3637851356&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500",
      ],
    };
  },
  computed: {
    reviewLimit() {
      return 100;
    },
    isReviewLong() {
      return (this.reviewText || "").length > this.reviewLimit;
    },
    reviewPreview() {
      return (this.reviewText || "").slice(0, this.reviewLimit);
    },
    visibleReplies() {
      if (this.replyExpanded) return this.mockReplies;
      return this.mockReplies.slice(0, this.previewReplyCount);
    },
    hiddenReplyCount() {
      return Math.max(0, this.mockReplies.length - this.previewReplyCount);
    },
    replyTargetName() {
      if (this.replySheetTarget === "main") return "姜栋";
      const reply = this.mockReplies.find((item) => String(item.id) === String(this.replySheetTarget));
      return reply ? reply.name : "";
    },
  },
  beforeUnmount() {
    this.clearMainVoiceTimer();
    this.clearReplyVoiceTimer();
  },
  methods: {
    safeImgSrc,
    toggleMainReviewLike() {
      if (this.mainReviewLiked) {
        this.mainReviewLiked = false
        this.mainReviewLikes = Math.max(0, this.mainReviewLikes - 1)
      } else {
        this.mainReviewLiked = true
        this.mainReviewLikes += 1
      }
    },
    toggleReplyLike(r) {
      if (!r) return
      if (r.liked) {
        r.liked = false
        r.likes = Math.max(0, r.likes - 1)
      } else {
        r.liked = true
        r.likes += 1
      }
    },
    openReviewMainUser() {
      openUserProfile({
        pawId: "review-feed-main",
        nickname: "姜栋",
        avatar: "/static/avatarlog.png",
      });
    },
    openReplyUser(r) {
      if (!r) return;
      openUserProfile({
        pawId: r.pawId || "reply-" + r.id,
        nickname: r.name,
        avatar: r.avatar || "",
      });
    },
    openThrowUser(item) {
      if (!item) return;
      openUserProfile({
        pawId: item.pawId || "throw-" + item.id,
        nickname: item.name,
        avatar: item.avatar || "",
      });
    },
    onComposerVoice() {
      this.$emit("composer-voice");
    },
    onComposerPickImage() {
      this.$emit("composer-pick-image");
    },
    clearMainVoiceTimer() {
      if (this.mainVoiceTimer) {
        clearTimeout(this.mainVoiceTimer);
        this.mainVoiceTimer = null;
      }
    },
    clearReplyVoiceTimer() {
      if (this.replyVoiceTimer) {
        clearTimeout(this.replyVoiceTimer);
        this.replyVoiceTimer = null;
      }
    },
    toggleMainVoice() {
      this.mainVoicePlaying = !this.mainVoicePlaying;
      this.clearMainVoiceTimer();
      if (this.mainVoicePlaying) {
        this.mainVoiceTimer = setTimeout(() => {
          this.mainVoicePlaying = false;
          this.mainVoiceTimer = null;
        }, 2500);
      }
    },
    playReplyVoice(r) {
      if (!r || r.kind !== "voice") return;
      this.clearReplyVoiceTimer();
      if (this.playingReplyId === r.id) {
        this.playingReplyId = null;
        return;
      }
      this.playingReplyId = r.id;
      this.replyVoiceTimer = setTimeout(() => {
        this.playingReplyId = null;
        this.replyVoiceTimer = null;
      }, 2000);
    },
    changeReview(tab) {
      this.activeTab = tab;
      this.$emit("tab-change", tab);
    },
    openReplySheet(target) {
      this.replySheetTarget = target;
      this.replySheetVisible = true;
    },
    onReplySheetSend(text) {
      this.$emit("reply-send", { text, target: this.replySheetTarget });
      uni.showToast({ title: "已发送", icon: "none" });
    },
    onReplySheetVoice() {
      uni.showToast({ title: "语音输入敬请期待", icon: "none" });
    },
    onReplySheetPickImage() {
      uni.chooseImage({
        count: 1,
        success: () => {
          uni.showToast({ title: "已选择图片（演示）", icon: "none" });
        },
      });
    },
    isReviewExpanded(key) {
      return !!this.reviewExpandedMap[key];
    },
    toggleReview(key) {
      const cur = !!this.reviewExpandedMap[key];
      this.reviewExpandedMap = { ...this.reviewExpandedMap, [key]: !cur };
    },
  },
};
</script>

<style lang="less" scoped>
.comment-cap {
  padding: 12px 27px 8px 13px;
}

.comment-cap-txt {
  font-size: 15px;
  font-weight: 500;
  color: rgba(51, 51, 51, 1);
}

.review {
  padding: 16px 27px 38px 13px;
}

.yard-review-feed--flat .review {
  padding-top: 0;
}

.status-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  margin-bottom: 16px;
}

.status-item {
  width: 66px;
  height: 24px;
  position: relative;

  .tab-text {
    display: block;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    font-size: 16px;
    font-weight: 500;
    color: rgba(153, 153, 153, 1);
    white-space: nowrap;
  }

  .tab-icon {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 66px;
    height: 10px;
    border-radius: 50px;
    background: rgba(255, 230, 15, 1);
    z-index: 1;
  }
}

.active .tab-text {
  color: rgba(0, 0, 0, 1);
}

.review-item {
  display: flex;

  .avatar {
    width: 37px;
    height: 37px;
    border-radius: 50%;
    margin-right: 7px;

    .avatar-img {
      width: 37px;
      height: 37px;
      border-radius: 50%;
    }
  }

  .review-content {
    flex: 1;

    .review-name {
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0px;
      line-height: 21.72px;
      color: rgba(51, 51, 51, 1);
      vertical-align: middle;
      display: flex;
      align-items: center;
      margin-right: 4px;
    }

    .level {
      margin-left: 6px;
      width: 28px;
      height: 13px;
      opacity: 1;
      border-radius: 15px;
      background: rgba(82, 52, 0, 1);
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 11px;
      font-weight: 500;
      line-height: 7px;
      color: rgba(246, 225, 184, 1);
    }

    .review-text {
      display: flex;
      align-items: center;
      min-height: 24px;
      margin-top: 6px;

      .avatar-group {
        width: 68px;
        height: 24px;
        flex: 0 0 68px;
        position: relative;
        display: flex;
        align-items: center;
        align-self: center;

        .avatar-box {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          position: absolute;
          top: 1px;
          border: 1px solid #fff;
        }

        .avatar-img {
          width: 22px;
          height: 22px;
        }
      }

      .review-text-full {
        margin-left: 6px;
        height: 22px;
        opacity: 1;
        background: rgba(245, 245, 245, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0 8px;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0px;
        line-height: 20px;
        color: rgba(56, 77, 123, 1);
        box-sizing: border-box;
        align-self: center;
      }
    }

    .review-context {
      margin: 6px 0 10px;
      width: 100%;

      .review-long-text {
        font-size: 14px;
        font-weight: 400;
        line-height: 22.5px;
        color: rgba(0, 0, 0, 1);
      }

      .review-toggle {
        font-size: 16px;
        font-weight: 400;
        line-height: inherit;
        color: rgba(87, 107, 149, 1);
        vertical-align: baseline;
        display: inline;
      }

      .review-toggle-word {
        display: inline-block;
        white-space: nowrap;
      }
    }

    .review-media {
      padding-right: 24px;
      box-sizing: border-box;
      margin-top: 8px;
    }

    .reply {
      width: 100%;
      padding-right: 14px;
      box-sizing: border-box;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;

      .reply-info {
        font-size: 12px;
        font-weight: 400;
        letter-spacing: 0px;
        line-height: 17.38px;
        color: rgba(140, 140, 140, 1);
        display: flex;
        align-items: center;

        .reply-btn {
          color: rgba(56, 77, 123, 1);
          margin-left: 6px;
        }
      }

      .reply-num {
        display: flex;
        align-items: center;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0px;
        line-height: 1;
        color: rgba(104, 104, 104, 1);

        .reply-icon {
          width: 14px;
          height: 14px;
          margin-right: 5px;
          flex-shrink: 0;
        }
      }
    }

    .voice-msg {
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      margin-top: 10px;
      padding: 8px 12px;
      border-radius: 10px;
      background: rgba(245, 247, 252, 1);
      max-width: 220px;
    }

    .voice-msg__inner {
      display: flex;
      flex-direction: row;
      align-items: center;
      flex: 1;
      min-width: 0;
    }

    .voice-msg__wave {
      display: flex;
      flex-direction: row;
      align-items: center;
      margin-left: 8px;
      height: 18px;
      gap: 3px;
    }

    .voice-msg__bar {
      width: 3px;
      border-radius: 2px;
      background: rgba(56, 77, 123, 0.65);
      align-self: center;
    }

    .voice-msg--playing .voice-msg__bar {
      animation: voice-bar-pulse 0.55s ease-in-out infinite alternate;
    }

    .voice-msg--playing .voice-msg__bar:nth-child(2n) {
      animation-delay: 0.12s;
    }

    .voice-msg--playing .voice-msg__bar:nth-child(3n) {
      animation-delay: 0.24s;
    }

    .voice-msg__dur {
      margin-left: 10px;
      font-size: 13px;
      font-weight: 500;
      color: rgba(56, 77, 123, 1);
      flex-shrink: 0;
    }

    @keyframes voice-bar-pulse {
      from {
        transform: scaleY(0.45);
        opacity: 0.65;
      }

      to {
        transform: scaleY(1);
        opacity: 1;
      }
    }

    .comment-list {
      margin-top: 12px;
      padding-right: 14px;
      box-sizing: border-box;

      .comment-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 12px;

        .comment-avatar-img {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 10px;
          flex: 0 0 auto;
          background: #e9e9e9;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .comment-body {
          flex: 1;
          min-width: 0;

          .comment-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .comment-name {
            display: flex;
            align-items: center;
            font-size: 14px;
            font-weight: 500;
            color: rgba(51, 51, 51, 1);

            .comment-tag {
              margin-left: 6px;
              padding: 1px 6px;
              border-radius: 50px;
              background: rgba(255, 236, 239, 1);
              font-size: 10px;
              font-weight: 500;
              color: rgba(255, 0, 56, 1);
              line-height: 14px;
            }
          }

          .comment-like {
            display: flex;
            align-items: center;
            font-size: 13px;
            font-weight: 500;
            line-height: 1;
            color: rgba(104, 104, 104, 1);

            .comment-like-icon {
              width: 14px;
              height: 14px;
              margin-right: 5px;
              flex-shrink: 0;
            }
          }

          .comment-text {
            margin-top: 6px;
            font-size: 14px;
            line-height: 20px;
            color: rgba(0, 0, 0, 1);
            word-break: break-all;
          }

          .comment-meta {
            margin-top: 6px;
            font-size: 12px;
            color: rgba(140, 140, 140, 1);
            display: flex;
            align-items: center;
            justify-content: space-between;

            .comment-meta-left {
              display: flex;
              align-items: center;
              gap: 10px;
            }

            .comment-reply {
              color: rgba(56, 77, 123, 1);
            }
          }
        }
      }

      .comment-voice {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-top: 8px;
      }

      .comment-voice__inner {
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        padding: 6px 10px;
        border-radius: 8px;
        background: rgba(245, 247, 252, 1);
        max-width: 180px;
      }

      .comment-voice__inner--on .comment-voice__bar {
        animation: voice-bar-pulse 0.5s ease-in-out infinite alternate;
      }

      .comment-voice__inner--on .comment-voice__bar:nth-child(2n) {
        animation-delay: 0.1s;
      }

      .comment-voice__wave {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-left: 6px;
        height: 14px;
        gap: 2px;
      }

      .comment-voice__bar {
        width: 2px;
        border-radius: 1px;
        background: rgba(56, 77, 123, 0.7);
      }

      .comment-voice__dur {
        margin-left: 8px;
        font-size: 12px;
        font-weight: 500;
        color: rgba(56, 77, 123, 1);
      }

      .comment-expand {
        padding: 8px 0 4px;
        font-size: 14px;
        font-weight: 500;
        color: rgba(56, 77, 123, 1);
      }

      .comment-expand--collapse {
        color: rgba(140, 140, 140, 1);
        font-weight: 400;
      }
    }
  }
}

/* 投粮记录 Tab：与设计稿 rectangle / line / frame 对齐 */
.throw-records {
  width: 100%;
  box-sizing: border-box;
}

.throw-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 166rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(228, 228, 228, 1);
  box-sizing: border-box;
}

.throw-row:last-child {
  border-bottom: none;
}

.throw-row__avatar {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  flex-shrink: 0;
  background: #f0f0f0;
}

.throw-row__grow {
  flex: 1;
  min-width: 0;
  margin-left: 16rpx;
}

.throw-row__name-lv {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
  column-gap: 8rpx;
}

.throw-row__name {
  font-size: 30rpx;
  font-weight: 400;
  color: rgba(153, 153, 153, 1);
  line-height: 43rpx;
}

.throw-row__weight {
  flex-shrink: 0;
  margin-left: 12rpx;
  font-size: 28rpx;
  font-weight: 400;
  color: rgba(51, 51, 51, 1);
  line-height: 40rpx;
}

.throw-row__fb {
  flex-shrink: 0;
  margin-left: 8rpx;
  min-width: 146rpx;
  height: 44rpx;
  padding: 2rpx 6rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(247, 247, 248, 1);
  border-radius: 4rpx;
}

.throw-row__fb-txt {
  font-size: 24rpx;
  font-weight: 500;
  line-height: 35rpx;
  color: rgba(56, 77, 123, 1);
}
</style>
