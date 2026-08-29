# Creator Campaign Review — 平台流程、Skill 与实现规格

本文档分三部分：平台流程说明、Skill 规范、落地实现规格。流程中能由 SQL 或代码确定完成的步骤不使用 Skill，仅在需要判断、归因、组织语言的三处使用 Skill。

---

# Part 1 · 平台流程说明

本流程描述一条商单内容从数据录入到复盘验证的完整路径。

## 第 1 步 · 手动录入数据并选择平台
用户录入内容的各项数据并指定发布平台。此步为表单录入与数据库写入，由代码完成。

## 第 2 步 · 平台分流
系统按平台字段将内容归入 TikTok、RedNote 或其他平台，各平台独立持有基线。此步为按字段路由，由代码完成。

## 第 3 步 · 按类目、商品、内容组织
系统将录入的内容按类目、商品、内容三层结构归档。此步为按字段分组，由 SQL 完成。

## 第 4 步 · 下钻选择
用户从类目下钻到商品，再到具体内容。此步为前端交互与查询取数，由代码完成。

## 第 5 步 · 查看转化漏斗
系统展示该内容从曝光到下单的漏斗。展示前先由 **Skill 1** 判定数据是否可信、口径是否正确，不可信则拦下并提示。漏斗数值的计算由代码完成，数据可信度的判断由 Skill 1 完成。

## 第 6 步 · 定位薄弱环节
系统找出偏离基线最大的环节。取最大负偏差由代码完成；判断该偏离是否为上游传导所致，由 **Skill 2** 完成。

## 第 7 步 · 带置信度的相关性洞察
系统给出该环节的可能成因，区分内容侧与商业侧，并附高、中、低置信度。此步为归因判断与语言组织，由 **Skill 2** 完成。

## 第 8 步 · 获得改进方向
系统据成因生成可执行的改进建议，供用户勾选。此步为结合成因与内容形式的建议生成，由 **Skill 3** 完成。

## 第 9 步 · 产出并发布下一条内容
用户据建议制作下一条内容并发布。此步在系统外，由用户完成。

## 第 10 步 · 与前序自动对比并验证
下一条内容入档后，系统对比被标记环节的前后变化，判断改进是否见效。前后变化的计算由代码完成；改善能否归因于已采纳建议的判断，由 **Skill 3** 完成。

## Loop back · 越用越准
验证结果回写规则命中率，命中率低的规则被修正或淘汰，使后续分析更准。验证结果重新进入漏斗查看环节，形成闭环。

---

# Part 2 · Skill 规范

三个 Skill 由流程中需要判断的环节长出。每个 Skill 是一段结构化的长指令，可调用工具与外部信息，但输出维度受限，只提供分析与建议，不替用户决定。

## Skill 1 · Data Validation

落点：流程第 5 步「查看转化漏斗」之前，作为进入分析的前置门槛。

### Definition
系统检测到一条内容偏离基线后，自动将分析目标设定为查清该内容表现，并在进入漏斗分析前判定数据是否可信、是否可用。本 Skill 负责确认口径、核对数据可信度，输出可否继续分析的裁决。

### When to Use
- 新内容入档、代码完成基线与偏差计算后自动触发。
- 作为分析链第一步，任何内容进入定位归因前必须先经过。
- 仅在系统主动发现偏离时触发，用户无需提问。

### Tools / Data it calls
- 调用 SQL 查询可比样本、核对字段来源与口径。
- 读取代码预先完成的完整性、倒挂、时点、样本量校验结果。

### Framework Step
- Define Goal：系统自动设定目标为查清该内容表现，不由用户提出。
- Map Funnel：确认漏斗结构完整，各环节字段齐备。
- Measure Each Stage：核对口径是否正确、评分是否为发布时点快照、综合数据可否信任。

### Example
- 正例：确认当前 GMV 为本条商单归因值且仍在累积，因此不参与比较；仅取第二天已稳定的比率判断是否在正常区间。口径与时点正确，判为 usable。
- 反例：将商品总销量误作本条归因 GMV，或在第一天数据未稳定时即判定可用。

### Limitation
- 输出限于三种裁决 data_error、incomplete、usable，不产出任何表现好坏的结论。
- 不发明校验维度，仅在口径、快照、时点、完整性、可比性范围内判断。
- 只判断数据可否使用，是否查看由用户决定。

