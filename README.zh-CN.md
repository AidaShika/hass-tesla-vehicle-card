# 特斯拉车辆卡片（Tesla Vehicle Card）

为 **特斯拉车辆** 打造的 Home Assistant 全屏感控制卡片——单文件、零依赖，车图由特斯拉官网配置器实时渲染。支持 Model Y（焕新版与 2020–2025 旧款）、Model 3（2017–2024）、Model S / Model X 改款（2021+）。卡片元素名为 `custom:tesla-vehicle-card`；私有版旧名 `custom:model-y-card` 保留为兼容别名，已有仪表盘无需改动。

English version: [README.md](README.md) ／ 日本語版：[README.ja.md](README.ja.md)

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=AidaShika&repository=hass-tesla-vehicle-card&category=plugin)

![特斯拉车辆卡片](docs/screenshot-main.jpg)

## 特性

- **就是你的那台车**——车图是特斯拉官网配置器的官方渲染图，按你的车型 / 车漆 / 轮毂 / 内饰选项代码实时生成。不用下载图包、不用自己截屏备图；在车图上左右滑动或点击即可切换前 45° / 侧面 / 后 45° 三个视角。
- **五款车型、码表全部实测**——内置 Model Y 焕新版（Juniper）、Model Y 2020–2025、Model 3 2017–2024、Model S 2021+、Model X 2021+ 预设；表中每个选项码都于 2026-10-24 对特斯拉官网配置器逐一验证过。
- **无预设车型有逃生舱**——Model 3 焕新版（Highland）、改款前 Model S 等没有预设的车型，把你自己特斯拉账户车图 URL 里的完整 `image_options` 串粘贴进来即可原样使用。
- **车况一目了然**——电量与续航（按实体自身单位显示）、总里程、系统版本（有新版本时提示）、在线/休眠与上锁状态、数据新鲜度（如「5 分钟前更新」）、车内/车外温度、哨兵状态、四轮胎压；车门、车窗、前备箱或后备箱未关时有红色告警。
- **位置与导航**——导航中信息行显示目的地、剩余距离与预计到达时间；否则按车辆定位实体显示所在位置。
- **空调面板**——开关、设定温度、前排座椅加热、方向盘加热、除霜，以及保持 / 宠物 / 露营车内模式，背景为官方内饰渲染图（S/X 无内饰视角，改用外观图）。
- **充电面板**——充电状态、功率、速度、本次充入、充满还需时间，充电上限与充电电流滑块，开始/停止充电与充电口控制。
- **快捷操作、如实反馈**——锁车/解锁、前备箱、后备箱、车窗通风、哨兵、闪灯、鸣笛。对应实体不存在的按钮直接不显示，不会点了才报错；指令等服务调用真正成功后才报成功，失败弹出原因；危险操作改为两次点击确认（点一次置待确认、再点执行），不再用浏览器原生弹窗。车辆休眠时指令会先唤醒并等其上线（中途又睡过去会自动重试一次）；有软件更新且更新实体支持安装时，版本徽章可两击确认直接安装，安装中显示进度。
- **可视化编辑器**——可在 HA 卡片编辑器里用表单配置：车型、车漆、轮毂、内饰均为下拉选择且随车型联动，不必写 YAML。
- **中英日三语**——`language` 配置项可选中文 / 英文 / 日文，或自动跟随 Home Assistant 的语言。日文用词对齐特斯拉日版 App。
- **零依赖**——单个纯 JavaScript 文件，无需构建，不依赖其他卡片。

## 截图

全部截图（含顶部主图）均为卡片本体以演示数据渲染。

|  |  |
|---|---|
| ![导航行与侧面视角](docs/screenshot-nav-red.jpg) | ![尾部视角，珍珠白](docs/screenshot-rear-white.jpg) |
| 行驶中：导航信息行（目的地、剩余距离、预计到达）——焕新版 Model Y，烈焰红，侧面视角 | 尾部 3/4 视角——焕新版 Model Y，珍珠白 |
| ![旧款 Model Y，深蓝](docs/screenshot-legacy-blue.jpg) | ![改款 Model S，纯黑](docs/screenshot-model-s.jpg) |
| Model Y 2020–2025 预设，深蓝金属漆 | Model S 2021+ 预设，纯黑 |
| ![旧款 Model 3，红色多涂层](docs/screenshot-model-3.jpg) | ![改款 Model X，珍珠白](docs/screenshot-model-x.jpg) |
| Model 3 2017–2024 预设，红色多涂层 | Model X 2021+ 预设，珍珠白 |
| ![充电面板](docs/screenshot-charge.jpg) | ![空调面板](docs/screenshot-climate.jpg) |
| 充电面板：充电状态、功率、速率、已充量、剩余时间、上限与电流滑杆 | 空调面板（官网内饰渲染图打底）：目标温度、座椅与方向盘加热 |
| ![更多面板与胎压](docs/screenshot-more-tpms.jpg) | ![中文界面与状态排](docs/screenshot-status-zh.jpg) |
| 更多面板：快捷操作与胎压四格 | 中文界面 + 可选状态排（`show_status: true`） |
| ![可视化编辑器](docs/screenshot-editor.jpg) |  |
| 可视化编辑器：颜色/轮毂/内饰随车型联动的下拉选项，无需写 YAML |  |

