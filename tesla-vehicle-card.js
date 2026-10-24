/*
 * Tesla Vehicle Card (custom:tesla-vehicle-card) / 特斯拉车辆卡片
 * A single-file, zero-dependency control card for Tesla vehicles in Home Assistant.
 * 为特斯拉车辆打造的单文件、零依赖 Home Assistant 控制卡片（多车型）。
 * Entity names follow the Tesla Fleet / Teslemetry naming style; the car image is
 * rendered live by Tesla's official configurator (static-assets.tesla.com).
 * 实体命名适配 Tesla Fleet / Teslemetry 风格；车图来自特斯拉官网配置器渲染图。
 *
 * Minimal config / 最简配置：
 *   type: custom:tesla-vehicle-card
 *   vehicle: my_model_y          # vehicle prefix used in entity IDs / 实体 ID 中的车辆前缀
 *   name: My Model Y
 *   model: modely_juniper        # modely_juniper (default) | modely_legacy | model3_legacy |
 *                                #   models_refresh | modelx_refresh
 *   paint: stealth_grey          # available paints depend on the model / 可选车漆随车型而定（见 README）
 *   wheels: 19                   # available wheels depend on the model / 可选轮毂随车型而定
 *   interior: black              # available interiors depend on the model / 可选内饰随车型而定
 *   view: 3qtr                   # default view / 默认视角：3qtr | side | rear (swipe or tap the car to switch / 可左右滑动切换)
 *   climate: climate.my_model_y_climate
 *   language: auto               # "zh" | "en" | "auto" (default / 缺省 auto：跟随 Home Assistant 的语言)
 *   show_status: true            # optional / 可选：show the status row (doors & windows / charge port /
 *                                #   climate / charge limit). Hidden by default; set true to show it.
 *                                #   显示状态排（门窗/充电口/空调/充电上限）；默认不显示，设为 true 才显示。
 *   trim: MT316                  # optional / 可选：override the model's default compositor trim code
 *                                #   覆盖该车型默认的配置器 trim 码（高级）
 *   image_options: "$MDLY,..."   # optional escape hatch / 逃生舱：paste a full compositor options string
 *                                #   (e.g. copied from your Tesla account vehicle image URL); paint /
 *                                #   wheels / interior / trim are then ignored. Use this for models
 *                                #   without a preset (Model 3 Highland, pre-refresh Model S, ...).
 *                                #   粘贴完整的配置器 options 串（如从特斯拉账户车图 URL 复制），
 *                                #   paint / wheels / interior / trim 将被忽略；无预设的车型用这个。
 */

const VERSION = "1.0.0";

// 车型表：选项码全部来自 2026-10-24 对特斯拉官网配置器的逐组合实测，只收录
// 已验证（verified）的车漆 / 轮毂 / 内饰；未验证项不列（官网对无效码整串回 412）。
// Model table: every option code below was verified against Tesla's live
// configurator compositor on 2026-10-24. Unverified options are NOT listed:
// the compositor rejects the whole request (HTTP 412) on any invalid code,
// and a trim code is REQUIRED for every model (without one it returns a
// shadow-only image with no car in it).
const MODELS = {
  modely_juniper: {
    compositor: "my", designator: null, trim: "MTY46",
    label: "Model Y 焕新版", labelEn: "Model Y Refresh",
    has_seat_view: true, views: ["3qtr", "side", "rear"],
    default_paint: "stealth_grey", default_wheels: 19, default_interior: "black",
    paints: {
      stealth_grey: { code: "PN01", label: "星空灰", labelEn: "Stealth Grey" },
      quicksilver: { code: "PN00", label: "快银", labelEn: "Quicksilver" },
      pearl_white: { code: "PPSW", label: "珍珠白", labelEn: "Pearl White" },
      solid_black: { code: "PBSB", label: "曜石黑", labelEn: "Solid Black" },
      ultra_red: { code: "PR01", label: "烈焰红", labelEn: "Ultra Red" },
      deep_blue: { code: "PPSB", label: "深蓝", labelEn: "Deep Blue" },
    },
    wheels: { 19: "WY19P", 20: "WY20A" },
    interiors: { black: "IPB10", white: "IPW10" },
  },
  modely_legacy: {
    compositor: "my", designator: "MDLY", trim: "MTY09",
    label: "Model Y（2020–2025）", labelEn: "Model Y (2020-2025)",
    has_seat_view: true, views: ["3qtr", "side", "rear"],
    default_paint: "pearl_white", default_wheels: 19, default_interior: "black",
    paints: {
      pearl_white: { code: "PPSW", label: "珍珠白", labelEn: "Pearl White" },
      midnight_silver: { code: "PMNG", label: "午夜银灰", labelEn: "Midnight Silver" },
      deep_blue: { code: "PPSB", label: "深蓝", labelEn: "Deep Blue" },
      red_multicoat: { code: "PPMR", label: "红色多涂层", labelEn: "Red Multi-Coat" },
      solid_black: { code: "PBSB", label: "纯黑", labelEn: "Solid Black" },
      quicksilver: { code: "PN00", label: "水银银", labelEn: "Quicksilver" },
      ultra_red: { code: "PR01", label: "烈焰红", labelEn: "Ultra Red" },
    },
    wheels: { 19: "WY19B", 20: "WY20P" },
    interiors: { black: "INPB0", white: "INPW0" },
  },
  model3_legacy: {
    compositor: "m3", designator: null, trim: "MT316",
    label: "Model 3（2017–2024）", labelEn: "Model 3 (2017-2024)",
    has_seat_view: true, views: ["3qtr", "side", "rear"],
    default_paint: "midnight_silver", default_wheels: 18, default_interior: "black",
    paints: {
      midnight_silver: { code: "PMNG", label: "午夜银灰", labelEn: "Midnight Silver" },
      pearl_white: { code: "PPSW", label: "珍珠白", labelEn: "Pearl White" },
      deep_blue: { code: "PPSB", label: "深蓝", labelEn: "Deep Blue" },
      solid_black: { code: "PBSB", label: "纯黑", labelEn: "Solid Black" },
      red_multicoat: { code: "PPMR", label: "红色多涂层", labelEn: "Red Multi-Coat" },
    },
    // 20" W33D 仅适用于 Performance trim（如 trim: MT317），默认 LR trim 下官网会拒绝（412）
    // 20in W33D requires a Performance trim (e.g. trim: MT317); the default LR trim rejects it.
    wheels: { 18: "W38B", 19: "W39B", 20: "W33D" },
    interiors: { black: "IN3PB", white: "IN3PW" },
  },
  models_refresh: {
    compositor: "ms", designator: "MDLS", trim: "MTS14",
    label: "Model S 改款", labelEn: "Model S (2021+)",
    has_seat_view: false, views: ["3qtr", "side", "rear"],
    default_paint: "solid_black", default_wheels: 19, default_interior: "black",
    paints: {
      solid_black: { code: "PBSB", label: "纯黑", labelEn: "Solid Black" },
      ultra_red: { code: "PR01", label: "烈焰红", labelEn: "Ultra Red" },
      pearl_white: { code: "PPSW", label: "珍珠白", labelEn: "Pearl White" },
    },
    wheels: { 19: "WS90", 21: "WS12" },
    interiors: { black: "IBE00", cream: "IBC00" },
  },
  modelx_refresh: {
    compositor: "mx", designator: null, trim: "MTX10",
    label: "Model X 改款", labelEn: "Model X (2021+)",
    has_seat_view: false, views: ["3qtr", "side", "rear"],
    default_paint: "pearl_white", default_wheels: 22, default_interior: "black",
    paints: {
      pearl_white: { code: "PPSW", label: "珍珠白", labelEn: "Pearl White" },
    },
    wheels: { 22: "WX00" },
    interiors: { black: "IBE00" },
  },
};
// v1.6.6 起 juniper 已在用的深顶棚内饰码（本次矩阵未复测，保留兼容，不进编辑器选项）
// Juniper dark-headliner interiors carried over from v1.6.6 (not re-verified in
// the 2026-10-24 matrix; kept so existing configs keep working).
const JUNIPER_LEGACY_INTERIORS = { black_dark_headliner: "IPB11", white_dark_headliner: "IPW11" };
// 外观相册的三个视角（官方配置器只提供这几个外观角度）
const VIEWS = [
  { id: "STUD_3QTR", key: "3qtr", label: "前 45°", labelEn: "Front 3/4" },
  { id: "STUD_SIDE", key: "side", label: "侧面", labelEn: "Side" },
  { id: "STUD_REAR", key: "rear", label: "后 45°", labelEn: "Rear 3/4" },
];

