# pages.json 页面功能说明

下面的内容与 `pages.json` 保持相同的层级、顺序和配置；仅使用 `//` 补充页面功能及配置说明。此文件是阅读文档，不作为 JSON 配置文件直接解析。

```jsonc
{
  "pages": [
    {
      // 主首页：按城市浏览动态和小院，提供搜索、排行榜、动态分类等入口。
      "path": "pages/index/index",
      "style": {
        "navigationStyle": "custom"
      }
    },
    {
      // 自营服务首页：承载平台自营服务入口及自营业务内容。
      "path": "pages/selfRun/index",
      "style": {
        "navigationBarTitleText": "uni-app"
      }
    },
    {
      // 消息首页：汇总互动、订单、服务订单、系统、活动和宠物消息。
      "path": "pages/message/index",
      "style": {
        "navigationStyle": "custom"
      }
    },
    {
      // 个人中心：查看个人资料、订单、小院、领养、勋章及评审等个人业务入口。
      "path": "pages/me/index",
      "style": {
        "navigationStyle": "custom"
      }
    }
  ],
  "subPackages": [
    {
      // 动态业务分包：动态浏览、发布、详情及发布结果相关页面。
      "root": "packages/dynamic",
      "pages": [
        {
          // 动态详情：查看动态内容、作者信息、互动及关联业务信息。
          "path": "pages/detail/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        },
        {
          // 动态深链入口：根据外部分享或深链接参数定位并打开动态内容。
          "path": "pages/deep-link/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        },
        {
          // 动态编辑器：创建或编辑动态，选择内容、图片及关联信息。
          "path": "pages/editor/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 动态发布结果：展示发布成功或失败状态，并提供后续操作入口。
          "path": "pages/result/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        }
      ]
    },
    {
      // 认证业务分包：登录、手机号绑定、短信验证和实名认证流程。
      "root": "packages/auth",
      "pages": [
        {
          // 登录页：完成用户登录并进入逢猫。
          "path": "pages/login/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        },
        {
          // 手机号绑定页：为账号绑定或补充手机号。
          "path": "pages/phone-bind/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        },
        {
          // 短信验证页：输入并校验手机短信验证码。
          "path": "pages/sms-verify/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        },
        {
          // 实名认证页：填写并提交用户实名信息。
          "path": "pages/real-name/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        },
        {
          // 认证结果页：展示实名认证提交、审核或完成结果。
          "path": "pages/verification-result/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        }
      ]
    },
    {
      // 领养业务分包：领养申请、审核、进度、额度和奖励相关页面。
      "root": "packages/adoption",
      "pages": [
        {
          // 我的领养：查看本人发起或参与的领养记录。
          "path": "pages/mine/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 领养确认：确认领养信息、责任及后续流程。
          "path": "pages/confirmation/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 领养进度：跟踪领养申请从提交到完成的流程状态。
          "path": "pages/progress/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 领养评审列表：查看待处理或历史领养评审任务。
          "path": "pages/review/list/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 领养评审详情：查看申请材料并完成评审操作。
          "path": "pages/review/detail/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 领养陪审详情：查看评审议题、证据并提交陪审意见。
          "path": "pages/jury/detail/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 领养申请：填写领养人及宠物相关资料并提交申请。
          "path": "pages/apply/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 领养结果：展示领养申请或审核的最终结果。
          "path": "pages/result/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        },
        {
          // 领养支持：展示领养支持方式及相关帮助信息。
          "path": "pages/support/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        },
        {
          // 领养额度：查看用户当前可用的领养额度或资格。
          "path": "pages/quota/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 领养额度详情：查看额度明细、来源和使用记录。
          "path": "pages/quota/detail/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 领养奖励领取：查看并领取领养相关奖励。
          "path": "pages/reward/claim/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        }
      ]
    },
    {
      // 账号业务分包：设置、个人资料、等级、勋章及邀请等个人成长功能。
      "root": "packages/account",
      "pages": [
        {
          // 设置页：管理账号、隐私、通知等应用设置。
          "path": "pages/settings/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F7F8FA"
          }
        },
        {
          // 任务页：查看可参与的任务、任务进度及任务奖励。
          "path": "pages/tasks/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 个人资料编辑：修改头像、昵称及个人资料信息。
          "path": "pages/profile/editor/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 个人资料主页：查看用户公开资料、动态及个人信息。
          "path": "pages/profile/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 关系页：查看关注、粉丝或其他用户关系。
          "path": "pages/relations/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        },
        {
          // 浏览历史：查看用户浏览过的动态或内容记录。
          "path": "pages/history/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F8F8F8"
          }
        },
        {
          // 用户等级：查看当前等级、成长值和升级进度。
          "path": "pages/level/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFF8E8"
          }
        },
        {
          // 等级规则：说明等级、成长值及升级规则。
          "path": "pages/level/rules/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F3F4F6"
          }
        },
        {
          // 年度报告：汇总用户年度参与、帮助动物等行为数据。
          "path": "pages/annual-report/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#1A6FD4"
          }
        },
        {
          // 帮助过的动物：查看用户曾经帮助、投喂或参与救助的动物。
          "path": "pages/helped-animals/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        },
        {
          // 勋章中心：查看已获得及可获取的用户勋章。
          "path": "pages/medals/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 勋章地图：以地图或路径形式浏览勋章收集进度。
          "path": "pages/medals/map/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 勋章成就详情：查看单项勋章或成就的条件与进度。
          "path": "pages/medals/achievement/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 邀请页：生成或分享邀请信息，邀请新用户加入。
          "path": "pages/invite/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        }
      ]
    },
    {
      // 动物业务分包：动物档案、编辑、品种选择、相册和云养相关功能。
      "root": "packages/animal",
      "pages": [
        {
          // 动物编辑：创建或编辑动物档案信息。
          "path": "pages/editor/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 品种选择：选择或搜索动物品种。
          "path": "pages/breed-picker/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 我的动物：查看用户维护或关联的动物档案。
          "path": "pages/mine/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 云养动物：查看用户赞助或云养中的动物。
          "path": "pages/sponsored/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 动物详情：查看动物档案、状态、动态及领养等相关信息。
          "path": "pages/detail/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 动物相册：查看和管理动物照片。
          "path": "pages/album/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        }
      ]
    },
    {
      // 小院业务分包：小院创建、管理、动物列表及认证流程。
      "root": "packages/yard",
      "pages": [
        {
          // 小院详情：查看小院资料、动物、动态和服务信息。
          "path": "pages/detail/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        },
        {
          // 小院入驻引导：引导用户了解并开始创建或管理小院。
          "path": "pages/onboarding/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 创建小院：填写小院基础资料并创建小院。
          "path": "pages/create/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F6F6F6"
          }
        },
        {
          // 小院编辑：修改小院资料、图片和展示信息。
          "path": "pages/editor/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 小院动物列表：浏览小院收容或照护的动物。
          "path": "pages/animals/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 小院动物管理：新增、编辑或管理小院中的动物档案。
          "path": "pages/manage/animals/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 小院认证：提交小院认证资料并查看认证状态。
          "path": "pages/certification/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F0F0F0"
          }
        }
      ]
    },
    {
      // 地址业务分包：收货或服务地址的管理及地区选择。
      "root": "packages/address",
      "pages": [
        {
          // 地址列表：查看、选择和管理已保存的地址。
          "path": "pages/list/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F8F8F8"
          }
        },
        {
          // 地址编辑：新增或修改地址信息。
          "path": "pages/editor/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F7F7F7"
          }
        },
        {
          // 地区选择：选择省、市、区等行政区域。
          "path": "pages/region-picker/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F6F6F6"
          }
        }
      ]
    },
    {
      // 陪审业务分包：为用户提供待处理的陪审任务队列。
      "root": "packages/jury",
      "pages": [
        {
          // 陪审任务队列：浏览并进入待处理的评审任务。
          "path": "pages/queue/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        }
      ]
    },
    {
      // 救助业务分包：救助申请、筹资、证明材料、审核和进度跟踪。
      "root": "packages/rescue",
      "pages": [
        {
          // 救助进度：跟踪救助申请或救助事件的处理进度。
          "path": "pages/progress/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 救助筹资：查看救助筹资目标、金额及参与情况。
          "path": "pages/fund/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 救助详情：查看救助对象、事件经过、进度和相关材料。
          "path": "pages/detail/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 救助评审列表：查看待处理或历史救助评审任务。
          "path": "pages/review/list/index",
          "style": {
            "navigationStyle": "custom"
          }
        },
        {
          // 救助评审详情：查看救助申请材料并完成评审。
          "path": "pages/review/detail/index",
          "style": {
            "navigationStyle": "custom"
          }
        },
        {
          // 救助证明列表：查看已提交的救助证明材料。
          "path": "pages/proof/list/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 创建救助证明：填写并上传救助过程证明材料。
          "path": "pages/proof/create/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 我的救助：查看本人发起或参与的救助记录。
          "path": "pages/mine/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 救助申请：提交动物救助需求及相关资料。
          "path": "pages/apply/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 救助结果：展示救助申请或审核的最终结果。
          "path": "pages/result/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        }
      ]
    },
    {
      // 投喂业务分包：投喂订单、订单详情及投喂结果相关页面。
      "root": "packages/feeding",
      "pages": [
        {
          // 我的投喂：查看本人发起或参与的投喂订单。
          "path": "pages/mine/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 小院投喂订单：小院侧查看和处理收到的投喂订单。
          "path": "pages/yard-orders/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 投喂订单详情：查看订单信息、投喂状态及处理记录。
          "path": "pages/order/detail/index",
          "style": {
            "navigationStyle": "custom"
          }
        },
        {
          // 投喂结果：展示投喂下单或处理结果。
          "path": "pages/result/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFFFFF"
          }
        }
      ]
    },
    {
      // 开发调试页面：仅用于图标对比和界面治理验证，不属于正式业务流程。
      "root": "pages/dev",
      "pages": [
        {
          // Paw 图标实验室：预览和核对 PawIcon 图标表现。
          "path": "paw-icon-lab",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 小院投喂图标实验室：对比 yard-feed 图标的不同实现效果。
          "path": "yard-feed-icon-lab",
          "style": {
            "navigationBarTitleText": "yard-feed 图标对比",
            "navigationBarBackgroundColor": "#F5F6F7",
            "navigationBarTextStyle": "black",
            "backgroundColor": "#F5F6F7"
          }
        },
        {
          // 治理测试夹具：验证 UI 治理规则和相关自动化检查。
          "path": "governance-fixture",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        }
      ]
    },
    {
      // 发现业务分包：城市选择、内容搜索及排行榜。
      "root": "packages/discovery",
      "pages": [
        {
          // 城市选择：选择首页内容和服务使用的城市。
          "path": "pages/city-picker/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 搜索页：搜索小院、动物或其他平台内容。
          "path": "pages/search/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        },
        {
          // 排行榜：查看用户、小院或相关业务数据排行。
          "path": "pages/ranking/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#FFF8E8"
          }
        }
      ]
    },
    {
      // 消息业务分包：查看具体消息分类下的消息列表。
      "root": "packages/message",
      "pages": [
        {
          // 消息列表：展示指定消息分类的消息详情和历史记录。
          "path": "pages/list/index",
          "style": {
            "navigationStyle": "custom",
            "backgroundColor": "#F5F5F5"
          }
        }
      ]
    }
  ],
  // 自定义底部 TabBar：对应首页、自营、消息和个人中心四个主入口。
  "tabBar": {
    "custom": true,
    "color": "#8c8c8c",
    "selectedColor": "#333333",
    "backgroundColor": "#ffffff",
    "borderStyle": "black",
    "list": [
      {
        // 首页 Tab。
        "pagePath": "pages/index/index",
        "text": "首页"
      },
      {
        // 自营 Tab。
        "pagePath": "pages/selfRun/index",
        "text": "自营"
      },
      {
        // 消息 Tab。
        "pagePath": "pages/message/index",
        "text": "消息"
      },
      {
        // 个人中心 Tab。
        "pagePath": "pages/me/index",
        "text": "我"
      }
    ]
  },
  // 全局页面默认配置：未单独覆盖的导航栏和页面背景使用以下值。
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "uni-app",
    "navigationBarBackgroundColor": "#F8F8F8",
    "backgroundColor": "#F8F8F8",
    "app-plus": {
      // App 端页面背景色；小程序端不使用此分支。
      "background": "#efeff4"
    }
  }
}
```
