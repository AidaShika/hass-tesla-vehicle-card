# Tesla Vehicle Card

Home Assistant で **テスラ車両** を操作する、フルスクリーン風コントロールカード。単一ファイル・依存関係ゼロで、車両画像はテスラ公式コンフィギュレーターがリアルタイムに描画します。対応モデルは Model Y（2025年以降のリフレッシュモデルと 2020–2025年モデル）、Model 3（2017–2024年）、リフレッシュ後の Model S / Model X（2021年以降）。カードの要素名は `custom:tesla-vehicle-card` で、個人ビルドで使っていた `custom:model-y-card` も互換エイリアスとして登録され続けるため、既存のダッシュボードはそのまま動作します。

English: [README.md](README.md) ／ 中文：[README.zh-CN.md](README.zh-CN.md)

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=AidaShika&repository=hass-tesla-vehicle-card&category=plugin)

![Tesla Vehicle Card](docs/screenshot-main.jpg)

## 特長

- **あなたの車そのもの** — 車両画像はテスラ公式コンフィギュレーターの描画で、モデル / カラー / ホイール / インテリアのオプションコードから生成されます。画像パックのダウンロードもスクリーンショットの準備も不要。車両をスワイプまたはタップすると、フロント3/4・サイド・リア3/4の視点を切り替えられます。
- **5モデル、検証済みコード** — Model Y リフレッシュ（"Juniper"）、Model Y 2020–2025、Model 3 2017–2024、Model S 2021以降、Model X 2021以降のプリセットを内蔵。表のオプションコードはすべて 2026-10-24 にテスラの実際のコンフィギュレーターで検証済みです。
- **それ以外のための緊急手段** — プリセットのないモデル（Model 3 "Highland"、リフレッシュ前の Model S など）は、ご自身のテスラアカウントの車両画像 URL に含まれる `image_options` 文字列をそのまま貼り付ければ、カードがそれをそのまま使います。
- **ひと目で把握** — バッテリー残量と航続距離（エンティティの単位に従います）、走行距離、ソフトウェアバージョン（「アップデートあり」バッジ付き）、オンライン / スリープとロック状態、データの鮮度（「5分前に更新」）、車内 / 外気温度、セントリーモードの状態、タイヤ空気圧。ドア・窓・フロントトランク・リアトランクが開いていれば警告行を表示します。
- **位置とナビ** — ナビ中は目的地・残り距離・到着予定時刻を行に表示し、それ以外のときはデバイストラッカーによる車両の現在地を表示します。
- **空調パネル** — オン / オフ、設定温度、前席シートヒーターとハンドルヒーター、デフロスト、そしてキープ / ペット / キャンプの車内モード。背景は公式インテリア描画（内装ビューがない Model S/X では外観描画）です。
- **充電パネル** — 充電状態、充電電力、充電速度、今回の充電量、満充電までの時間、充電制限と充電電流のスライダー、充電開始 / 停止、充電ポートの操作。
- **正直なフィードバックのクイック操作** — ロック / 解除、フロントトランク、リアトランク、窓のチルト、セントリー、フラッシュ、ホーン。エンティティが存在しない操作は失敗を装わず非表示になり、コマンドはサービス呼び出しが実際に成功して初めて成功と報告します（失敗時は理由を表示）。破壊的な操作はブラウザのポップアップではなく、2回タップ確認（1回目で準備、2回目で実行）を使います。車両がスリープ中の場合、コマンドはまず車両を起動し、オンラインになるまで待ってから実行します（途中で再びスリープした場合は1回だけ再試行）。ソフトウェアアップデートがあり、アップデートエンティティがインストールに対応していれば、バージョンバッジから同じ2回タップ確認でインストールでき、インストール中は進捗を表示します。
- **ビジュアルエディター** — Home Assistant の GUI エディターで設定できます。モデル・カラー・ホイール・インテリアをプルダウンから選択（選択肢はモデルに連動）。YAML は不要です。
- **3つの言語** — 中国語・英語・日本語の UI（`language` オプション、または Home Assistant の言語に自動追従）。
- **依存関係ゼロ** — プレーンな JavaScript 1ファイルのみ。ビルド工程なし、他のカードも不要です。