// 界面语言表：zh 保持既有文案原样，en 为对应英文翻译。
// UI string tables: zh keeps the original wording verbatim, en is its translation.
const STRINGS = {
  zh: {
    stub_name: "我的 Model Y",
    picker_name: "Tesla Vehicle Card",
    picker_desc: "多车型特斯拉控制卡片，使用特斯拉官网渲染车图",
    err_vehicle: "请填写 vehicle（实体 ID 的车辆前缀，例如 my_model_y）",
    err_model: (v, opts) => `不支持的车型：${v}，可选 ${opts}`,
    err_paint: (v, opts) => `不支持的车漆：${v}，可选 ${opts}`,
    err_interior: (v, opts) => `不支持的内饰：${v}，可选 ${opts}`,
    command_sent: "指令已执行",
    command_failed: (msg) => `指令执行失败${msg ? `：${msg}` : ""}`,
    confirm_q: "确认？",
    frunk_close_manual: "前备箱需要手动关闭",
    waking: "正在唤醒车辆…",
    tpms: "胎压",
    tpms_fl: "左前",
    tpms_fr: "右前",
    tpms_rl: "左后",
    tpms_rr: "右后",
    at_home: "家",
    away: "外出",
    nav_eta: (t) => `约 ${t} 分钟`,
    rel_time: (s) => (s < 60 ? "刚刚更新" : s < 3600 ? `${Math.floor(s / 60)} 分钟前更新` : s < 86400 ? `${Math.floor(s / 3600)} 小时前更新` : `${Math.floor(s / 86400)} 天前更新`),
    doors: { door_fl: "主驾门", door_fr: "副驾门", door_rl: "左后门", door_rr: "右后门" },
    door_alert: (name) => `${name}未关`,
    windows_open: (n) => `${n} 扇车窗未关`,
    frunk_open: "前备箱打开",
    trunk_open: "后备箱打开",
    vehicle_unlocked: "车辆未上锁",
    climate_not_found: "未找到空调实体 ",
    interior: "车内",
    climate_running: "空调运行中",
    climate_is_off: "空调已关闭",
    set_temp: "°C 设定温度",
    climate_turn_on: "开启空调",
    climate_turn_off: "关闭空调",
    seat_left: "左座加热",
    seat_right: "右座加热",
    wheel_heater: "方向盘加热",
    defrost: "除霜",
    on: "开",
    off: "关",
    preset_hint: "车内模式：保持 / 宠物 / 露营会让空调在离车后继续运行",
    heat: { off: "关", low: "低", medium: "中", high: "高" },
    presets: { off: "关", keep: "保持", dog: "宠物", camp: "露营" },
    charging: { starting: "准备充电", charging: "正在充电", stopped: "已暂停", complete: "已充满", disconnected: "未连接", no_power: "无电源" },
    charge_state: "充电状态",
    charge_power: "充电功率",
    charge_rate_label: "充电速度",
    energy_added: "本次充入",
    time_remaining: "充满还需",
    duration_hm: (h, m) => `${h} 小时 ${m} 分`,
    duration_m: (m) => `${m} 分钟`,
    charge_limit: "充电上限",
    charge_current: "充电电流",
    stop_charging: "停止充电",
    start_charging: "开始充电",
    not_plugged: "未插枪",
    close_charge_port: "关闭充电口",
    open_charge_port: "打开充电口",
    online: "在线",
    asleep: "休眠中",
    tap_to_wake: "点击唤醒",
    locked: "已上锁",
    unlocked: "未上锁",
    odometer: "总里程",
    version: "版本：",
    update_available: "可更新",
    car_title: "左右滑动或点击切换视角",
    image_failed: "车图加载失败：图片参数可能不受支持，或特斯拉官网接口已变更",
    exterior: "车外",
    sentry: "哨兵",
    sentry_on: "开启",
    sentry_off: "关闭",
    btn_locked: "已锁",
    btn_unlocked: "未锁",
    btn_lock: "锁",
    climate: "空调",
    climate_on: "空调开",
    charge: "充电",
    charging_btn: "充电中",
    trunk: "后备箱",
    collapse: "收起",
    more: "更多",
    frunk: "前备箱",
    windows: "车窗",
    flash: "闪灯",
    horn: "鸣笛",
    status_openings: "门窗",
    openings_open: (n) => `${n} 处未关`,
    all_closed: "全部关闭",
    charge_port: "充电口",
    opened: "已打开",
    closed: "已关闭",
  },
  en: {
    stub_name: "My Model Y",
    picker_name: "Tesla Vehicle Card",
    picker_desc: "Multi-model Tesla control card using Tesla's official configurator renders",
    err_vehicle: "Please set vehicle (the vehicle prefix used in entity IDs, e.g. my_model_y)",
    err_model: (v, opts) => `Unsupported model: ${v}. Options: ${opts}`,
    err_paint: (v, opts) => `Unsupported paint: ${v}. Options: ${opts}`,
    err_interior: (v, opts) => `Unsupported interior: ${v}. Options: ${opts}`,
    command_sent: "Command sent",
    command_failed: (msg) => `Command failed${msg ? `: ${msg}` : ""}`,
    confirm_q: "Confirm?",
    frunk_close_manual: "The frunk must be closed manually",
    waking: "Waking the vehicle…",
    tpms: "Tyre pressure",
    tpms_fl: "Front left",
    tpms_fr: "Front right",
    tpms_rl: "Rear left",
    tpms_rr: "Rear right",
    at_home: "Home",
    away: "Away",
    nav_eta: (t) => `~${t} min`,
    rel_time: (s) => (s < 60 ? "Updated just now" : s < 3600 ? `Updated ${Math.floor(s / 60)} min ago` : s < 86400 ? `Updated ${Math.floor(s / 3600)} h ago` : `Updated ${Math.floor(s / 86400)} d ago`),
    doors: { door_fl: "Driver door", door_fr: "Passenger door", door_rl: "Rear left door", door_rr: "Rear right door" },
    door_alert: (name) => `${name} is open`,
    windows_open: (n) => (n === 1 ? "1 window open" : `${n} windows open`),
    frunk_open: "Frunk open",
    trunk_open: "Trunk open",
    vehicle_unlocked: "Vehicle unlocked",
    climate_not_found: "Climate entity not found: ",
    interior: "Interior",
    climate_running: "Climate running",
    climate_is_off: "Climate off",
    set_temp: "°C set temperature",
    climate_turn_on: "Turn on climate",
    climate_turn_off: "Turn off climate",
    seat_left: "Left seat heater",
    seat_right: "Right seat heater",
    wheel_heater: "Steering wheel heater",
    defrost: "Defrost",
    on: "On",
    off: "Off",
    preset_hint: "Cabin modes: Keep / Dog / Camp keep the climate running after you leave the car.",
    heat: { off: "Off", low: "Low", medium: "Med", high: "High" },
    presets: { off: "Off", keep: "Keep", dog: "Dog", camp: "Camp" },
    charging: { starting: "Starting", charging: "Charging", stopped: "Paused", complete: "Complete", disconnected: "Disconnected", no_power: "No power" },
    charge_state: "Charge state",
    charge_power: "Charge power",
    charge_rate_label: "Charge rate",
    energy_added: "Energy added",
    time_remaining: "Time remaining",
    duration_hm: (h, m) => `${h} h ${m} min`,
    duration_m: (m) => `${m} min`,
    charge_limit: "Charge limit",
    charge_current: "Charge current",
    stop_charging: "Stop charging",
    start_charging: "Start charging",
    not_plugged: "Not plugged in",
    close_charge_port: "Close charge port",
    open_charge_port: "Open charge port",
    online: "Online",
    asleep: "Asleep",
    tap_to_wake: "Tap to wake",
    locked: "Locked",
    unlocked: "Unlocked",
    odometer: "Odometer",
    version: "Version: ",
    update_available: "Update available:",
    car_title: "Swipe or tap to switch view",
    image_failed: "Car image failed to load: the image parameters may be unsupported, or Tesla's configurator service has changed",
    exterior: "Exterior",
    sentry: "Sentry",
    sentry_on: "On",
    sentry_off: "Off",
    btn_locked: "Locked",
    btn_unlocked: "Unlocked",
    btn_lock: "Lock",
    climate: "Climate",
    climate_on: "Climate on",
    charge: "Charge",
    charging_btn: "Charging",
    trunk: "Trunk",
    collapse: "Collapse",
    more: "More",
    frunk: "Frunk",
    windows: "Windows",
    flash: "Flash",
    horn: "Honk",
    status_openings: "Doors & windows",
    openings_open: (n) => `${n} open`,
    all_closed: "All closed",
    charge_port: "Charge port",
    opened: "Open",
    closed: "Closed",
  },
};

// 浏览器语言：用于拿不到 hass 的两处（卡片选择器文案、getStubConfig 默认名）。
// Browser language, used where hass is unavailable (card picker metadata, stub config name).
function detectLang() {
  const nl = (typeof navigator !== "undefined" && navigator.language) || "";
  if (!nl) return "zh";
  return nl.toLowerCase().startsWith("zh") ? "zh" : "en";
}

// 语言优先级 / Language priority: config.language > hass language > browser language
function resolveLang(config, hass) {
  const c = config && config.language;
  if (c === "zh" || c === "en") return c;
  const hl = ((hass && hass.language) || (hass && hass.locale && hass.locale.language) || "").toLowerCase();
  if (hl) return hl.startsWith("zh") ? "zh" : "en";
  return detectLang();
}

