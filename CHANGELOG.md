# Changelog

## [1.0.0] - 2026-10-24

First public release. / 开源首发版本。

- **Tesla Vehicle Card** — full-screen style control card for Tesla vehicles:
  live configurator-rendered car images in three views, battery / charging /
  climate panels, quick actions, and door/window alerts. The element is
  `custom:tesla-vehicle-card`; the private builds' `custom:model-y-card`
  stays registered as a legacy alias, so existing dashboards keep working.
  特斯拉车辆全屏感控制卡片：官网配置器实时渲染车图（三视角）、电量 / 充电 /
  空调面板、快捷操作与门窗未关告警。元素名为 `custom:tesla-vehicle-card`；
  私有版旧名 `custom:model-y-card` 保留为兼容别名，现有仪表盘无需改动。
- **Multi-model support** — new `model` option with presets for Model Y
  refresh (`modely_juniper`, the default; existing configs are unchanged),
  Model Y 2020–2025 (`modely_legacy`), Model 3 2017–2024 (`model3_legacy`),
  Model S 2021+ (`models_refresh`) and Model X 2021+ (`modelx_refresh`).
  All paint / wheel / interior option codes were verified against Tesla's
  live configurator on 2026-10-24; unverified options are not offered.
  New `trim` option overrides a preset's compositor trim code, and the new
  `image_options` escape hatch accepts a full options string (e.g. from your
  Tesla account image URL) for models without a preset, such as the Model 3
  "Highland" or pre-refresh Model S. Model S/X climate panels fall back to
  the exterior render (they have no seat view), and loaded car images are
  sampled to detect the configurator's shadow-only empty renders.
  多车型支持：新增 `model` 配置与五款车型预设（默认 `modely_juniper`，老配置
  行为不变）；全部选项码经 2026-10-24 官网实测验证，未验证项不提供。新增
  `trim` 覆盖与 `image_options` 逃生舱（粘贴完整参数串，覆盖无预设车型如
  Model 3 焕新版、改款前 Model S）。S/X 空调面板背景回退外观图；车图加载后
  做空影图采样检测。
- **Command feedback** — service calls are now awaited: the success toast
  appears only after a call actually succeeds, and failures show an error
  toast with the reason. Destructive actions (unlock, frunk, trunk, window
  vent, horn) use two-tap confirmation instead of `window.confirm`.
  指令反馈：服务调用改为等待结果，成功才报成功、失败弹出原因；危险操作改用
  两次点击确认，替代 window.confirm。
- **Correct units** — range and charge rate now use each entity's
  `unit_of_measurement` instead of hardcoded km / km/h.
  单位修正：续航与充电速度改为读实体的 unit_of_measurement，不再写死 km。
- **Missing entities** — action buttons whose entity does not exist are no
  longer rendered (lock, climate, charge, trunk, frunk, windows, sentry,
  flash, horn, wake, charge port).
  实体缺失时对应按钮不渲染（锁、空调、充电、后备箱、前备箱、车窗、哨兵、
  闪灯、鸣笛、唤醒、充电口）。
- **Tyre pressure** — new 2×2 tyre-pressure block in the "more" panel
  (Fleet `tire_pressure_*` or Teslemetry `tpms_pressure_*` sensors, resolved
  in order); hidden entirely when no sensor exists.
  胎压：「更多」面板内新增 2×2 胎压格（Fleet / Teslemetry 两种命名候选按序
  解析），无任何胎压实体时整段隐藏。
- **Location & navigation** — new info row under the header: while navigating
  it shows destination, remaining distance and ETA (active-route sensors);
  otherwise the vehicle's location from its device tracker.
  位置与导航：标题下新增信息行，导航中显示目的地、剩余距离与预计时间，
  否则显示车辆定位。
- **Data freshness** — the header meta line shows how long ago the vehicle
  data was last updated ("updated 5 min ago").
  数据新鲜度：头部信息行显示数据最后更新的相对时间。
- **Visual editor** — `getConfigElement()` with model-linked dropdowns for
  model / paint / wheels / interior, plus view, language, status-row switch
  and the advanced fields.
  可视化编辑器：实现 getConfigElement()，车型/车漆/轮毂/内饰下拉随车型联动。
- **Icons** — all icons redrawn from scratch as original line-style artwork
  (1.8 stroke, round caps) in the visual language of the Tesla app; not
  Tesla's official icon assets.
  图标：全部按 Tesla App 的线条视觉语言原创重绘（stroke 渲染），非官方素材。
- **i18n** — the UI is available in Chinese and English. New `language`
  option: `"zh"` | `"en"` | `"auto"` (default `"auto"` follows the Home
  Assistant language via `hass.language` / `hass.locale.language`).
  界面支持中英双语，新增 `language` 配置项，缺省跟随 Home Assistant 语言。
- **`show_status` option** — the status row (doors & windows / charge port /
  climate / charge limit) is now controlled by the new `show_status` option
  and is hidden by default. Note: in the private builds the row was computed
  but never actually inserted into the template (dead code), so hidden-by-
  default also matches what those builds actually displayed. `min_height`
  now only controls card sizing.
  新增 `show_status` 配置项：状态排默认不显示，设为 true 才显示。注：私人
  开发期该状态排只计算未插入模板（死代码），默认隐藏与旧版实际显示一致；
  `min_height` 今后只负责卡片撑高。
- **Release packaging** — README in English and Chinese, MIT license,
  `hacs.json`, dashboard examples and Node smoke tests.
  补齐仓库文件：中英双语 README、MIT 许可证、hacs.json、配置示例与冒烟测试。

---

Versions 1.6.6 and earlier were private development builds and were never
publicly released.
此前 1.6.6 及更早为私人开发版本，未公开发布。