## Skill 2 · Locate & Attribute

落点：流程第 6 步「定位薄弱环节」与第 7 步「带置信度的相关性洞察」。

### Definition
在数据判为可用后，定位偏离最大的环节，并给出带置信度的相关性洞察。本 Skill 先确认瓶颈环节，再结合内容手法与关键字段，给出可能的成因、证据与置信度，区分内容侧与商业侧。

### When to Use
- Skill 1 输出 usable 后触发。
- 数据判为错误或不完整时不触发。
- 当成因指向受众错配时，按需触发人群分支。

### Tools / Data it calls
- 调用 SQL 读取归因所需字段与观众、买家构成。
- 调用内容理解工具，识别前三秒的内容手法，因为完播率数字本身不能说明开头为何未留住受众。
- 必要时检索同类内容的表现参考，丰富对成因的判断。

### Framework Step
- Locate Bottleneck：读取代码算出的各环偏差，确认最大负偏差环节，检查上游传导，避免将上游导致的下游弱化误判为独立问题。
- Investigate Drivers：识别前三秒手法，套用固定规则 R1 至 R7 判定成因，区分内容侧与商业侧，附证据值与置信度；下单转化正常而 ARPU 偏低时，追加人群分支评估人群与商品匹配度。

### Example
- 正例：下单率当前 8%、基线 20%，为最大负偏差，上游进店与点击均正常，故定位于下单环节。进一步读取单价与每点击 GMV，动态选取应关注的商业信号，判断成因指向商业侧还是内容侧，而非默认归因。
- 反例：上游进店率已偏低时，仍将下游下单环节作为独立问题归因，忽略传导关系。

### Limitation
- 成因限于 R1 至 R7 的固定维度，不发明规则之外的成因，例如不臆测背景音乐、算法波动等不可衡量因素。
- 只给可能相关的成因，不主张因果，措辞为可能而非一定。
- 人群分析仅限单维度，交叉人群数据不可得。
- 不替用户决定是否放弃该商品或调整策略。

## Skill 3 · Recommend & Validate

落点：流程第 8 步「获得改进方向」与第 10 步「与前序自动对比并验证」，含 loop back 反哺。

### Definition
在成因确定后生成可执行的改进方向；并在下一条内容发布后，回看前序建议的采纳与效果，将结果反哺规则。本 Skill 只提供建议供用户选择，并依用户实际采纳的部分验证效果，使规则越用越准。

### When to Use
- Skill 2 输出归因结论后触发建议部分。
- 本条内容存在前序内容时，触发验证部分。

### Tools / Data it calls
- 调用 SQL 查询前序勾选记录、被标记环节前后指标值、规则历史命中率。
- 必要时调用可视化工具呈现前后对比。
- 必要时检索改进手法参考，使建议更具体可执行。

### Framework Step
- Recommend Action：结合成因与表达形式，生成可执行行动清单，每条标注内容侧或商业侧，供用户勾选。
- Validate：读取前序勾选，比较被标记环节前后变化，仅当对应建议确被采纳时，方将改善归因于该建议，并回写命中率。

### Example
- 正例：前序内容中用户勾选了重做开头，本条前三秒完播由 58% 升至 71%、下单率由 8% 升至 11.5%，因该建议确被采纳，判定有效并回写命中率。
- 反例：见到指标改善即归功于建议，未核对是否实际采纳，污染命中率统计。

### Limitation
- 建议限于对应已识别成因的行动，不产出与成因无关的泛化建议。
- 只提供建议，是否执行由用户决定。
- 未被采纳的建议无法验证，改善归因依赖用户勾选记录。

---

# Part 3 · 落地实现规格

工程按本部分实现。Skill 只做判断，不做计算；所有数值由代码产出。

## 数据模型

### Content（主记录，一条内容一条）
必填字段（缺失即拒绝入库）：
- platform：所属平台。
- product_id：外键，指向 Product。
- published_at：发布时间。
- content_format：表达形式（unboxing / daily_share）。
- boost_status：organic / boosted。