// 以 vehicle 前缀推导出的默认实体，均可在 entities: 下单独覆盖
const ENTITY_KEYS = {
  online: "binary_sensor.{v}_status",
  lock: "lock.{v}_lock",
  battery: "sensor.{v}_battery_level",
  range: "sensor.{v}_battery_range",
  odometer: "sensor.{v}_odometer",
  software: "update.{v}_update",
  charging_state: "sensor.{v}_charging",
  charger_power: "sensor.{v}_charger_power",
  charge_rate: "sensor.{v}_charge_rate",
  energy_added: "sensor.{v}_charge_energy_added",
  time_to_full: "sensor.{v}_time_to_full_charge",
  charge_cable: "binary_sensor.{v}_charge_cable",
  charge_switch: "switch.{v}_charge",
  charge_limit: "number.{v}_charge_limit",
  charge_current: "number.{v}_charge_current",
  charge_port: "cover.{v}_charge_port_door",
  inside_temp: "sensor.{v}_inside_temperature",
  outside_temp: "sensor.{v}_outside_temperature",
  frunk: "cover.{v}_frunk",
  trunk: "cover.{v}_trunk",
  windows: "cover.{v}_windows",
  sentry: "switch.{v}_sentry_mode",
  defrost: "switch.{v}_defrost",
  seat_left: "select.{v}_seat_heater_front_left",
  seat_right: "select.{v}_seat_heater_front_right",
  wheel_heater: "select.{v}_steering_wheel_heater",
  horn: "button.{v}_honk_horn",
  flash: "button.{v}_flash_lights",
  wake: "button.{v}_wake",
  door_fl: "binary_sensor.{v}_front_driver_door",
  door_rl: "binary_sensor.{v}_rear_driver_door",
  door_fr: "binary_sensor.{v}_front_passenger_door",
  door_rr: "binary_sensor.{v}_rear_passenger_door",
  window_fl: "binary_sensor.{v}_front_driver_window",
  window_rl: "binary_sensor.{v}_rear_driver_window",
  window_fr: "binary_sensor.{v}_front_passenger_window",
  window_rr: "binary_sensor.{v}_rear_passenger_window",
  // 胎压 / 位置 / 导航：值为候选数组，按序取第一个在 hass.states 里存在的实体
  // （依次为 Tesla Fleet 风格、Teslemetry 风格命名；可用 entities: 覆盖为单个实体 ID）
  // Tyre pressure / location / navigation: candidate lists, resolved in order
  // (Tesla Fleet style first, then Teslemetry style; override via entities:).
  tpms_fl: ["sensor.{v}_tire_pressure_front_left", "sensor.{v}_tpms_pressure_fl"],
  tpms_fr: ["sensor.{v}_tire_pressure_front_right", "sensor.{v}_tpms_pressure_fr"],
  tpms_rl: ["sensor.{v}_tire_pressure_rear_left", "sensor.{v}_tpms_pressure_rl"],
  tpms_rr: ["sensor.{v}_tire_pressure_rear_right", "sensor.{v}_tpms_pressure_rr"],
  tracker: ["device_tracker.{v}", "device_tracker.{v}_location"],
  destination: ["sensor.{v}_active_route_destination", "sensor.{v}_destination"],
  distance_to_arrival: ["sensor.{v}_active_route_distance_to_arrival", "sensor.{v}_distance_to_arrival"],
  time_to_arrival: ["sensor.{v}_active_route_time_to_arrival", "sensor.{v}_time_to_arrival"],
};

// 图标：按 Tesla App 的细线条视觉语言原创重绘的线条风图标（24×24、stroke 1.8、
// round 线帽/拐角、无填充）。仅借鉴视觉风格，路径均为原创几何造型，
// 不是 Tesla 的官方图标素材。
// Icons: original line-style drawings in the visual language of the Tesla app
// (24x24 grid, 1.8 stroke, round caps/joins, no fill). Drawn from scratch for
// this project — not Tesla's official icon assets.
const ICONS = {
  lock: "M8 11V7a4 4 0 0 1 8 0v4M5.5 11h13V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19Z M12 14.5v2.2",
  unlock: "M8 11V7a4 4 0 0 1 7.7-1.4M5.5 11h13V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19Z M12 14.5v2.2",
  fan: "M12 11a1 1 0 0 0-1 1 1 1 0 0 0 1 1 1 1 0 0 0 1-1 1 1 0 0 0-1-1m.5-9c4.5 0 4.61 3.57 2.25 4.75-.99.49-1.43 1.54-1.62 2.47.48.2.9.51 1.22.91 3.7-2 7.68-1.21 7.68 2.37 0 4.5-3.57 4.6-4.75 2.23-.5-.99-1.56-1.43-2.49-1.62-.2.48-.51.89-.91 1.23 1.99 3.69 1.2 7.66-2.38 7.66-4.5 0-4.59-3.58-2.23-4.76.98-.49 1.42-1.53 1.62-2.45-.49-.2-.92-.52-1.24-.92C5.96 15.85 2 15.07 2 11.5 2 7 5.56 6.89 6.74 9.26c.5.99 1.55 1.42 2.48 1.61.19-.48.51-.9.92-1.22C8.15 5.96 8.94 2 12.5 2Z",
  frunk: "M16.1 18a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0M4.5 18a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0M2.8 18h1.7M7.9 18h8.2M19.5 18h1.7M21.2 18v-4.6M14.2 11.4l6.8-3.6M14.2 11.4L11.8 8.2h-4.2L3.6 12l-.8 6",
  trunk: "M16.1 18a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0M4.5 18a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0M2.8 18h1.7M7.9 18h8.2M19.5 18h1.7M21.2 18v-4.6l-7-2-2.4-3.2h-4.2M7.6 8.2L1.9 5.6M3.6 12l-.8 6",
  plug: "M9.5 7.5V4M14.5 7.5V4M7 7.5h10V12a5 5 0 0 1-10 0Z M12 17v1.2c0 1.9-1.4 2.8-3 2.8",
  shield: "M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4m0 6a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3m0 13.65C8.69 19.5 6.13 16.36 5.3 13.03 6.73 11.73 9.3 11 12 11s5.27.73 6.7 2.03c-.83 3.33-3.39 6.47-6.7 7.62Z",
  flash: "M12 3.5a5.8 5.8 0 0 1 3.4 10.7c-.5.4-.9 1-.9 1.8h-5c0-.8-.4-1.4-.9-1.8A5.8 5.8 0 0 1 12 3.5Z M9.5 18.5h5M10.3 21h3.4",
  horn: "M4 9.8v4.4h3.2L12 18.6V5.4L7.2 9.8Z M15.3 9.8a3.4 3.4 0 0 1 0 4.4M17.8 7.5a7 7 0 0 1 0 9",
  window: "M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m0 2v7h12V4H6Z",
  wake: "M12 3.5v6.8M6.6 6.4a7.6 7.6 0 1 0 10.8 0",
  seat: "M7 3.8v5.4a3.3 3.3 0 0 0 3.3 3.3H18a1.5 1.5 0 0 1 1.5 1.5v3.2M6.8 20.2v-3M19.5 20.2v-3M12.5 9.6c-1-1.1 1-1.9 0-3.2M16 9.6c-1-1.1 1-1.9 0-3.2",
  wheel: "M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 2c3.86 0 7.06 2.79 7.73 6.45L17 11h-2.17a3 3 0 0 0-5.66 0H7l-2.73-.55C4.94 6.79 8.14 4 12 4m-7.73 9.55L7 13a3 3 0 0 0 3 3v3.73A8 8 0 0 1 4.27 13.55M14 19.73V16a3 3 0 0 0 3-3l2.73.55A8 8 0 0 1 14 19.73Z",
  defrost: "M5.5 4.5h13L20 13H4Z M8.5 19.5c-1-1.3 1-2.1 0-3.4M12 19.5c-1-1.3 1-2.1 0-3.4M15.5 19.5c-1-1.3 1-2.1 0-3.4",
  minus: "M5.5 12h13",
  plus: "M12 5.5v13M5.5 12h13",
  chevron: "M6.5 9.5 12 15l5.5-5.5",
  dots: "M4.1 12a.9.9 0 1 0 1.8 0 .9.9 0 1 0-1.8 0M11.1 12a.9.9 0 1 0 1.8 0 .9.9 0 1 0-1.8 0M18.1 12a.9.9 0 1 0 1.8 0 .9.9 0 1 0-1.8 0",
};

// 这四个图标用 HA 自带 MDI 原图（实心填充渲染），其余为线条风原创图标
// These four use the original Material Design Icons glyphs (filled rendering,
// the same set Home Assistant ships); the rest are original line-style drawings.
const ICON_FILL = ["fan", "shield", "window", "wheel"];

