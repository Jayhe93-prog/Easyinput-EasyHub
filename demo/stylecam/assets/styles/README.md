# 风格样片目录

把风格样片图片放进对应风格 id 的文件夹，命名规则如下（可选放 1~3 张）：

```
assets/styles/<风格id>/
├── low.png      # 低强度（0~33）
├── mid.png      # 中强度（34~66）
├── high.png     # 高强度（67~100）
└── sample.png   # 默认样片（未分强度时使用）
```

缺少某张图时自动回退：先找对应强度图 → 再找 sample.png → 最后使用程序生成的「风格化示意卡」。
所有未接入真实 AI 的生成都会在页面与作品上标注「本地演示」。

## 风格 id 对照（十组课程风格）

| id | 风格 |
|---|---|
| knit | 毛线旅行家 |
| bricks | 积木星球 |
| mecha | 机甲模型盒 |
| retro | 掌上像素梦 |
| clay | 软陶盲盒 |
| paper | 纸间剧场 |
| liquid | 液态银诗 |
| jelly | 果冻宇宙 |
| terrarium | 口袋生态舱 |
| screenprint | 孔版夏日 |

## 个人风格

个人风格放 `custom-<你的名字>/`（例如 custom-plush），并把它注册到 `js/styles.js` 的 `SC.PERSONAL_STYLES` 中（含 id、name、tagline、palette、pattern）。