数据字段（可选，缺失仅禁用依赖它的规则）：
- funnel：impressions、views、store_visits、clicks、orders。
- content：completion_3s、completion_5s、completion_10s、avg_watch_time、completion_rate、saves、shares、comments。
- commercial：gmv、unit_price、discount。
- audience：viewer_gender_split、buyer_gender_split。

快照字段：
- product_rating_snapshot：入库时写入的商品评分，取发布时点值，后续不更新。

元数据：
- reading_age_days：published_at 与录入时间之差。
- entry_status：complete / incomplete。

派生字段：不存储，查询时现算，包括各环转化率、ARPU、GMV per click、AOV、purchase_propensity。

### Product（一商品一条）
- product_id、name、category、current_price、current_rating、current_review_count。
- 商品信息单独存储，Content 仅挂 product_id，避免重复。

### Baseline（派生，存储，增量更新）
- 主键：creator_id + platform + boost_status。
- 每个指标存 p25、p50、p75。
- sample_size：可比样本量，决定置信度档位。
- 触发更新：Content 入库、编辑、或转为 complete 时重算并覆盖。

### Review（一次诊断一条）
- content_id、weak_stage、fired_rule_ids、confidence、recommendations、checked_steps、validation_result。

## 上游引擎（入档时，代码执行）
1. 写入 Content 表，含原始字段、标签、评分快照。
2. 筛可比集：`creator_id = ? AND platform = ? AND boost_status = ? AND published_at >= now - 6mo`。
3. 对可比集每个指标重算 p25/p50/p75，覆盖写入 Baseline。
4. 现算本条各环转化率与派生指标，减对应分位，得各环偏差。
5. 计算 sample_size 与 confidence。
6. 组装 fact_package，传入 Skill 1。

## 漏斗口径（代码按此计数）
- impression：feed 中渲染一次计一次，按 session 计，非去重人数。
- view：播放超过平台阈值计一次，仅渲染不计。ARPU 分母。
- store_visit：点击商品标签且商品页加载完成，加载失败不计。
- click：商品页内点击购买或加购且下一步渲染，同 session 重复点计一次。
- order：已提交且已支付，未支付不计。
- refund：退款窗口内退款或退货，P1，第二天读取时点不可用。

### 逐级约束（代码校验）
- store_visit ≤ impressions，click ≤ store_visits，order ≤ clicks。
- 违反即判 data_error（本条为单内容归因漏斗口径，同一批受众逐级流失）。

## 指标口径（查询时现算）
- store_visit_rate = store_visits / impressions。
- click_rate = clicks / store_visits。
- order_conversion_rate = orders / store_visits。
- arpu = gmv / views。
- gmv_per_click = gmv / clicks。
- aov = gmv / orders。
- purchase_propensity（每 segment）= buyer_share / viewer_share。

不参与比较（仅展示）：impressions、views、gmv、orders。原因：随触达与投流变化。

## 偏差判读（代码执行）
- below：低于 p25。
- within：p25 至 p75。
- above：高于 p75。

## 归因规则表（代码判触发、Skill 判归属）

| rule_id | stage | side | 触发条件 |
|---------|-------------|------------|--------------------------------------------------|
| R1 | view | content | completion_3s below |
| R2 | view | content | completion_rate below 且 completion_3s within |
| R3 | store_visit | content | store_visit_rate below 且 retention、completion within |
| R4 | click | commercial | click_rate below 且 store_visit_rate within |
| R5 | order | commercial | gmv_per_click below |
| R6 | order | content | order_conversion below 且 click_rate、gmv_per_click within |
| R7 | audience | content | arpu below 且 order_conversion within |

规则约束：
- 每 stage 最多返回两条 factor，按偏离 p25 的距离排序。
- impressions 不参与归因。
- 每条结论附 evidence value、baseline value、rule_id、confidence。

## 置信度（代码判档）
- high：sample_size ≥ 12。
- medium：sample_size 8–11。
- low：sample_size 2–7，标注为方向性。
- none：sample_size < 2，仅展示数值，不归因。
- 任一 active limitation（boost 不匹配、非标准读取时点、format 样本 < 5 且触发 format 敏感规则）封顶 medium。

## 下游引擎（代码执行）
1. 写入 Review 记录。
2. 更新规则命中率聚合。
3. 拉取诊断结果渲染 dashboard。
4. 生成并发送推送通知。