const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path ${ICON_FILL.includes(name) ? 'fill="currentColor" stroke="none"' : ""} d="${ICONS[name]}"/></svg>`;

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

class TeslaVehicleCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._panel = null; // "climate" | "charge" | null
    this._lastSig = "";
    this._viewIdx = 0;
    this.shadowRoot.addEventListener("pointerdown", (ev) => {
      if (ev.target.closest(".car")) this._swipeX = ev.clientX;
    });
    this.shadowRoot.addEventListener("pointerup", (ev) => {
      if (this._swipeX == null) return;
      const dx = ev.clientX - this._swipeX;
      this._swipeX = null;
      if (Math.abs(dx) > 40) {
        this._swiped = true;
        this._setView(this._viewIdx + (dx < 0 ? 1 : -1));
      }
    });
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    this.shadowRoot.addEventListener("change", (ev) => this._onChange(ev));
    this.shadowRoot.addEventListener("input", (ev) => this._onInput(ev));
  }

  static getStubConfig() {
    return { vehicle: "", name: STRINGS[detectLang()].stub_name, paint: "stealth_grey", wheels: 19 };
  }

  setConfig(config) {
    const S = STRINGS[resolveLang(config, this._hass)];
    if (!config.vehicle) throw new Error(S.err_vehicle);
    if (config.model && !MODELS[config.model]) throw new Error(S.err_model(config.model, Object.keys(MODELS).join(" / ")));
    const model = MODELS[config.model] || MODELS.modely_juniper;
    if (config.paint && !model.paints[config.paint]) throw new Error(S.err_paint(config.paint, Object.keys(model.paints).join(" / ")));
    if (config.interior && !model.interiors[config.interior] && !(model === MODELS.modely_juniper && JUNIPER_LEGACY_INTERIORS[config.interior]))
      throw new Error(S.err_interior(config.interior, Object.keys(model.interiors).join(" / ")));
    this._config = { name: "Model Y", ...config };
    const v = config.vehicle;
    this._e = {};
    for (const [k, tpl] of Object.entries(ENTITY_KEYS)) {
      this._e[k] = Array.isArray(tpl) ? tpl.map((t) => t.replace("{v}", v)) : tpl.replace("{v}", v);
    }
    this._e.climate = config.climate || `climate.${v}_climate`;
    Object.assign(this._e, config.entities || {});
    this._viewsList = VIEWS.filter((vw) => model.views.includes(vw.key));
    const vi = this._viewsList.findIndex((vw) => vw.key === config.view);
    this._viewIdx = vi >= 0 ? vi : 0;
    this.toggleAttribute("fill", !!config.min_height);
    this._lastSig = "";
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    // 只在相关实体变化时重绘，避免拖动滑块时被打断
    const sig = Object.values(this._e || {})
      .flatMap((id) => (Array.isArray(id) ? id : [id]))
      .map((id) => hass.states[id]?.last_updated + "|" + hass.states[id]?.state)
      .join(",");
    if (sig === this._lastSig || this._dragging) return;
    this._lastSig = sig;
    this._render();
  }

  getCardSize() {
    return 8;
  }

  getConfigElement() {
    return document.createElement("tesla-vehicle-card-editor");
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  // 当前界面语言（"zh" | "en"）/ Current UI language
  get _lang() {
    return resolveLang(this._config, this._hass);
  }

  _str() {
    return STRINGS[this._lang] || STRINGS.zh;
  }

  // ---------- model helpers ----------
  _model() {
    return MODELS[this._config?.model] || MODELS.modely_juniper;
  }
  _trimCode() {
    const t = this._config?.trim;
    return t ? String(t).replace(/^\$/, "").toUpperCase() : this._model().trim;
  }
  _paintKey() {
    const m = this._model();
    return m.paints[this._config?.paint] ? this._config.paint : m.default_paint;
  }
  _paintEntry() {
    return this._model().paints[this._paintKey()];
  }
  _wheelCode() {
    const m = this._model();
    return m.wheels[this._config?.wheels] || m.wheels[m.default_wheels];
  }
  _interiorCode() {
    const m = this._model();
    if (m.interiors[this._config?.interior]) return m.interiors[this._config.interior];
    if (m === MODELS.modely_juniper && JUNIPER_LEGACY_INTERIORS[this._config?.interior])
      return JUNIPER_LEGACY_INTERIORS[this._config.interior];
    return m.interiors[m.default_interior];
  }

  // ---------- state helpers ----------
  _s(key) {
    const id = this._e[key];
    // 候选数组：按序取第一个存在的实体 / Candidate list: first entity that exists wins
    if (Array.isArray(id)) return id.map((i) => this._hass?.states[i]).find((s) => s !== undefined);
    return this._hass?.states[id];
  }
  _v(key) {
    return this._s(key)?.state;
  }
  _num(key) {
    const n = parseFloat(this._v(key));
    return Number.isFinite(n) ? n : null;
  }
  _has(key) {
    const st = this._v(key);
    return st !== undefined && st !== "unavailable";
  }
  _on(key) {
    return this._v(key) === "on";
  }

  _imageUrl(view) {
    const cfg = this._config;
    const m = this._model();
    let opts;
    if (cfg.image_options) {
      // 逃生舱：用户粘贴的完整 options 串原样使用，paint/wheels/interior/trim 被忽略
      // Escape hatch: use the pasted options string as-is.
      opts = String(cfg.image_options).trim();
    } else {
      const parts = [];
      if (m.designator) parts.push(`$${m.designator}`);
      parts.push(`$${this._trimCode()}`, `$${this._paintEntry().code}`, `$${this._wheelCode()}`, `$${this._interiorCode()}`);
      opts = parts.join(",");
    }
    return `https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=${encodeURIComponent(opts)}&view=${view}&model=${m.compositor}&size=1440&bkba_opt=1`;
  }

  // 空影图检测：官网对缺 trim 等情况会回一张只有地面阴影的 200 图。把车图采样到
  // 小画布统计不透明像素占比，过低（<6%，正常渲染约 14–17%）则按加载失败处理。
  // 采样失败（画布被跨域污染等）时静默跳过，绝不因检测本身影响渲染。
  // Shadow-only image check: sample the loaded image on a small canvas and
  // count opaque pixels; too few means Tesla returned an empty render.
  _checkImage(img) {
    if (typeof document === "undefined") return;
    try {
      const c = document.createElement("canvas");
      const ctx = c.getContext && c.getContext("2d");
      if (!ctx || !img.naturalWidth) return;
      c.width = 48;
      c.height = 27;
      ctx.drawImage(img, 0, 0, 48, 27);
      const d = ctx.getImageData(0, 0, 48, 27).data;
      let opaque = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 10) opaque++;
      if (opaque / (48 * 27) < 0.06) {
        img.style.display = "none";
        const fb = img.nextElementSibling;
        if (fb) fb.style.display = "flex";
      }
    } catch (e) {
      /* 静默跳过 / ignore */
    }
  }

  // 切换视角时只移动相册轨道，不整体重绘，保证滑动动画连贯
  _setView(idx) {
    const list = this._viewsList || VIEWS;
    this._viewIdx = (idx + list.length) % list.length;
    const track = this.shadowRoot.querySelector(".track");
    if (track) track.style.transform = `translateX(-${this._viewIdx * 100}%)`;
    this.shadowRoot.querySelectorAll(".dots button").forEach((b, i) => b.classList.toggle("on", i === this._viewIdx));
  }

  // ---------- actions ----------
  // 等待服务调用的结果：成功才报成功，失败弹出简短原因（车睡着、超时等）。
  // Await the service call: only report success once it actually succeeded.
  async _call(domain, service, entityKey, data = {}) {
    const entity_id = this._e[entityKey];
    if (!entity_id) return;
    const S = this._str();
    try {
      await this._hass.callService(domain, service, { entity_id, ...data });
      this._toast(S.command_sent);
    } catch (err) {
      this._toast(S.command_failed(err && err.message ? err.message : ""));
    }
  }

  // 两次点击确认（替代 window.confirm）：危险动作首次点击只把该按钮置为
  // 待确认态（改文案 + armed 样式，3.5 秒自动解除，直接操作被点按钮的 DOM、
  // 不整卡重绘），再次点击才真正执行。全局只允许一个待确认按钮。
  // Two-tap confirmation (replaces window.confirm): the first tap arms the
  // button in place; only a second tap executes. One armed button at a time.
  _needsConfirm(act) {
    switch (act) {
      case "lock": return this._v("lock") === "locked"; // 仅解锁方向需要确认 / only unlocking
      case "frunk": return this._v("frunk") !== "open";
      case "trunk": return this._v("trunk") !== "open";
      case "windows": return this._v("windows") !== "open";
      case "horn": return true;
      default: return false;
    }
  }

  _arm(el, S) {
    this._disarm();
    this._armedEl = el;
    const lbl = el.querySelector ? el.querySelector(".lbl") : null;
    if (lbl) {
      el._origLbl = lbl.textContent;
      lbl.textContent = S.confirm_q;
    }
    if (el.classList) el.classList.add("armed");
    this._armTimer = setTimeout(() => this._disarm(), 3500);
  }

  _disarm() {
    const el = this._armedEl;
    this._armedEl = null;
    if (this._armTimer) {
      clearTimeout(this._armTimer);
      this._armTimer = null;
    }
    if (!el) return;
    const lbl = el.querySelector ? el.querySelector(".lbl") : null;
    if (lbl && el._origLbl != null) lbl.textContent = el._origLbl;
    if (el.classList) el.classList.remove("armed");
  }

  _onClick(ev) {
    const S = this._str();
    const el = ev.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    const arg = el.dataset.arg;
    if (this._needsConfirm(act)) {
      if (this._armedEl === el) this._disarm();
      else return this._arm(el, S);
    } else if (this._armedEl && this._armedEl !== el) this._disarm();
    switch (act) {
      case "lock":
        this._call("lock", this._v("lock") === "locked" ? "unlock" : "lock", "lock");
        break;
      case "frunk":
        if (this._v("frunk") === "open") return this._toast(S.frunk_close_manual);
        this._call("cover", "open_cover", "frunk");
        break;
      case "trunk":
        this._call("cover", this._v("trunk") === "open" ? "close_cover" : "open_cover", "trunk");
        break;
      case "port":
        this._call("cover", this._v("charge_port") === "open" ? "close_cover" : "open_cover", "charge_port");
        break;
      case "windows":
        this._call("cover", this._v("windows") === "open" ? "close_cover" : "open_cover", "windows");
        break;
      case "sentry":
        this._call("switch", this._on("sentry") ? "turn_off" : "turn_on", "sentry");
        break;
      case "flash":
        this._call("button", "press", "flash");
        break;
      case "horn":
        this._call("button", "press", "horn");
        break;
      case "wake":
        this._call("button", "press", "wake");
        this._toast(S.waking);
        break;
      case "climate_toggle": {
        const on = this._v("climate") !== "off";
        this._call("climate", on ? "turn_off" : "turn_on", "climate");
        break;
      }
      case "temp": {
        const cur = this._s("climate")?.attributes?.temperature ?? 22;
        const a = this._s("climate")?.attributes || {};
        const t = Math.min(a.max_temp ?? 28, Math.max(a.min_temp ?? 15, cur + parseFloat(arg)));
        this._call("climate", "set_temperature", "climate", { temperature: t });
        break;
      }
      case "preset":
        this._call("climate", "set_preset_mode", "climate", { preset_mode: arg });
        break;
      case "heat": {
        const st = this._s(arg);
        const opts = st?.attributes?.options || ["off", "low", "medium", "high"];
        const next = opts[(opts.indexOf(st?.state) + 1) % opts.length];
        this._call("select", "select_option", arg, { option: next });
        break;
      }
      case "defrost":
        this._call("switch", this._on("defrost") ? "turn_off" : "turn_on", "defrost");
        break;
      case "charge_toggle":
        this._call("switch", this._on("charge_switch") ? "turn_off" : "turn_on", "charge_switch");
        break;
      case "panel":
        this._panel = this._panel === arg ? null : arg;
        this._render();
        break;
      case "view":
        if (this._swiped) {
          this._swiped = false;
          break;
        }
        this._setView(arg != null ? Number(arg) : this._viewIdx + 1);
        break;
      case "more":
        this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: this._e[arg] } }));
        break;
    }
  }

  _onInput(ev) {
    const el = ev.target;
    if (!el.dataset.num) return;
    this._dragging = true;
    const out = this.shadowRoot.getElementById(`out_${el.dataset.num}`);
    if (out) out.textContent = el.value + (el.dataset.unit || "");
  }

  _onChange(ev) {
    const el = ev.target;
    if (!el.dataset.num) return;
    this._dragging = false;
    this._call("number", "set_value", el.dataset.num, { value: Number(el.value) });
  }

  _toast(msg) {
    const t = this.shadowRoot.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove("show"), 1600);
  }

  // ---------- render ----------
  _alerts() {
    const S = this._str();
    const out = [];
    const doors = S.doors;
    for (const [k, n] of Object.entries(doors)) if (this._on(k)) out.push(S.door_alert(n));
    const wins = ["window_fl", "window_fr", "window_rl", "window_rr"].filter((k) => this._on(k));
    if (wins.length) out.push(S.windows_open(wins.length));
    if (this._v("frunk") === "open") out.push(S.frunk_open);
    if (this._v("trunk") === "open") out.push(S.trunk_open);
    if (this._v("lock") === "unlocked") out.push(S.vehicle_unlocked);
    return out;
  }

  _btn(act, ico, label, active, opts = {}) {
    return `<button class="act ${active ? "on" : ""} ${opts.warn ? "warn" : ""}" data-act="${act}" ${opts.arg ? `data-arg="${opts.arg}"` : ""} ${opts.disabled ? "disabled" : ""}>
      <span class="ico">${icon(ico)}</span><span class="lbl">${esc(label)}</span></button>`;
  }

  _climatePanel() {
    const S = this._str();
    const c = this._s("climate");
    if (!c) return `<div class="panel"><p class="muted">${S.climate_not_found}${esc(this._e.climate)}</p></div>`;
    const a = c.attributes;
    const on = c.state !== "off";
    const presets = (a.preset_modes || []).filter((p) => S.presets[p]);
    const heat = (key, label, ico) =>
      this._has(key)
        ? `<button class="chip ${this._v(key) !== "off" ? "on" : ""}" data-act="heat" data-arg="${key}">${icon(ico)}${label} · ${S.heat[this._v(key)] ?? this._v(key)}</button>`
        : "";
    const inside = this._num("inside_temp");
    // S/X 没有 STUD_SEAT 视角（官网回 412），空调面板背景回退用外观图
    // Model S/X have no STUD_SEAT view; fall back to the exterior render.
    const cabinView = this._model().has_seat_view ? "STUD_SEAT" : "STUD_3QTR";
    return `<div class="panel">
      <div class="cabin" style="background-image:url('${this._imageUrl(cabinView)}')">
        <div class="cabin-info">${S.interior} ${inside ?? "--"}°C · ${on ? S.climate_running : S.climate_is_off}</div>
        <div class="temp-row">
          <button class="round" data-act="temp" data-arg="-0.5">${icon("minus")}</button>
          <div class="temp"><b>${(a.temperature ?? "--").toString()}</b><span>${S.set_temp}</span></div>
          <button class="round" data-act="temp" data-arg="0.5">${icon("plus")}</button>
        </div>
      </div>
      <div class="row center">
        <button class="pill ${on ? "on" : ""}" data-act="climate_toggle">${icon("fan")}${on ? S.climate_turn_off : S.climate_turn_on}</button>
      </div>
      <div class="chips">
        ${heat("seat_left", S.seat_left, "seat")}
        ${heat("seat_right", S.seat_right, "seat")}
        ${heat("wheel_heater", S.wheel_heater, "wheel")}
        ${this._has("defrost") ? `<button class="chip ${this._on("defrost") ? "on" : ""}" data-act="defrost">${icon("defrost")}${S.defrost} · ${this._on("defrost") ? S.on : S.off}</button>` : ""}
      </div>
      ${presets.length ? `<div class="seg">${presets.map((p) => `<button class="${a.preset_mode === p ? "on" : ""}" data-act="preset" data-arg="${p}">${S.presets[p]}</button>`).join("")}</div><p class="hint">${S.preset_hint}</p>` : ""}
    </div>`;
  }

  _slider(key, label, unit) {
    const st = this._s(key);
    if (!st) return "";
    const a = st.attributes;
    return `<div class="slider">
      <div class="slider-head"><span>${label}</span><b id="out_${key}">${esc(st.state)}${unit}</b></div>
      <input type="range" min="${a.min ?? 0}" max="${a.max ?? 100}" step="${a.step ?? 1}" value="${esc(st.state)}" data-num="${key}" data-unit="${unit}">
    </div>`;
  }

  _chargePanel() {
    const S = this._str();
    const state = this._v("charging_state");
    const charging = state === "charging" || state === "starting";
    const plugged = this._on("charge_cable") || (state && state !== "disconnected");
    const power = this._num("charger_power");
    const rate = this._num("charge_rate");
    const rateUnit = this._s("charge_rate")?.attributes?.unit_of_measurement || "km/h";
    const added = this._num("energy_added");
    const ttf = this._num("time_to_full");
    const stat = (label, val) => `<div class="stat"><span>${label}</span><b>${val}</b></div>`;
    return `<div class="panel">
      <div class="stats">
        ${stat(S.charge_state, S.charging[state] ?? state ?? "--")}
        ${stat(S.charge_power, power != null ? `${power} kW` : "--")}
        ${stat(S.charge_rate_label, rate != null ? `${rate} ${esc(rateUnit)}` : "--")}
        ${stat(S.energy_added, added != null ? `${added} kWh` : "--")}
        ${ttf != null ? stat(S.time_remaining, ttf >= 1 ? S.duration_hm(Math.floor(ttf), Math.round((ttf % 1) * 60)) : S.duration_m(Math.round(ttf * 60))) : ""}
      </div>
      ${this._slider("charge_limit", S.charge_limit, "%")}
      ${this._slider("charge_current", S.charge_current, "A")}
      <div class="row center">
        ${this._has("charge_switch") ? `<button class="pill ${charging ? "on" : ""}" data-act="charge_toggle" ${plugged ? "" : "disabled"}>${icon("plug")}${charging ? S.stop_charging : plugged ? S.start_charging : S.not_plugged}</button>` : ""}
        ${this._has("charge_port") ? `<button class="pill" data-act="port">${icon("plug")}${this._v("charge_port") === "open" ? S.close_charge_port : S.open_charge_port}</button>` : ""}
      </div>
    </div>`;
  }

  // 胎压段（更多面板内 2×2）：四个实体全缺则整段不渲染，缺的格显示 --
  // Tyre-pressure block (2x2, in the "more" panel). Hidden when no sensor exists.
  _tpmsSection() {
    const keys = ["tpms_fl", "tpms_fr", "tpms_rl", "tpms_rr"];
    if (!keys.some((k) => this._s(k))) return "";
    const S = this._str();
    const cell = (k) => {
      const st = this._s(k);
      const ok = st && st.state !== "unknown" && st.state !== "unavailable";
      const unit = st?.attributes?.unit_of_measurement || "";
      return `<div class="tpms-cell"><span>${S[k]}</span><b>${ok ? `${esc(st.state)} ${esc(unit)}` : "--"}</b></div>`;
    };
    return `<div class="tpms"><div class="tpms-head">${S.tpms}</div><div class="tpms-grid">${keys.map(cell).join("")}</div></div>`;
  }

  _render() {
    if (!this._config || !this._hass) return;
    const S = this._str();
    const cfg = this._config;
    const online = this._on("online");
    const locked = this._v("lock") === "locked";
    // 车休眠或集成刚重载时锁状态可能未知，这时不要误报「未上锁」
    const unlocked = this._v("lock") === "unlocked";
    const bat = this._num("battery");
    const range = this._num("range");
    const rangeUnit = this._s("range")?.attributes?.unit_of_measurement || "km";
    const hasCharge = ["charging_state", "charge_switch", "charge_port", "charge_limit", "charge_current"].some((k) => this._has(k));
    // 数据新鲜度：status 实体（无则 battery）的 last_updated 相对时间
    // Data freshness: relative age of the status (or battery) entity.
    const lu = (this._s("online") || this._s("battery"))?.last_updated;
    let freshTxt = "";
    if (lu) {
      const t = new Date(lu).getTime();
      if (Number.isFinite(t)) freshTxt = S.rel_time(Math.max(0, Math.floor((Date.now() - t) / 1000)));
    }
    // 位置 / 导航信息行：导航中显示目的地与剩余行程，否则显示车辆位置
    // Location / navigation row: destination + remaining trip while navigating,
    // otherwise the vehicle's location.
    let infoRow = "";
    const dest = this._v("destination");
    if (dest && dest !== "unknown" && dest !== "unavailable") {
      const dist = this._num("distance_to_arrival");
      const distUnit = this._s("distance_to_arrival")?.attributes?.unit_of_measurement || "";
      const eta = this._num("time_to_arrival");
      infoRow = `<div class="inforow"><span>🧭 ${esc(dest)}${dist != null ? ` · ${dist} ${esc(distUnit)}` : ""}${eta != null ? ` · ${S.nav_eta(Math.round(eta))}` : ""}</span></div>`;
    } else if (this._s("tracker")) {
      const tState = this._v("tracker");
      const tLabel = tState === "home" ? S.at_home : tState === "not_home" ? S.away : tState;
      if (tLabel && tState !== "unknown" && tState !== "unavailable")
        infoRow = `<div class="inforow"><span>📍 ${esc(tLabel)}</span></div>`;
    }
    // 总里程 + 系统版本（有新版本时提示）
    const odo = this._num("odometer");
    const odoUnit = this._s("odometer")?.attributes?.unit_of_measurement || "km";
    const sw = this._s("software")?.attributes || {};
    const swNew = this._v("software") === "on" && sw.latest_version;
    const cstate = this._v("charging_state");
    const charging = cstate === "charging" || cstate === "starting";
    const inside = this._num("inside_temp");
    const outside = this._num("outside_temp");
    const climateOn = this._has("climate") && this._v("climate") !== "off";
    const alerts = this._alerts();
    // 一排四格车况（门窗/充电口/空调/充电上限），由 show_status 控制，默认不显示
    const openings = ["door_fl", "door_fr", "door_rl", "door_rr", "window_fl", "window_fr", "window_rl", "window_rr"].filter((k) => this._on(k)).length
      + (this._v("frunk") === "open" ? 1 : 0) + (this._v("trunk") === "open" ? 1 : 0);
    const cAttr = this._s("climate")?.attributes || {};
    const limitNow = this._num("charge_limit");
    // 状态排默认不显示，与 v1.6.6 的实际渲染一致（旧版该排算出后从未插入模板）；
    // 需要时显式设 show_status: true。min_height 只管撑高，两者不再绑定。
    // Status row is opt-in: hidden by default (matching what v1.6.6 actually
    // rendered); set show_status: true to show it. min_height only sizes the card.
    const showStatus = !!cfg.show_status;
    const viewsList = this._viewsList || VIEWS;
    const statusRow = showStatus
      ? `<div class="status">
          <div class="${openings ? "bad" : ""}"><span>${S.status_openings}</span><b>${openings ? S.openings_open(openings) : S.all_closed}</b></div>
          <div><span>${S.charge_port}</span><b>${this._v("charge_port") === "open" ? S.opened : S.closed}</b></div>
          <div data-act="panel" data-arg="climate"><span>${S.climate}</span><b>${climateOn ? `${S.on} · ${cAttr.temperature ?? "--"}°` : S.off}</b></div>
          <div data-act="panel" data-arg="charge"><span>${S.charge_limit}</span><b>${limitNow != null ? `${limitNow}%` : "--"}</b></div>
        </div>`
      : "";
    const paint = this._paintEntry();
    const modelDef = this._model();

    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <ha-card style="${cfg.min_height ? `min-height:${cfg.min_height}px` : ""}">
        <div class="head">
          <div>
            <div class="name">${esc(cfg.name)}</div>
            <div class="sub">${this._lang === "en" ? modelDef.labelEn : modelDef.label} · ${this._lang === "en" ? paint.labelEn : paint.label}</div>
          </div>
          <div class="badges">
            <span class="badge ${online ? "ok" : ""}" ${this._has("wake") ? `data-act="wake" title="${S.tap_to_wake}"` : ""}>${online ? S.online : S.asleep}</span>
            <span class="badge ${unlocked ? "alert" : ""}">${locked ? S.locked : unlocked ? S.unlocked : "--"}</span>
          </div>
        </div>
${infoRow}
        <div class="battery">
          <div class="bat-main">
            <b>${bat ?? "--"}</b><span class="pct">%</span>
            <span class="range">${range != null ? `${Math.round(range)} ${esc(rangeUnit)}` : ""}</span>
            ${charging ? `<span class="charging">⚡ ${S.charging[cstate]}</span>` : ""}
          </div>
        </div>

        <div class="meta">
          ${odo != null ? `<span>${S.odometer} <b>${Math.round(odo).toLocaleString("en-US")} ${esc(odoUnit)}</b></span>` : ""}
          ${sw.installed_version ? `<span>${S.version}<b>${esc(sw.installed_version)}</b>${swNew ? `<i class="new">${S.update_available} ${esc(sw.latest_version)}</i>` : ""}</span>` : ""}
          ${freshTxt ? `<span class="fresh">${esc(freshTxt)}</span>` : ""}
        </div>
${statusRow ? `
        ${statusRow}