## スクリーンショット

すべてのスクリーンショット（冒頭のメイン画像を含む）は、カード自体がデモデータで描画したものです。

|  |  |
|---|---|
| ![Navigation row, side view](docs/screenshot-nav-red.jpg) | ![Rear view, Pearl White](docs/screenshot-rear-white.jpg) |
| 走行中：目的地・残り距離・到着予定時刻を示すナビ行 — Model Y リフレッシュ、Ultra Red、サイドビュー | リア3/4ビュー — Model Y リフレッシュ、Pearl White |
| ![Legacy Model Y, Deep Blue](docs/screenshot-legacy-blue.jpg) | ![Model S refresh, Solid Black](docs/screenshot-model-s.jpg) |
| Model Y 2020–2025 プリセット、Deep Blue Metallic | Model S 2021以降プリセット、Solid Black |
| ![Model 3 legacy, Red Multi-Coat](docs/screenshot-model-3.jpg) | ![Model X refresh, Pearl White](docs/screenshot-model-x.jpg) |
| Model 3 2017–2024 プリセット、Red Multi-Coat | Model X 2021以降プリセット、Pearl White |
| ![Charge panel](docs/screenshot-charge.jpg) | ![Climate panel](docs/screenshot-climate.jpg) |
| 充電パネル：充電状態、電力、速度、今回の充電量、残り時間、充電制限と電流のスライダー | 公式インテリア描画の上の空調パネル：設定温度、シートヒーター、ハンドルヒーター |
| ![More panel with tyre pressure](docs/screenshot-more-tpms.jpg) | ![Chinese UI with status row](docs/screenshot-status-zh.jpg) |
| その他パネル：クイック操作とタイヤ空気圧グリッド | ステータス行を有効化した中国語 UI（`show_status: true`） |
| ![Visual editor](docs/screenshot-editor.jpg) |  |
| ビジュアルエディター：モデルに連動するカラー / ホイール / インテリアのプルダウン — YAML 不要 |  |

## 要件

- **Tesla Fleet** または **Teslemetry** のエンティティ命名規則に従うテスラ連携を入れた Home Assistant（公式 Tesla Fleet 連携はそのまま動作します）。
- ダッシュボードを表示するデバイスから `static-assets.tesla.com` へアクセスできること（車両画像用）。

## インストール

### HACS（カスタムリポジトリ）経由

1. Home Assistant で **HACS → ⋮（右上）→ Custom repositories** を開きます。
2. `https://github.com/AidaShika/hass-tesla-vehicle-card` をカテゴリ **Dashboard**（Lovelace）で追加します。
3. HACS で **Tesla Vehicle Card** を見つけてダウンロードします。
4. ブラウザを再読み込みするか、コンパニオンアプリを完全に再起動します。

### 手動