## 前提条件

- Home Assistant 中已接入遵循 **Tesla Fleet / Teslemetry** 实体命名风格的特斯拉集成（官方 Tesla Fleet 集成可直接使用）。
- 显示仪表的设备能访问 `static-assets.tesla.com`（用于加载车图）。

## 安装

### 通过 HACS（自定义仓库）

1. 在 Home Assistant 中打开 **HACS → 右上角 ⋮ → Custom repositories（自定义仓库）**。
2. 添加 `https://github.com/AidaShika/hass-tesla-vehicle-card`，类别选 **Dashboard**（Lovelace）。
3. 在 HACS 中找到 **Tesla Vehicle Card** 并下载。
4. 刷新浏览器 / 完全重启手机 App。

### 手动安装

1. 从本仓库获取 `tesla-vehicle-card.js`——在仓库中打开该文件下载原始文件，或从 [Releases 页面](https://github.com/AidaShika/hass-tesla-vehicle-card/releases) 的源码压缩包（zip / tar.gz）中解出。
2. 复制到 Home Assistant 的 `/config/www/tesla-vehicle-card.js`。
3. 进入 **设置 → 仪表盘 → ⋮ → 资源 → 添加资源**：
   - URL：`/local/tesla-vehicle-card.js`
   - 资源类型：**JavaScript 模块**
4. 刷新浏览器。

> 从私有 1.x 版（`custom:model-y-card`）过来的？旧元素名保留为兼容别名，现有仪表盘无需改动、照常工作；新配置请用 `custom:tesla-vehicle-card`。

## 配置

可用可视化编辑器添加，也可写 YAML（示例见 [examples/dashboard.yaml](examples/dashboard.yaml)）：

```yaml
type: custom:tesla-vehicle-card
vehicle: my_model_y
name: My Model Y
```

| 配置项 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `vehicle` | **是** | — | 实体 ID 中的车辆前缀（如 `my_model_y`，对应 `sensor.my_model_y_battery_level`）。 |
| `name` | 否 | `Model Y` | 卡片顶部显示的名称。 |
| `model` | 否 | `modely_juniper` | 车型预设：`modely_juniper` \| `modely_legacy` \| `model3_legacy` \| `models_refresh` \| `modelx_refresh`。老配置不写 `model` 即等同于 `modely_juniper`，行为不变。 |
| `paint` | 否 | 随车型 | 车漆键名——可选值随 `model` 而定，见下表。 |
| `wheels` | 否 | 随车型 | 轮毂尺寸——可选值随 `model` 而定，见下表。 |
| `interior` | 否 | 随车型 | 内饰键名——可选值随 `model` 而定，见下表。 |
| `view` | 否 | `3qtr` | 默认视角：`3qtr` \| `side` \| `rear`；在车图上滑动或点击可切换。 |
| `climate` | 否 | `climate.{vehicle}_climate` | 空调实体 ID 与推导结果不同时在此指定。 |
| `entities` | 否 | — | 按内部键名逐项覆盖推导出的实体（见下文）。 |
| `language` | 否 | `auto` | 界面语言：`zh` \| `en` \| `ja` \| `auto`（跟随 Home Assistant 语言）。 |
| `show_status` | 否 | `false` | 是否显示状态排（门窗 / 充电口 / 空调 / 充电上限）。默认不显示，设为 `true` 才显示；与 `min_height` 无关。 |
| `min_height` | 否 | — | 把卡片撑到固定最小高度（px），如手机全屏仪表盘可用 `876`。 |
| `trim` | 否 | 随车型 | 高级项：覆盖该车型的配置器 trim 码（如旧款 Model 3 填 `MT317` 可得到 2021+ 黑化饰条造型及其 Performance 轮毂）。 |
| `image_options` | 否 | — | 逃生舱：完整的配置器 options 串（见下文）。设置后 `paint` / `wheels` / `interior` / `trim` 被忽略。 |

### 车型与已验证选项

选项码验证日期：**2026-10-24**（对特斯拉官网配置器逐组合实测）。只提供已验证项——配置器对任意一个无效码会整串拒绝（412），且缺 trim 码时会静默返回一张只有地面阴影的空图，所以预设从不猜码。

| 车型（`model:`） | 车漆 | 轮毂 | 内饰 |
| --- | --- | --- | --- |
| `modely_juniper` — Model Y 焕新版 | `stealth_grey` 星空灰（PN01）、`quicksilver` 快银（PN00）、`pearl_white` 珍珠白（PPSW）、`solid_black` 曜石黑（PBSB）、`ultra_red` 烈焰红（PR01）、`deep_blue` 深蓝（PPSB） | `19` Crossflow（WY19P）、`20` Helix 2.0（WY20A） | `black`（IPB10）、`white`（IPW10） |
| `modely_legacy` — Model Y 2020–2025 | `pearl_white` 珍珠白（PPSW）、`midnight_silver` 午夜银灰（PMNG）、`deep_blue` 深蓝（PPSB）、`red_multicoat` 红色多涂层（PPMR）、`solid_black` 纯黑（PBSB）、`quicksilver` 水银银（PN00）、`ultra_red` 烈焰红（PR01） | `19` Gemini（WY19B）、`20` Induction（WY20P） | `black`（INPB0）、`white`（INPW0） |
| `model3_legacy` — Model 3 2017–2024 | `midnight_silver` 午夜银灰（PMNG）、`pearl_white` 珍珠白（PPSW）、`deep_blue` 深蓝（PPSB）、`solid_black` 纯黑（PBSB）、`red_multicoat` 红色多涂层（PPMR） | `18` Aero（W38B）、`19` Sport（W39B）、`20` Performance（W33D，需 Performance 的 `trim` 如 `MT317`） | `black`（IN3PB）、`white`（IN3PW） |
| `models_refresh` — Model S 2021+ | `solid_black` 纯黑（PBSB）、`ultra_red` 烈焰红（PR01）、`pearl_white` 珍珠白（PPSW） | `19` Tempest（WS90）、`21` Arachnid（WS12） | `black`（IBE00）、`cream` 奶油白（IBC00） |
| `modelx_refresh` — Model X 2021+ | `pearl_white` 珍珠白（PPSW） | `22` Turbine（WX00） | `black`（IBE00） |

说明：

- 私人开发版起 `modely_juniper` 已支持的深顶棚内饰 `black_dark_headliner` / `white_dark_headliner`（码 IPB11 / IPW11）仍然可用，但未在 2026-10-24 矩阵中复测，故不进编辑器选项。
- S/X 在配置器里没有内饰（座椅）视角，其空调面板背景改用外观渲染图。
- 配置器在参数不自洽时可能返回 HTTP 200 的空影图；卡片会对加载完成的车图做采样检测，命中时按加载失败提示处理。

### `image_options` 逃生舱

没有预设的车型——Model 3 焕新版（Highland）、改款前 Model S、冷门年款/版本——可以粘贴你自己车辆图片所用的完整 options 串：

1. 打开特斯拉账户（或 tesla-info 等站点）找到你的车辆图片 URL，其中有 `options=` 参数，如 `$MDLY,$MTY09,$PPSW,$WY19B,$INPW0`。
2. 把该参数值整段填入 `image_options`：

```yaml
type: custom:tesla-vehicle-card
vehicle: my_model_3
name: My Model 3
model: model3_legacy   # 决定 compositor 的 model= 参数（m3）；选车系对应的任一预设即可
image_options: "$MTxxx,$PPSW,$Wxxxx,$IPxxx"   # 占位示意——请粘贴你自己车辆的真实参数串
```

设置 `image_options` 后 `paint` / `wheels` / `interior` / `trim` 被忽略；`model` 预设仍提供配置器的 `model=` 参数（不写 `model` 时按默认 `my`）。

## 实体说明

所有实体 ID 都由 `vehicle` 前缀按 Tesla Fleet / Teslemetry 命名风格推导。以 `vehicle: my_model_y` 为例：

| 用途 | 实体 |
| --- | --- |
| 在线 / 休眠 | `binary_sensor.my_model_y_status` |
| 车门锁 | `lock.my_model_y_lock` |
| 电量 / 续航 | `sensor.my_model_y_battery_level` / `sensor.my_model_y_battery_range` |
| 总里程 | `sensor.my_model_y_odometer` |
| 软件更新 | `update.my_model_y_update` |
| 充电状态 / 功率 / 速度 / 本次充入 / 充满还需 | `sensor.my_model_y_charging`、`_charger_power`、`_charge_rate`、`_charge_energy_added`、`_time_to_full_charge` |
| 充电枪 / 启停 / 上限 / 电流 / 充电口盖 | `binary_sensor.my_model_y_charge_cable`、`switch.my_model_y_charge`、`number.my_model_y_charge_limit`、`number.my_model_y_charge_current`、`cover.my_model_y_charge_port_door` |
| 车内 / 车外温度 | `sensor.my_model_y_inside_temperature` / `sensor.my_model_y_outside_temperature` |
| 前备箱 / 后备箱 / 车窗 | `cover.my_model_y_frunk` / `cover.my_model_y_trunk` / `cover.my_model_y_windows` |
| 哨兵 / 除霜 | `switch.my_model_y_sentry_mode` / `switch.my_model_y_defrost` |
| 座椅与方向盘加热 | `select.my_model_y_seat_heater_front_left`、`_front_right`、`select.my_model_y_steering_wheel_heater` |
| 鸣笛 / 闪灯 / 唤醒按钮 | `button.my_model_y_honk_horn` / `button.my_model_y_flash_lights` / `button.my_model_y_wake` |
| 车门与车窗传感器 | `binary_sensor.my_model_y_{front,rear}_{driver,passenger}_{door,window}` |
| 空调 | `climate.my_model_y_climate`（可用 `climate:` 覆盖） |
| 胎压 | `sensor.my_model_y_tire_pressure_front_left` / `_front_right` / `_rear_left` / `_rear_right`（Fleet 风格），或 `sensor.my_model_y_tpms_pressure_fl` / `_fr` / `_rl` / `_rr`（Teslemetry 风格）——按序取第一个存在的 |
| 位置 | `device_tracker.my_model_y`（或 `device_tracker.my_model_y_location`） |
| 导航 | `sensor.my_model_y_active_route_destination`、`sensor.my_model_y_active_route_distance_to_arrival`、`sensor.my_model_y_active_route_time_to_arrival`（或裸名 `sensor.my_model_y_destination`、`_distance_to_arrival`、`_time_to_arrival`） |

任一推导实体都可用 `entities:` 按内部键名（`battery`、`lock`、`frunk`、`sentry`、`seat_left`、`tpms_fl`、`tracker`、`destination` 等）单独覆盖，例如：

```yaml
entities:
  battery: sensor.my_custom_battery_level
  tpms_fl: sensor.my_custom_tpms_front_left
```

你的集成里不存在的实体会被尽量跳过：对应的动作按钮不渲染、胎压段在无任何胎压实体时整段隐藏、各面板优雅降级。

## 免责声明

- **车辆图片由特斯拉官网 CDN 实时提供**（`static-assets.tesla.com`）。所有车辆美术素材版权归 **Tesla, Inc.** 所有；本项目只是把配置器选项参数（车漆 / 轮毂 / 内饰代码）拼成图片 URL，不分发特斯拉的任何图片。
- 卡片图标多数为本项目按 Tesla App 视觉风格原创绘制的线条图标，**并非 Tesla 官方图标素材**；其中风扇、哨兵、车窗、方向盘加热四个图标使用 HA 自带的 Material Design Icons 原图（Apache License 2.0）。
- 本项目为非官方社区项目，与 Tesla, Inc. **无隶属、背书或赞助关系**。
- 由于图片依赖特斯拉官网配置器服务，**特斯拉更改其网站或接口可能随时导致车图失效**。
- 通过仪表盘控制真实车辆本身具有敏感性——本卡片对危险操作有两次点击确认，但使用风险仍请自担。

## Roadmap

- Model 3 焕新版（Highland）预设——等待可靠的 trim 码来源；在此之前请用 `image_options` 粘贴自己车辆的参数串
- Cybertruck——经 2026-10-24 实测，配置器接口不支持，待接口变化后再评估
- P2：后排座椅加热、局部渲染优化
- 英文文案完善与更多语言

## 开发

无需构建，直接编辑 `tesla-vehicle-card.js`。冒烟测试（纯 Node、桩 DOM）：

```bash
node --check tesla-vehicle-card.js
node tests/smoke.mjs
```

## 许可证

[MIT](LICENSE) © 2026 AidaShika