` : ""}
        <div class="car" data-act="view" title="${S.car_title}">
          <div class="track" style="transform:translateX(-${this._viewIdx * 100}%)">
            ${viewsList.map(
              (v) => `<div class="slide"><img src="${this._imageUrl(v.id)}" alt="Model Y ${this._lang === "en" ? v.labelEn : v.label}" referrerpolicy="no-referrer" draggable="false"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <div class="car-fallback">${S.image_failed}</div></div>`
            ).join("")}
          </div>
          ${alerts.length ? `<div class="alerts">${alerts.map((a) => `<span>${esc(a)}</span>`).join("")}</div>` : ""}
        </div>
        <div class="dots">${viewsList.map((v, i) => `<button class="${i === this._viewIdx ? "on" : ""}" data-act="view" data-arg="${i}" title="${this._lang === "en" ? v.labelEn : v.label}"></button>`).join("")}</div>

        <div class="temps">
          <span>${S.interior} <b class="tv">${inside ?? "--"}°</b></span>
          <span>${S.exterior} <b class="tv">${outside ?? "--"}°</b></span>
          ${this._has("sentry") ? `<span class="${this._on("sentry") ? "on" : ""}">${S.sentry} <b>${this._on("sentry") ? S.sentry_on : S.sentry_off}</b></span>` : ""}
        </div>

        <div class="grid">
          ${this._has("lock") ? this._btn("lock", unlocked ? "unlock" : "lock", locked ? S.btn_locked : unlocked ? S.btn_unlocked : S.btn_lock, unlocked, { warn: unlocked }) : ""}
          ${this._has("climate") ? this._btn("panel", "fan", climateOn ? S.climate_on : S.climate, climateOn || this._panel === "climate", { arg: "climate" }) : ""}
          ${hasCharge ? this._btn("panel", "plug", charging ? S.charging_btn : S.charge, charging || this._panel === "charge", { arg: "charge" }) : ""}
          ${this._has("trunk") ? this._btn("trunk", "trunk", S.trunk, this._v("trunk") === "open") : ""}
          ${this._btn("panel", "dots", this._panel === "more" ? S.collapse : S.more, this._panel === "more", { arg: "more" })}
        </div>

        ${this._panel === "climate" ? this._climatePanel() : ""}
        ${this._panel === "charge" ? this._chargePanel() : ""}
        ${this._panel === "more" ? `<div class="grid more">
          ${this._has("frunk") ? this._btn("frunk", "frunk", S.frunk, this._v("frunk") === "open") : ""}
          ${this._has("windows") ? this._btn("windows", "window", S.windows, this._v("windows") === "open") : ""}
          ${this._has("sentry") ? this._btn("sentry", "shield", S.sentry, this._on("sentry")) : ""}
          ${this._has("flash") ? this._btn("flash", "flash", S.flash, false) : ""}
          ${this._has("horn") ? this._btn("horn", "horn", S.horn, false) : ""}
        </div>${this._tpmsSection()}` : ""}

        <div id="toast" class="toast"></div>
      </ha-card>`;

    // 车图加载完成后做空影图检测（桩环境下 querySelectorAll 返回空，无副作用）
    // After render, hook the shadow-only image check onto each car image.
    this.shadowRoot.querySelectorAll(".slide img").forEach((img) => {
      img.addEventListener("load", () => this._checkImage(img));
      if (img.complete && img.naturalWidth) this._checkImage(img);
    });
  }
}