1. このリポジトリから `tesla-vehicle-card.js` を取得します — リポジトリ内のファイルを開いて raw ファイルをダウンロードするか、[リリースページ](https://github.com/AidaShika/hass-tesla-vehicle-card/releases)のソースアーカイブ（zip / tar.gz）から取り出します。
2. Home Assistant の `/config/www/tesla-vehicle-card.js` にコピーします。
3. **設定 → ダッシュボード → ⋮ → リソース → リソースを追加** で以下を登録します：
   - URL: `/local/tesla-vehicle-card.js`
   - リソースタイプ： **JavaScript モジュール**
4. ブラウザを再読み込みします。

> 個人ビルド 1.x（`custom:model-y-card`）から来た方へ：その要素名は互換エイリアスとして登録され続けるため、既存のダッシュボードは変更なしで動作します。新しい設定では `custom:tesla-vehicle-card` を使ってください。

## 設定

ビジュアルエディター、または YAML でダッシュボードにカードを追加します（[examples/dashboard.yaml](examples/dashboard.yaml) 参照）：

```yaml
type: custom:tesla-vehicle-card
vehicle: my_model_y
name: My Model Y
```

| オプション | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `vehicle` | **はい** | — | エンティティ ID に使う車両プレフィックス（例：`sensor.my_model_y_battery_level` なら `my_model_y`）。 |
| `name` | いいえ | `Model Y` | カード上部に表示する名前。 |
| `model` | いいえ | `modely_juniper` | モデルプリセット： `modely_juniper` \| `modely_legacy` \| `model3_legacy` \| `models_refresh` \| `modelx_refresh`。`model` のない既存設定は `modely_juniper` として扱われ、動作は変わりません。 |
| `paint` | いいえ | モデル依存 | カラーのキー。使用できるカラーは `model` に依存します（下表参照）。 |
| `wheels` | いいえ | モデル依存 | ホイールサイズ。使用できるホイールは `model` に依存します（下表参照）。 |
| `interior` | いいえ | モデル依存 | インテリアのキー。使用できるインテリアは `model` に依存します（下表参照）。 |
| `view` | いいえ | `3qtr` | 画像のデフォルト視点： `3qtr` \| `side` \| `rear`。スワイプまたはタップで切り替えできます。 |
| `climate` | いいえ | `climate.{vehicle}_climate` | 空調エンティティ ID が自動導出と異なる場合に指定します。 |
| `entities` | いいえ | — | エンティティごとの上書きマップ。キーはカード内部のエンティティキー（後述）。 |
| `language` | いいえ | `auto` | UI言語： `zh` \| `en` \| `ja` \| `auto`（Home Assistant の言語に追従）。 |
| `show_status` | いいえ | `false` | ステータス行（ドア・窓 / 充電ポート / 空調 / 充電制限）を表示します。デフォルトは非表示。`min_height` とは独立しています。 |
| `min_height` | いいえ | — | カードを固定の最小の高さ（px）に引き伸ばします（スマートフォンの全画面ダッシュボードなら `876` など）。 |
| `trim` | いいえ | モデル依存 | 高度な設定：モデルの compositor trim コードを上書きします（例：旧型 Model 3 に `MT317` を指定すると 2021年以降のブラックトリム外観と Performance ホイールが得られます）。 |
| `image_options` | いいえ | — | 緊急手段：compositor の options 文字列まるごと（後述）。設定すると `paint` / `wheels` / `interior` / `trim` は無視されます。 |

### モデルと検証済みオプション

オプションコードは **2026-10-24** にテスラの実際のコンフィギュレーターで検証済みです。検証済みのものだけを提供します — コードが1つでも無効だとコンフィギュレーターはリクエスト全体を拒否し、trim コードがないと影だけの画像を黙って返すため、プリセットは推測しません。

| モデル（`model:`） | カラー | ホイール | インテリア |
| --- | --- | --- | --- |
| `modely_juniper` — Model Y 2025以降リフレッシュ | `stealth_grey` (PN01), `quicksilver` (PN00), `pearl_white` (PPSW), `solid_black` (PBSB), `ultra_red` (PR01), `deep_blue` (PPSB) | `19` Crossflow (WY19P), `20` Helix 2.0 (WY20A) | `black` (IPB10), `white` (IPW10) |
| `modely_legacy` — Model Y 2020–2025 | `pearl_white` (PPSW), `midnight_silver` (PMNG), `deep_blue` (PPSB), `red_multicoat` (PPMR), `solid_black` (PBSB), `quicksilver` (PN00), `ultra_red` (PR01) | `19` Gemini (WY19B), `20` Induction (WY20P) | `black` (INPB0), `white` (INPW0) |
| `model3_legacy` — Model 3 2017–2024 | `midnight_silver` (PMNG), `pearl_white` (PPSW), `deep_blue` (PPSB), `solid_black` (PBSB), `red_multicoat` (PPMR) | `18` Aero (W38B), `19` Sport (W39B), `20` Performance (W33D, `MT317` のような Performance の `trim` が必要) | `black` (IN3PB), `white` (IN3PW) |
| `models_refresh` — Model S 2021以降 | `solid_black` (PBSB), `ultra_red` (PR01), `pearl_white` (PPSW) | `19` Tempest (WS90), `21` Arachnid (WS12) | `black` (IBE00), `cream` (IBC00) |
| `modelx_refresh` — Model X 2021以降 | `pearl_white` (PPSW) | `22` Turbine (WX00) | `black` (IBE00) |

補足：

- 旧個人ビルドの Model Y インテリア `black_dark_headliner` / `white_dark_headliner` は `modely_juniper` で引き続き動作します（コード IPB11 / IPW11、2026-10-24 のマトリクスで再検証していないためエディターには出ません）。
- Model S / X にはコンフィギュレーターに内装（シート）ビューがないため、空調パネルは外観描画を背景に使います。
- パラメーターに不整合があると、コンフィギュレーターが HTTP 200 で影だけの画像を返すことがあります。カードは読み込んだ画像をサンプリングし、その場合は「画像を読み込めませんでした」メッセージに切り替えます。

### `image_options` 緊急手段

プリセットのないモデル — Model 3 "Highland"、リフレッシュ前の Model S、珍しい年式 / トリム — 向けに、ご自身の車の画像に使われている options 文字列をそのまま貼り付けられます：

1. テスラアカウント（または tesla-info のようなサイト）を開き、車両画像の URL を探します。`options=` パラメーター（例：`$MDLY,$MTY09,$PPSW,$WY19B,$INPW0`）が含まれています。
2. そのパラメーター値全体を `image_options` にコピーします：

```yaml
type: custom:tesla-vehicle-card
vehicle: my_model_3
name: My Model 3
model: model3_legacy   # compositor の model= パラメーター（m3）を決めます。車両ファミリーが合うプリセットを指定してください
image_options: "$MTxxx,$PPSW,$Wxxxx,$IPxxx"   # 形式の例 — ご自身の車の実際の文字列を貼ってください
```

`image_options` を設定すると `paint` / `wheels` / `interior` / `trim` は無視されます。`model` プリセットは compositor の `model=` パラメーターとして引き続き使われます（`model` がなければ `my` がデフォルト）。

## エンティティ

すべてのエンティティ ID は `vehicle` プレフィックスから、Tesla Fleet / Teslemetry の命名規則で導出されます。`vehicle: my_model_y` の例：

| 用途 | エンティティ |
| --- | --- |
| オンライン / スリープ | `binary_sensor.my_model_y_status` |
| ロック | `lock.my_model_y_lock` |
| バッテリー残量 / 航続距離 | `sensor.my_model_y_battery_level` / `sensor.my_model_y_battery_range` |
| 走行距離 | `sensor.my_model_y_odometer` |
| ソフトウェアアップデート | `update.my_model_y_update` |
| 充電状態 / 電力 / 速度 / 充電量 / 満充電までの時間 | `sensor.my_model_y_charging`, `_charger_power`, `_charge_rate`, `_charge_energy_added`, `_time_to_full_charge` |
| 充電ケーブル / 開始停止 / 制限 / 電流 / ポートドア | `binary_sensor.my_model_y_charge_cable`, `switch.my_model_y_charge`, `number.my_model_y_charge_limit`, `number.my_model_y_charge_current`, `cover.my_model_y_charge_port_door` |
| 温度（車内 / 外気） | `sensor.my_model_y_inside_temperature` / `sensor.my_model_y_outside_temperature` |
| フロントトランク / リアトランク / 窓 | `cover.my_model_y_frunk` / `cover.my_model_y_trunk` / `cover.my_model_y_windows` |
| セントリー / デフロスト | `switch.my_model_y_sentry_mode` / `switch.my_model_y_defrost` |
| シート＆ハンドルヒーター | `select.my_model_y_seat_heater_front_left`, `_front_right`, `select.my_model_y_steering_wheel_heater` |
| ホーン / フラッシュ / 起動ボタン | `button.my_model_y_honk_horn` / `button.my_model_y_flash_lights` / `button.my_model_y_wake` |
| ドア＆窓センサー | `binary_sensor.my_model_y_{front,rear}_{driver,passenger}_{door,window}` |
| 空調 | `climate.my_model_y_climate`（`climate:` で上書き可能） |
| タイヤ空気圧 | `sensor.my_model_y_tire_pressure_front_left` / `_front_right` / `_rear_left` / `_rear_right`（Fleet）、または `sensor.my_model_y_tpms_pressure_fl` / `_fr` / `_rl` / `_rr`（Teslemetry）— 存在する最初の候補を使用 |
| 位置 | `device_tracker.my_model_y`（または `device_tracker.my_model_y_location`） |
| ナビ | `sensor.my_model_y_active_route_destination`, `sensor.my_model_y_active_route_distance_to_arrival`, `sensor.my_model_y_active_route_time_to_arrival`（または短い名前の `sensor.my_model_y_destination`, `_distance_to_arrival`, `_time_to_arrival`） |

導出されたエンティティは `entities:` マップで個別に置き換えられます。キーはカード内部キー（`battery`, `lock`, `frunk`, `sentry`, `seat_left`, `tpms_fl`, `tracker`, `destination`, …）です：

```yaml
entities:
  battery: sensor.my_custom_battery_level
  tpms_fl: sensor.my_custom_tpms_front_left
```

環境に存在しないエンティティは可能な範囲で読み飛ばされます：存在しないエンティティの操作ボタンは描画されず、タイヤ空気圧ブロックはセンサーがなければ自ら隠れ、パネルは穏やかに縮退します。

## 免責事項

- **車両画像はテスラ公式 CDN**（`static-assets.tesla.com`）**からリアルタイムに配信されます**。車両のアートワークはすべて **© Tesla, Inc.** です。本プロジェクトはコンフィギュレーターのオプションパラメーター（カラー / ホイール / インテリアのコード）を画像 URL に組み立てるだけで、テスラの画像を再配布しません。
- アイコンの大半は本プロジェクトのためにテスラアプリの視覚スタイルで描いたオリジナルの線画で、**テスラ公式のアイコン素材ではありません**。4つのアイコン（ファン、セントリーの盾、窓、ハンドル）は Material Design Icons のオリジナルグリフを使用しています — Home Assistant が同梱するのと同じセットです（Apache License 2.0）。
- 本プロジェクトは非公式のコミュニティプロジェクトであり、**Tesla, Inc. とは提携・推奨・後援の関係にありません**。
- 画像はテスラのコンフィギュレーターサービスに依存するため、**テスラのウェブサイトや API の変更により、いつでも画像描画が壊れる可能性があります**。
- 実際の車両をダッシュボードから操作することは本質的に慎重を要します — このカードの破壊的な操作は確認（2回タップ）を求めますが、ご自身の責任でご利用ください。

## ロードマップ

- Model 3 "Highland" プリセット — 検証済み trim コード待ち。それまではご自身の車の文字列で `image_options` をお使いください
- Cybertruck — コンフィギュレーターの compositor が未対応（2026-10-24 検証）。状況が変われば再検討します
- P2：後席シートヒーター、部分（非全量）再描画
- 英語文案のさらなる改善と言語の追加

## 開発

ビルド工程なし — `tesla-vehicle-card.js` を直接編集します。スモークテスト（プレーンな Node、DOM スタブ）：

```bash
node --check tesla-vehicle-card.js
node tests/smoke.mjs
```

## ライセンス

[MIT](LICENSE) © 2026 AidaShika
