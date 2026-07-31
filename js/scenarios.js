const SCENARIOS = {
  // Day 1 (7/29)
  1: {
    dateStr: "7/29",
    flights: {
      ci: {
        overall: "✅ 7/29 恢復營運（加開疏運）",
        list: [
          { no: "CI 194", route: "TPE → KMJ", time: "14:20", status: "7/29 恢復正常起降", statusClass: "fs-normal", ts: "7/29 最新" },
          { no: "CI 195", route: "KMJ → TPE", time: "18:40", status: "7/29 恢復正常起降", statusClass: "fs-normal", ts: "7/29 最新" },
          { no: "CI 2129", route: "FUK → TPE", time: "-", status: "7/29 疏運加班機 (A330)", statusClass: "fs-normal", ts: "7/29 最新" },
          { no: "CI 194 (7/28)", route: "TPE → KMJ", time: "-", status: "7/28 轉降福岡 (FUK)", statusClass: "fs-delayed", ts: "7/28 歷史記錄" }
        ],
        history: [
          { time: "09:30 (7/29)", content: "熊本跑道重開，CI194/CI195 恢復營運；加開 CI2129 (福岡-桃園) A330加班機協助疏運。" },
          { time: "18:10 (7/28)", content: "7/28 CI194 因熊本跑道暫停營運轉降福岡。發布8/5前免費退改政策。" }
        ]
      },
      br: {
        overall: "✅ 正常營運（無直飛熊本）",
        list: [
          { no: "BR 106", route: "TPE → FUK", time: "08:10", status: "正常營運", statusClass: "fs-normal", ts: "7/29 最新" },
          { no: "BR 105", route: "FUK → TPE", time: "12:15", status: "正常營運", statusClass: "fs-normal", ts: "7/29 最新" },
          { no: "BR 112", route: "TPE → FUK", time: "10:55", status: "正常營運", statusClass: "fs-normal", ts: "7/29 最新" },
          { no: "BR 111", route: "FUK → TPE", time: "15:20", status: "正常營運", statusClass: "fs-normal", ts: "7/29 最新" }
        ],
        history: [
          { time: "09:00 (7/29)", content: "福岡(FUK)往返班次全面正常營運；長榮無熊本直飛航線。提供8/5前免費退改手續。" }
        ]
      },
      jx: {
        overall: "✅ 7/29 恢復營運（加開疏運）",
        list: [
          { no: "JX 846", route: "TPE → KMJ", time: "07:45", status: "7/29 恢復正常起降", statusClass: "fs-normal", ts: "7/29 最新" },
          { no: "JX 847", route: "KMJ → TPE", time: "12:00", status: "7/29 恢復正常起降", statusClass: "fs-normal", ts: "7/29 最新" },
          { no: "JX 1847", route: "KMJ → TPE", time: "18:55", status: "7/29 疏運加班機 (18:55-20:20)", statusClass: "fs-normal", ts: "7/29 最新" },
          { no: "JX 316 (7/28)", route: "TXG → KMJ", time: "-", status: "7/28 轉降福岡 (FUK)", statusClass: "fs-delayed", ts: "7/28 歷史記錄" }
        ],
        history: [
          { time: "09:30 (7/29)", content: "熊本航線全線恢復正常營運；緊急加開 JX1847 (熊本18:55-台北20:20) 加班機疏運旅客。" },
          { time: "17:40 (7/28)", content: "7/28 JX316 (台中-熊本) 跑道關閉轉降福岡。公布8/5前免費退改政策。" }
        ]
      },
      it: {
        overall: "⚠ 延後補飛疏運中",
        overallClass: "status-warn",
        list: [
          { no: "IT 794", route: "TNN → KMJ", time: "-", status: "7/28延至7/29起飛", statusClass: "fs-delayed", ts: "7/29 最新" },
          { no: "IT 767", route: "KMJ → KHH", time: "-", status: "7/28延至7/29起飛", statusClass: "fs-delayed", ts: "7/29 最新" }
        ],
        history: [
          { time: "09:30 (7/29)", content: "7/28 受跑道關閉影響之 IT794 (台南-熊本) 及 IT767 (熊本-高雄) 延至 7/29 順利補飛。" },
          { time: "19:00 (7/28)", content: "熊本跑道關閉，IT794/IT767 未能按原定時間起飛，安排延後至 7/29 執飛。" }
        ]
      }
    },
    transport: {
      shinkansen_kyushu: {
        badge: "⛔ 全線停駛", badgeClass: "suspended-badge",
        row1Label: "停駛區間", row1Val: "博多 ↔ 熊本（始發起）、熊本 ↔ 鹿兒島中央（終日）", row1Class: "suspended-text",
        row2Label: "7/29 運行", row2Val: "因線路與設備點檢，全線停駛（JR九州 7/29 08:00 公告）", row2Class: "suspended-text",
        row3Label: "再開時間", row3Val: "未定（安全確認完了後お知らせ）", row3Class: "warn-text"
      },
      highway_e3: {
        title: "E3 九州自動車道（主要被災段）", desc: "<strong>益城熊本空港IC ↔ えびのIC</strong> 上下線通行止め（NEXCO西日本 7/29 01:00最新PDF公告）", badge: "封閉", badgeClass: "suspended-badge-sm", roadClass: "suspended-rd"
      },
      airport_kmj: {
        badge: "✅ 7/29 正常運航再開", badgeClass: "ok-badge-ap",
        row1: "✅ <strong>安全點檢完成，7/29 起恢復運航！</strong>",
        row2: "各航空公司班機陸續恢復起降（部分班次仍有調整，詳見各航空官網）"
      },
      rail_yufuin: { cardClass: "suspended", badge: "⛔ 終日停駛", badgeClass: "suspended-badge", row1Label: "運行狀況", row1Val: "博多 ↔ 由布院 終日停駛（久大本線巡檢中）", row1Class: "suspended-text", row2Label: "路線", row2Val: "久大本線（博多 - 由布院 - 大分）", row2Class: "warn-text", row3Label: "再開預定", row3Val: "7/30 起恢復營運", row3Class: "ok-text" },
      spots_transport: {
        spt_kumamoto: { statusTag: "⚠ 部分中斷", statusClass: "warn-text", items: ['<span class="spt-icon suspended-text">✖</span> JR熊本站發車各線全面停駛', '<span class="spt-icon warn-text">△</span> 市電：安全確認中，暫停服務', '<span class="spt-icon suspended-text">✖</span> 熊本→福岡高速巴士停駛中', '<span class="spt-icon ok-text">✓</span> 熊本機場巴士：動態調整'] },
        spt_aso: { statusTag: "⛔ 嚴重中斷", statusClass: "suspended-text", items: ['<span class="spt-icon suspended-text">✖</span> 豐肥本線（熊本↔阿蘇）全線停駛', '<span class="spt-icon suspended-text">✖</span> 九州橫斷巴士：全便運休', '<span class="spt-icon warn-text">△</span> 自駕：部分山道管制落石警報', '<span class="spt-icon suspended-text">✖</span> 黑川溫泉巴士：暫停發車'] },
        spt_takachiho: { statusTag: "⚠ 管制中", statusClass: "warn-text", items: ['<span class="spt-icon ok-text">✓</span> 高千穗鐵道：原本即未營運', '<span class="spt-icon warn-text">△</span> 高速巴士（延岡↔高千穗）：安檢確認中', '<span class="spt-icon warn-text">△</span> 划船設施：7/28-7/31 營業休止'] },
        spt_beppu: { statusTag: "✓ 相對正常", statusClass: "ok-text", items: ['<span class="spt-icon ok-text">✓</span> JR日豐本線：大分區段正常發車', '<span class="spt-icon ok-text">✓</span> 特急由布院之森：安檢完成恢復營運', '<span class="spt-icon ok-text">✓</span> 大分自動車道：正常通行', '<span class="spt-icon ok-text">✓</span> 別府地獄溫泉：正常開放'] }
      }
    }
  },

  // Day 2 (7/30)
  2: {
    dateStr: "7/30",
    flights: {
      ci: {
        overall: "✅ 7/30 全面恢復正常",
        list: [
          { no: "CI 194", route: "TPE → KMJ", time: "14:20", status: "準點起降", statusClass: "fs-normal", ts: "7/30 最新" },
          { no: "CI 195", route: "KMJ → TPE", time: "18:40", status: "準點起降", statusClass: "fs-normal", ts: "7/30 最新" },
        ],
        history: [
          { time: "08:00 (7/30)", content: "疏運任務完結，今日起所有熊本航班時刻均恢復正常表定。" },
          { time: "09:30 (7/29)", content: "熊本跑道重開，CI194/CI195 恢復營運；加開 CI2129 (福岡-桃園) A330加班機協助疏運。" }
        ]
      },
      br: {
        overall: "✅ 正常營運（無直飛熊本）",
        list: [
          { no: "BR 106", route: "TPE → FUK", time: "08:10", status: "正常營運", statusClass: "fs-normal", ts: "7/30 最新" },
          { no: "BR 105", route: "FUK → TPE", time: "12:15", status: "正常營運", statusClass: "fs-normal", ts: "7/30 最新" },
          { no: "BR 112", route: "TPE → FUK", time: "10:55", status: "正常營運", statusClass: "fs-normal", ts: "7/30 最新" },
          { no: "BR 111", route: "FUK → TPE", time: "15:20", status: "正常營運", statusClass: "fs-normal", ts: "7/30 最新" }
        ],
        history: [
          { time: "08:00 (7/30)", content: "福岡線營運皆按表操課，無受餘震影響。" }
        ]
      },
      jx: {
        overall: "✅ 7/30 全線正常營運",
        list: [
          { no: "JX 846", route: "TPE → KMJ", time: "07:45", status: "準點起降", statusClass: "fs-normal", ts: "7/30 最新" },
          { no: "JX 847", route: "KMJ → TPE", time: "12:00", status: "準點起降", statusClass: "fs-normal", ts: "7/30 最新" }
        ],
        history: [
          { time: "08:00 (7/30)", content: "熊本航班全線正常起降，無延誤。" },
          { time: "09:30 (7/29)", content: "熊本航線全線恢復正常營運；緊急加開 JX1847 加班機疏運旅客。" }
        ]
      },
      it: {
        overall: "✅ 7/30 恢復正常",
        overallClass: "status-ok",
        list: [
          { no: "IT 794", route: "TNN → KMJ", time: "預定航班", status: "正常起降", statusClass: "fs-normal", ts: "7/30 最新" },
          { no: "IT 767", route: "KMJ → KHH", time: "預定航班", status: "正常起降", statusClass: "fs-normal", ts: "7/30 最新" }
        ],
        history: [
          { time: "08:30 (7/30)", content: "所有航班積壓消化完畢，今日起恢復正常班表。" },
          { time: "09:30 (7/29)", content: "7/28 受跑道關閉影響之 IT794 及 IT767 延至 7/29 順利補飛。" }
        ]
      }
    },
    transport: {
      shinkansen_kyushu: {
        badge: "⚠️ 部分再開", badgeClass: "warning-badge",
        row1Label: "恢復區間", row1Val: "博多 ↔ 熊本（已恢復通車）", row1Class: "ok-text",
        row2Label: "停駛區間", row2Val: "熊本 ↔ 鹿兒島中央（仍有設備受損待修）", row2Class: "suspended-text",
        row3Label: "7/30 運行", row3Val: "實施降速運行，班距拉長（JR九州 7/30 06:00 公告）", row3Class: "warn-text"
      },
      highway_e3: {
        title: "E3 九州自動車道（主要被災段）", desc: "<strong>益城熊本空港IC ↔ 八代IC</strong> 仍有路面龜裂單線雙向管制，其餘解除封閉（NEXCO西日本 7/30 最新）", badge: "管制", badgeClass: "warning-badge-sm", roadClass: "warning-rd"
      },
      airport_kmj: {
        badge: "✅ 正常運航", badgeClass: "ok-badge-ap",
        row1: "✅ <strong>設施運作恢復常態</strong>",
        row2: "聯外交通巴士班次已逐漸恢復正常表定"
      },
      rail_kagoshima: { cardClass: "suspended", badge: "⚠️ 減班運行", badgeClass: "warning-badge", row1Label: "運行狀況", row1Val: "全線恢復通車，但實施減班", row1Class: "ok-text", row2Label: "減班區間", row2Val: "鳥栖 ↔ 荒尾（本数を減らして運行）", row2Class: "warn-text", row3Label: "復駛狀態", row3Val: "荒尾 ↔ 八代 已於 7/30 06:00 復駛", row3Class: "ok-text" },
      rail_hohi: { cardClass: "suspended", badge: "⛔ 部分停駛", badgeClass: "suspended-badge", row1Label: "停駛區間", row1Val: "肥後大津 ↔ 豐後竹田（持續停駛）", row1Class: "suspended-text", row2Label: "復駛區間", row2Val: "熊本 ↔ 肥後大津（已恢復）", row2Class: "ok-text", row3Label: "特急列車", row3Val: "九州橫斷特急 終日停駛", row3Class: "suspended-text" },
      rail_atrain: { cardClass: "suspended", badge: "⛔ 停駛", badgeClass: "suspended-badge", row1Label: "運行狀況", row1Val: "終日停駛（配合三角線檢修）", row1Class: "suspended-text", row2Label: "-", row2Val: "-", row3Label: "-", row3Val: "-" },
      rail_misumi: { cardClass: "suspended", badge: "⛔ 全線停駛", badgeClass: "suspended-badge", row1Label: "運行狀況", row1Val: "宇土 ↔ 三角 終日停駛（修復中）", row1Class: "suspended-text", row2Label: "影響", row2Val: "天草聯外鐵路中斷", row3Label: "替代", row3Val: "無替代運輸", row3Class: "warn-text" },
      rail_tram: { cardClass: "recovered", badge: "✅ 正常運行", badgeClass: "tram-badge", row1Label: "A系統", row1Val: "正常運行", row1Class: "ok-text", row2Label: "B系統", row2Val: "正常運行", row2Class: "ok-text", row3Label: "-", row3Val: "-" },
      rail_yufuin: { cardClass: "recovered", badge: "✅ 恢復運行", badgeClass: "ok-badge-ap", row1Label: "運行狀況", row1Val: "博多 ↔ 由布院 / 大分 按表定正常發車", row1Class: "ok-text", row2Label: "注意事項", row2Val: "久大本線安全點檢完成，指定席正常預約", row2Class: "ok-text", row3Label: "7/30 狀態", row3Val: "按表定正常發車", row3Class: "ok-text" },
      spots_transport: {
        spt_kumamoto: { statusTag: "⚠️ 陸續復駛", statusClass: "warn-text", items: ['<span class="spt-icon ok-text">✓</span> 九州新幹線：博多↔熊本 已恢復通車（降速）', '<span class="spt-icon ok-text">✓</span> 熊本市電：A/B系統全面恢復正常運行', '<span class="spt-icon ok-text">✓</span> 鹿兒島本線：荒尾↔八代 7/30 06:00 已復駛', '<span class="spt-icon warn-text">△</span> 高速巴士：ひのくに號班次恢復中'] },
        spt_aso: { statusTag: "⚠️ 部分恢復", statusClass: "warn-text", items: ['<span class="spt-icon ok-text">✓</span> 豐肥本線：熊本↔肥後大津 已恢復通車', '<span class="spt-icon suspended-text">✖</span> 豐肥本線：肥後大津↔豐後竹田 持續修復中', '<span class="spt-icon warn-text">△</span> 阿蘇觀光自駕：國道57號單向管制中', '<span class="spt-icon warn-text">△</span> 黑川溫泉：多數旅館恢復，建議出發前確認'] },
        spt_takachiho: { statusTag: "⚠️ 巡檢恢復中", statusClass: "warn-text", items: ['<span class="spt-icon warn-text">△</span> 高千穗峽划船：7/31 前持續例行安檢', '<span class="spt-icon ok-text">✓</span> 延岡↔高千穗巴士：恢復減班行駛', '<span class="spt-icon warn-text">△</span> 山區自駕：請注意夜間管制與即時路況'] },
        spt_beppu: { statusTag: "✅ 正常營運", statusClass: "ok-text", items: ['<span class="spt-icon ok-text">✓</span> JR日豐本線 / 由布院之森：按表正常發車', '<span class="spt-icon ok-text">✓</span> 別府地獄溫泉 / 金鱗湖：景點全數正常開放', '<span class="spt-icon ok-text">✓</span> 大分機場 / 聯外巴士：完全正常'] }
      }
    }
  },

  // Day 3 (7/31) and beyond
  3: {
    dateStr: "7/31+",
    flights: {
      ci: {
        overall: "✅ 正常營運",
        list: [
          { no: "CI 194", route: "TPE → KMJ", time: "14:20", status: "準點起降", statusClass: "fs-normal", ts: "正常表定" },
          { no: "CI 195", route: "KMJ → TPE", time: "18:40", status: "準點起降", statusClass: "fs-normal", ts: "正常表定" }
        ],
        history: [
          { time: "08:00 (7/30)", content: "疏運任務完結，全面恢復正常表定。" }
        ]
      },
      br: {
        overall: "✅ 正常營運",
        list: [
          { no: "BR 106", route: "TPE → FUK", time: "08:10", status: "正常營運", statusClass: "fs-normal", ts: "正常表定" },
          { no: "BR 105", route: "FUK → TPE", time: "12:15", status: "正常營運", statusClass: "fs-normal", ts: "正常表定" },
          { no: "BR 112", route: "TPE → FUK", time: "10:55", status: "正常營運", statusClass: "fs-normal", ts: "正常表定" },
          { no: "BR 111", route: "FUK → TPE", time: "15:20", status: "正常營運", statusClass: "fs-normal", ts: "正常表定" }
        ],
        history: [
          { time: "08:00 (7/30)", content: "福岡線營運皆按表操課，無受餘震影響。" }
        ]
      },
      jx: {
        overall: "✅ 正常營運",
        list: [
          { no: "JX 846", route: "TPE → KMJ", time: "07:45", status: "準點起降", statusClass: "fs-normal", ts: "正常表定" },
          { no: "JX 847", route: "KMJ → TPE", time: "12:00", status: "準點起降", statusClass: "fs-normal", ts: "正常表定" }
        ],
        history: [
          { time: "08:00 (7/30)", content: "熊本航班全線正常起降，無延誤。" }
        ]
      },
      it: {
        overall: "✅ 正常營運",
        overallClass: "status-ok",
        list: [
          { no: "IT 794", route: "TNN → KMJ", time: "預定航班", status: "正常起降", statusClass: "fs-normal", ts: "正常表定" },
          { no: "IT 767", route: "KMJ → KHH", time: "預定航班", status: "正常起降", statusClass: "fs-normal", ts: "正常表定" }
        ],
        history: [
          { time: "08:30 (7/30)", content: "所有航班積壓消化完畢，今日起恢復正常班表。" }
        ]
      }
    },
    transport: {
      shinkansen_kyushu: {
        badge: "✅ 全線再開", badgeClass: "recovered-badge",
        row1Label: "恢復區間", row1Val: "全線恢復通車", row1Class: "ok-text",
        row2Label: "注意事項", row2Val: "部分路段實施減速，請預留充裕轉乘時間", row2Class: "warn-text",
        row3Label: "更新時間", row3Val: "JR九州最新公告", row3Class: "ok-text"
      },
      highway_e3: {
        title: "E3 九州自動車道", desc: "全線解除封閉，恢復正常速限通行。", badge: "解除", badgeClass: "ok-badge-sm", roadClass: "ok-rd"
      },
      airport_kmj: {
        badge: "✅ 正常運航", badgeClass: "ok-badge-ap",
        row1: "✅ <strong>機場全館復原完畢</strong>",
        row2: "免稅店與餐飲已 100% 恢復營業"
      },
      rail_kagoshima: { cardClass: "recovered", badge: "✅ 全線正常", badgeClass: "recovered-badge", row1Label: "運行狀況", row1Val: "全線恢復正常排班", row1Class: "ok-text", row2Label: "-", row2Val: "-", row3Label: "-", row3Val: "-" },
      rail_hohi: { cardClass: "recovered", badge: "✅ 全線正常", badgeClass: "recovered-badge", row1Label: "運行狀況", row1Val: "全線恢復通車", row1Class: "ok-text", row2Label: "特急列車", row2Val: "正常運行", row2Class: "ok-text", row3Label: "-", row3Val: "-" },
      rail_atrain: { cardClass: "recovered", badge: "✅ 正常運行", badgeClass: "recovered-badge", row1Label: "運行狀況", row1Val: "恢復正常排班", row1Class: "ok-text", row2Label: "-", row2Val: "-", row3Label: "-", row3Val: "-" },
      rail_misumi: { cardClass: "recovered", badge: "✅ 全線正常", badgeClass: "recovered-badge", row1Label: "運行狀況", row1Val: "全線修復完畢，恢復通車", row1Class: "ok-text", row2Label: "-", row2Val: "-", row3Label: "-", row3Val: "-" },
      rail_tram: { cardClass: "recovered", badge: "✅ 正常運行", badgeClass: "tram-badge", row1Label: "A/B系統", row1Val: "正常運行", row1Class: "ok-text", row2Label: "-", row2Val: "-", row3Label: "-", row3Val: "-" },
      rail_yufuin: { cardClass: "recovered", badge: "✅ 全線正常", badgeClass: "recovered-badge", row1Label: "運行狀況", row1Val: "按表定正常營運", row1Class: "ok-text", row2Label: "備註", row2Val: "觀光特急列車指定席正常開放", row2Class: "ok-text", row3Label: "-", row3Val: "-" },
      spots_transport: {
        spt_kumamoto: { statusTag: "✅ 恢復正常", statusClass: "ok-text", items: ['<span class="spt-icon ok-text">✓</span> 九州新幹線 / 市電：全線恢復正常排班', '<span class="spt-icon ok-text">✓</span> 鹿兒島本線 / 機場巴士：全線正常', '<span class="spt-icon ok-text">✓</span> 高速巴士：全面恢復表定營運'] },
        spt_aso: { statusTag: "✅ 全線通車", statusClass: "ok-text", items: ['<span class="spt-icon ok-text">✓</span> 豐肥本線：全線通車復駛', '<span class="spt-icon ok-text">✓</span> 阿蘇觀光景點 / 黑川溫泉：全面恢復營業', '<span class="spt-icon ok-text">✓</span> 九州橫斷巴士：恢復表定發車'] },
        spt_takachiho: { statusTag: "✅ 正常開放", statusClass: "ok-text", items: ['<span class="spt-icon ok-text">✓</span> 高千穗峽划船 / 神社：全數開放營業', '<span class="spt-icon ok-text">✓</span> 聯外公路與公車：恢復正常'] },
        spt_beppu: { statusTag: "✅ 正常營運", statusClass: "ok-text", items: ['<span class="spt-icon ok-text">✓</span> 全區景點 / 交通 / 溫泉設施：完全正常'] }
      }
    }
  }
};