const STYLES = `
:host { --accent: #3e6ae1; --muted: var(--secondary-text-color, #8a8f98); --tile: rgba(127,127,127,.10); --tile-on: rgba(62,106,225,.18); }
ha-card { position: relative; padding: 16px; overflow: hidden; }
svg { width: 22px; height: 22px; flex: none; }
button { font: inherit; color: inherit; border: 0; cursor: pointer; background: none; }
button:disabled { opacity: .4; cursor: not-allowed; }

.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.name { font-size: 18px; font-weight: 600; letter-spacing: .5px; } /* 与其他卡片标题统一 */
.sub { color: var(--muted); font-size: 14px; margin-top: 2px; }
.badges { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.badge { font-size: 14px; padding: 4px 12px; border-radius: 999px; background: var(--tile); color: var(--muted); cursor: default; }
.badge[data-act] { cursor: pointer; }
.badge.ok { color: var(--secondary-text-color); background: rgba(127,127,127,.16); } /* 正常状态用灰色 */
.badge.alert { color: #ff5b5b; background: rgba(255,91,91,.14); }

.battery { margin-top: 14px; }
.bat-main { display: flex; align-items: baseline; gap: 4px; flex-wrap: wrap; }
.bat-main b { font-size: 40px; font-weight: 300; line-height: 1; }
.pct { font-size: 18px; color: var(--muted); }
.range { margin-left: 10px; font-size: 20px; }
.charging { margin-left: auto; color: #3ddc84; font-size: 13px; }
.meta { display: flex; flex-wrap: wrap; gap: 4px 18px; margin-top: 8px; font-size: 15px; color: var(--muted); }
.meta:empty { display: none; }
.meta b { font-weight: 500; color: var(--primary-text-color); margin-left: 2px; font-variant-numeric: tabular-nums; }
.meta .new { font-style: normal; margin-left: 6px; padding: 1px 8px; border-radius: 999px; font-size: 13px; color: #3e6ae1; background: rgba(62,106,225,.16); }

/* 官方渲染图为 1440x810，车身大约位于 x 250–1190、y 200–590，用负边距裁掉四周留白 */
.car { position: relative; margin: 6px 0 0; cursor: pointer; overflow: hidden; touch-action: pan-y; }
.track { display: flex; transition: transform .45s cubic-bezier(.4,0,.2,1); }
.slide { flex: 0 0 100%; aspect-ratio: 940 / 390; overflow: hidden; }
.slide img { display: block; width: 153.2%; max-width: none; height: auto; margin: -21.3% 0 0 -26.6%; user-select: none; -webkit-user-drag: none; pointer-events: none; }
.dots { display: flex; justify-content: center; gap: 6px; margin: 2px 0 6px; }
.dots button { width: 6px; height: 6px; padding: 0; border-radius: 3px; background: var(--muted); opacity: .35; transition: width .25s, opacity .25s; }
.dots button.on { width: 18px; opacity: .9; }
.cabin { position: relative; margin: -14px -14px 0; padding: 14px 14px 16px; border-radius: 16px 16px 0 0; background-size: cover; background-position: 40% 55%; color: #fff; min-height: 150px; display: flex; flex-direction: column; justify-content: flex-end; }
.cabin::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.6)); }
.cabin > * { position: relative; }
.cabin-info { position: absolute; top: 12px; left: 14px; font-size: 12px; padding: 3px 10px; border-radius: 999px; background: rgba(0,0,0,.45); }
.cabin .temp span { color: rgba(255,255,255,.8); }
.cabin .round { background: rgba(255,255,255,.2); color: #fff; backdrop-filter: blur(6px); }
.car-fallback { display: none; height: 100%; align-items: center; justify-content: center; color: var(--muted); font-size: 13px; }
.alerts { position: absolute; left: 16px; right: 16px; bottom: 4px; display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.alerts span { font-size: 12px; padding: 3px 10px; border-radius: 999px; color: #fff; background: rgba(230,70,70,.9); }

/* 车内 / 车外 / 哨兵：灰色胶囊，温度橙色，哨兵开启时蓝色 */
.temps { display: flex; justify-content: center; gap: 10px; color: var(--muted); font-size: 15px; margin: 8px 0 14px; }
.temps span { padding: 4px 12px; border-radius: 999px; background: rgba(127,127,127,.18); white-space: nowrap; }
.temps b { color: var(--primary-text-color); font-weight: 600; margin-left: 2px; font-variant-numeric: tabular-nums; }
.temps b.tv { color: #fb923c; }
.temps span.on { background: rgba(62,106,225,.18); }
.temps span.on b { color: #6b8ff0; }

.grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.grid.more { margin-top: 8px; animation: slide .2s ease-out; }
.act { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 2px; border-radius: 14px; background: var(--tile); transition: background .2s, transform .1s; }
.act:active { transform: scale(.95); }
.act .lbl { font-size: 14px; white-space: nowrap; }
.act.on { background: var(--tile-on); color: var(--accent); }
.act.warn { background: rgba(255,91,91,.14); color: #ff5b5b; }

.panel { margin-top: 12px; padding: 14px; border-radius: 16px; background: var(--tile); animation: slide .2s ease-out; }
@keyframes slide { from { opacity: 0; transform: translateY(-6px); } }
.temp-row { display: flex; align-items: center; justify-content: center; gap: 24px; }
.temp { text-align: center; }
.temp b { font-size: 38px; font-weight: 300; display: block; line-height: 1.1; }
.temp span { font-size: 12px; color: var(--muted); }
.round { width: 44px; height: 44px; border-radius: 50%; background: var(--tile); display: grid; place-items: center; }
.row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.center { justify-content: center; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 999px; background: var(--tile); font-size: 14px; }
.pill svg { width: 18px; height: 18px; }
.pill.on { background: var(--accent); color: #fff; }
.chips { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
.chip { display: flex; align-items: center; gap: 6px; padding: 9px 10px; border-radius: 12px; background: var(--tile); font-size: 13px; text-align: left; }
.chip svg { width: 18px; height: 18px; }
.chip.on { background: rgba(255,140,50,.18); color: #ff8c32; }
.seg { display: flex; margin-top: 12px; border-radius: 12px; background: var(--tile); padding: 3px; }
.seg button { flex: 1; padding: 7px 0; border-radius: 9px; font-size: 13px; }
.seg button.on { background: var(--card-background-color, #fff); box-shadow: 0 1px 3px rgba(0,0,0,.2); font-weight: 600; }
.hint { color: var(--muted); font-size: 11px; margin: 6px 2px 0; }
.stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px; }
.stat span { display: block; font-size: 12px; color: var(--muted); }
.stat b { font-size: 16px; font-weight: 500; }
.slider { margin-top: 14px; }
.slider-head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
input[type=range] { width: 100%; accent-color: var(--accent); }
.muted { color: var(--muted); }

.toast { position: absolute; left: 50%; bottom: 12px; transform: translate(-50%, 20px); opacity: 0; pointer-events: none; padding: 6px 14px; border-radius: 999px; background: rgba(0,0,0,.75); color: #fff; font-size: 13px; transition: .25s; }
.toast.show { opacity: 1; transform: translate(-50%, 0); }

/* min_height：撑高时车图区域在多余空间里垂直居中 */
:host([fill]) ha-card { display: flex; flex-direction: column; box-sizing: border-box; }
:host([fill]) .car { flex: 1; display: flex; flex-direction: column; justify-content: center; }
:host([fill]) .track { width: 100%; }
/* 精简文字 */
.sub { display: none; }
.status { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 16px; }
.status div { padding: 9px 10px; border-radius: 12px; background: var(--tile); min-width: 0; }
.status div[data-act] { cursor: pointer; }
.status span { display: block; font-size: 12px; color: var(--muted); }
.status b { display: block; font-size: 14px; font-weight: 500; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.status .bad b { color: #ff5b5b; }

/* 两次点击确认的待确认态 / two-tap confirmation armed state */
.act.armed { background: rgba(230,70,70,.9); color: #fff; animation: armedpulse .5s ease-in-out infinite alternate; }
@keyframes armedpulse { from { transform: scale(1); } to { transform: scale(1.05); } }

/* 位置 / 导航信息行 */
.inforow { margin-top: 10px; font-size: 13px; color: var(--muted); }
.inforow span { font-variant-numeric: tabular-nums; }

/* 胎压段（更多面板内） */
.tpms { margin-top: 8px; padding: 10px 12px; border-radius: 14px; background: var(--tile); animation: slide .2s ease-out; }
.tpms-head { font-size: 13px; color: var(--muted); margin-bottom: 6px; }
.tpms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
.tpms-cell { display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; }
.tpms-cell span { color: var(--muted); }
.tpms-cell b { font-weight: 500; font-variant-numeric: tabular-nums; }

@media (max-width: 380px) {
  .grid { grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .act .lbl { font-size: 11px; }
  .chips { grid-template-columns: 1fr; }
}
`;

// 可视化编辑器：在 HA 的卡片编辑器里以表单方式改配置。优先用 HA 表单组件
// （ha-select / ha-textfield / ha-switch），未定义时回退原生控件。
// Visual config editor: form-based editing in Home Assistant's card editor.
// Uses HA form components when available, native controls otherwise.
class TeslaVehicleCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this.shadowRoot.addEventListener("change", (ev) => {
      const el = ev.target;
      if (!el.dataset || !el.dataset.field) return;
      const value = el.type === "checkbox" || el.tagName === "HA-SWITCH" ? el.checked : el.value;
      this._setField(el.dataset.field, value);
    });
  }

  setConfig(config) {
    this._config = { ...(config || {}) };
    this._render();
  }

  _labels() {
    return detectLang() === "zh"
      ? { vehicle: "车辆前缀 vehicle（必填）", name: "显示名称", model: "车型", paint: "车漆", wheels: "轮毂", interior: "内饰", view: "默认视角", language: "界面语言", show_status: "显示状态排", min_height: "最小高度 px（可选）", climate: "空调实体 ID（可选）", trim: "Trim 码覆盖（高级，可选）", image_options: "原始 options 串（逃生舱，可选）", auto: "自动（跟随 HA）" }
      : { vehicle: "Vehicle prefix (required)", name: "Name", model: "Model", paint: "Paint", wheels: "Wheels", interior: "Interior", view: "Default view", language: "UI language", show_status: "Show status row", min_height: "Min height in px (optional)", climate: "Climate entity ID (optional)", trim: "Trim code override (advanced, optional)", image_options: "Raw options string (escape hatch, optional)", auto: "Auto (follow HA)" };
  }

  _setField(key, raw) {
    const cfg = { ...this._config };
    if (key === "min_height") {
      const n = parseInt(raw, 10);
      if (raw !== "" && raw != null && Number.isFinite(n)) cfg.min_height = n;
      else delete cfg.min_height;
    } else if (key === "show_status") {
      cfg.show_status = !!raw;
    } else if (key === "wheels") {
      const n = parseInt(raw, 10);
      cfg.wheels = Number.isFinite(n) ? n : raw;
    } else if (raw === "" || raw == null) {
      delete cfg[key];
    } else {
      cfg[key] = raw;
    }
    if (key === "model") {
      // 车型联动：车漆/轮毂/内饰不属于新车型时重置为该车型默认值
      const m = MODELS[cfg.model] || MODELS.modely_juniper;
      if (!m.paints[cfg.paint]) cfg.paint = m.default_paint;
      if (!m.wheels[cfg.wheels]) cfg.wheels = m.default_wheels;
      if (!m.interiors[cfg.interior] && !(cfg.model === "modely_juniper" && JUNIPER_LEGACY_INTERIORS[cfg.interior]))
        cfg.interior = m.default_interior;
    }
    this._config = cfg;
    this.dispatchEvent(new CustomEvent("config-changed", { bubbles: true, composed: true, detail: { config: cfg } }));
    if (key === "model") this._render();
  }

  _render() {
    if (!this.shadowRoot) return;
    const L = this._labels();
    const en = detectLang() === "en";
    const cfg = this._config;
    const m = MODELS[cfg.model] || MODELS.modely_juniper;
    const modelKey = MODELS[cfg.model] ? cfg.model : "modely_juniper";
    const paintKey = m.paints[cfg.paint] ? cfg.paint : m.default_paint;
    const wheelKey = m.wheels[cfg.wheels] ? cfg.wheels : m.default_wheels;
    const interiorKey = m.interiors[cfg.interior] ? cfg.interior : m.default_interior;
    const useHa = typeof customElements !== "undefined" && !!customElements.get && !!customElements.get("ha-select");
    const opt = (val, label, sel) =>
      useHa
        ? `<mwc-list-item value="${esc(val)}" ${sel ? "selected" : ""}>${esc(label)}</mwc-list-item>`
        : `<option value="${esc(val)}" ${sel ? "selected" : ""}>${esc(label)}</option>`;
    const sel = (field, value, entries) => {
      const inner = entries.map(([v, l]) => opt(v, l, String(v) === String(value))).join("");
      return useHa
        ? `<ha-select data-field="${field}" value="${esc(value)}">${inner}</ha-select>`
        : `<select data-field="${field}">${inner}</select>`;
    };
    const text = (field, value, type = "text") =>
      useHa
        ? `<ha-textfield data-field="${field}" type="${type}" value="${esc(value ?? "")}"></ha-textfield>`
        : `<input data-field="${field}" type="${type}" value="${esc(value ?? "")}">`;
    const sw = (field, checked) =>
      useHa
        ? `<ha-switch data-field="${field}" ${checked ? "checked" : ""}></ha-switch>`
        : `<input data-field="${field}" type="checkbox" ${checked ? "checked" : ""}>`;
    const fld = (label, control) => `<label class="fld"><span>${label}</span>${control}</label>`;
    this.shadowRoot.innerHTML = `
      <style>
        .fld { display: flex; flex-direction: column; gap: 4px; margin: 0 0 12px; font-size: 13px; }
        .fld select, .fld input[type="text"], .fld input[type="number"] { font: inherit; padding: 6px 8px; }
        ha-select, ha-textfield { width: 100%; }
      </style>
      <div class="form">
        ${fld(L.vehicle, text("vehicle", cfg.vehicle))}
        ${fld(L.name, text("name", cfg.name))}
        ${fld(L.model, sel("model", modelKey, Object.entries(MODELS).map(([k, mm]) => [k, en ? mm.labelEn : mm.label])))}
        ${fld(L.paint, sel("paint", paintKey, Object.entries(m.paints).map(([k, p]) => [k, en ? p.labelEn : p.label])))}
        ${fld(L.wheels, sel("wheels", wheelKey, Object.entries(m.wheels).map(([k, code]) => [k, `${k}" · ${code}`])))}
        ${fld(L.interior, sel("interior", interiorKey, Object.entries(m.interiors).map(([k, code]) => [k, `${k} · ${code}`])))}
        ${fld(L.view, sel("view", cfg.view || "3qtr", VIEWS.map((v) => [v.key, en ? v.labelEn : v.label])))}
        ${fld(L.language, sel("language", cfg.language || "auto", [["auto", L.auto], ["zh", "中文"], ["en", "English"]]))}
        ${fld(L.show_status, sw("show_status", !!cfg.show_status))}
        ${fld(L.min_height, text("min_height", cfg.min_height, "number"))}
        ${fld(L.climate, text("climate", cfg.climate))}
        ${fld(L.trim, text("trim", cfg.trim))}
        ${fld(L.image_options, text("image_options", cfg.image_options))}
      </div>`;
  }
}

customElements.define("tesla-vehicle-card-editor", TeslaVehicleCardEditor);
customElements.define("tesla-vehicle-card", TeslaVehicleCard);
// Legacy alias from the private 1.x builds: existing dashboards keep working.
customElements.define("model-y-card-editor", TeslaVehicleCardEditor);
customElements.define("model-y-card", TeslaVehicleCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "tesla-vehicle-card",
  name: STRINGS[detectLang()].picker_name,
  description: STRINGS[detectLang()].picker_desc,
  preview: false,
});
console.info(`%c TESLA-VEHICLE-CARD %c v${VERSION} `, "background:#3e6ae1;color:#fff", "background:#222;color:#fff");
