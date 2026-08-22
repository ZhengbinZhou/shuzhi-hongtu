(function () {
  var activeHistoryPayload = null;
  var spotLinks = {
    A01: "安源路矿工人运动纪念馆",
    A02: "安源路矿工人俱乐部旧址",
    A03: "秋收起义广场",
    N01: "南昌八一起义纪念馆",
    N02: "八一南昌起义纪念塔",
    N04: "贺龙指挥部旧址",
    J03: "茨坪革命旧址群",
    J05: "茅坪八角楼",
    J07: "大井毛泽东同志旧居",
    J08: "井冈山会师纪念馆",
    J01: "井冈山革命博物馆",
    J02: "井冈山革命烈士陵园",
    J04: "黄洋界哨口",
    J06: "小井红军医院旧址",
    J09: "挑粮小道",
    J10: "柏露红色教育区",
    Y05: "红四军军部旧址（葛氏宗祠）",
    XW1: "寻乌调查纪念馆",
    XW2: "毛泽东寻乌调查旧址",
    ND1: "宁都起义纪念馆",
    ND2: "小布红色旧址群",
    R01: "叶坪革命旧址群",
    R02: "沙洲坝红井革命旧址群",
    R03: "中央革命根据地历史博物馆",
    R04: "“二苏大”革命旧址群",
    R05: "中央革命军事委员会旧址",
    R06: "中华苏维埃纪念园",
    XG1: "兴国将军园",
    XG2: "长冈乡调查纪念馆",
    XG3: "潋江书院毛泽东旧居",
    Y01: "中央红军长征集结出发地纪念园",
    Y02: "中央红军长征出发纪念馆",
    Y03: "东门渡口",
    Y04: "中央红军长征出发纪念碑",
    Y06: "中共赣南省委旧址",
    Y07: "赣南省苏维埃政府旧址",
    Y08: "祁禄山红军小道",
    Y09: "长征历史步道",
    S03: "方志敏纪念馆",
    N03: "南昌新四军军部旧址陈列馆",
    S01: "上饶集中营革命烈士纪念馆",
    S02: "茅家岭监狱旧址"
  };

  function openRequestedSpot() {
    var spotId = new URLSearchParams(window.location.search).get("spot");
    var spotName = spotLinks[spotId];
    if (!spotName) return true;
    var button = Array.prototype.find.call(document.querySelectorAll(".spot-grid button"), function (candidate) {
      return candidate.textContent.indexOf(spotName) !== -1;
    });
    if (!button) return false;
    if (document.documentElement.dataset.historySpotOpened !== spotId) {
      document.documentElement.dataset.historySpotOpened = spotId;
      window.setTimeout(function () { button.click(); }, 180);
    }
    return true;
  }

  function readHistoryTransfer() {
    var stageId = new URLSearchParams(window.location.search).get("historyStage");
    if (!stageId) return null;
    try {
      var payload = JSON.parse(window.localStorage.getItem("shujing-history-transfer") || "null");
      return payload && payload.stageId === stageId ? payload : null;
    } catch (error) { return null; }
  }

  function setPlannerSelect(optionText) {
    var select = Array.prototype.find.call(document.querySelectorAll("#planner select"), function (candidate) {
      return Array.prototype.some.call(candidate.options, function (option) { return option.textContent.trim() === optionText; });
    });
    if (!select) return false;
    var option = Array.prototype.find.call(select.options, function (candidate) { return candidate.textContent.trim() === optionText; });
    var setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
    setter.call(select, option.value);
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function clickPlannerChoice(label) {
    var button = Array.prototype.find.call(document.querySelectorAll("#planner button"), function (candidate) {
      return candidate.textContent.trim() === label;
    });
    if (!button) return false;
    button.click();
    return true;
  }

  function plannerFieldValue(labelText) {
    var label = Array.prototype.find.call(document.querySelectorAll("#planner label"), function (candidate) {
      var title = candidate.querySelector("span");
      return title && title.textContent.trim() === labelText;
    });
    var field = label && label.querySelector("select,input");
    return field ? field.value : "";
  }

  function routeDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function nearestNeighborRoute(spots, startCounty) {
    var remaining = spots.slice();
    var countyKey = String(startCounty || "").replace(/[市县区]$/g, "");
    var startIndex = remaining.findIndex(function (spot) { return String(spot.note || "").indexOf(countyKey) !== -1; });
    var route = [remaining.splice(startIndex < 0 ? 0 : startIndex, 1)[0]];
    while (remaining.length) {
      var current = route[route.length - 1];
      remaining.sort(function (a, b) { return routeDistance(current, a) - routeDistance(current, b); });
      route.push(remaining.shift());
    }
    return route;
  }

  function splitIntoDays(spots, requestedDays) {
    var dayCount = Math.max(1, Math.min(requestedDays, spots.length));
    var days = [];
    var base = Math.floor(spots.length / dayCount);
    var extra = spots.length % dayCount;
    var cursor = 0;
    for (var dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
      var size = base + (dayIndex < extra ? 1 : 0);
      days.push(spots.slice(cursor, cursor + size));
      cursor += size;
    }
    return days;
  }

  function routeSignature(route) {
    return route.map(function (spot) { return spot.id; }).join("|");
  }

  function buildHistoryPlans(payload) {
    var stage = window.HISTORY_STAGES && window.HISTORY_STAGES.find(function (candidate) { return candidate.id === payload.stageId; });
    var storedPositions = payload.spotPositions || (stage && stage.mapNodes.filter(function (spot) { return payload.spotIds.indexOf(spot.id) !== -1; }));
    if (!payload.mapStyle && stage) payload.mapStyle = stage.mapStyle;
    var positions = (storedPositions || payload.spotIds.map(function (id, index) {
      return { id: id, name: payload.spotNames[index], note: "本章点位", x: 12 + index * 6, y: 48 };
    })).slice();
    var days = Number(plannerFieldValue("游览天数")) || (payload.days === "1" ? 1 : 3);
    var startCounty = plannerFieldValue("起始县区") || payload.startCounty;

    function makePlan(order, variant) {
      var dayGroups = splitIntoDays(order, days);
      var tightDays = dayGroups.filter(function (day) { return day.length > 4; }).length;
      return {
        name: variant ? "按区域串联游览" : "按历史进程游览",
        angle: variant ? "区域衔接" : "历史进程",
        order: order,
        days: dayGroups,
        tightDays: tightDays,
        reason: "已完整纳入本次选择的" + order.length + "处景点。" + (variant ? "在点位不删减的前提下，依据本章相对地理位置减少折返。" : "以章节既定历史进程为主线，并在相邻历史节点之间保持地理衔接。")
      };
    }

    var plans = [makePlan(positions, false)];
    if (payload.depth === "deep" && positions.length > 4) {
      var optimized = nearestNeighborRoute(positions, startCounty);
      if (routeSignature(optimized) !== routeSignature(positions)) plans.push(makePlan(optimized, true));
    }
    return plans.slice(0, 2);
  }

  function dateForDay(dateText, offset) {
    var date = dateText ? new Date(dateText + "T12:00:00") : new Date();
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
  }

  function historyMapHtml(plan, payload) {
    var points = plan.order.map(function (spot) { return spot.x + "," + spot.y; }).join(" ");
    var markers = plan.order.map(function (spot, index) {
      return '<g class="map-marker"><circle cx="' + spot.x + '" cy="' + spot.y + '" r="2.4"></circle><text x="' + spot.x + '" y="' + (spot.y + 1.25) + '">' + (index + 1) + '</text></g>';
    }).join("");
    var legend = plan.order.map(function (spot, index) {
      return '<li><i>' + (index + 1) + '</i><span><b>' + spot.name + '</b><small>' + spot.note + '</small></span></li>';
    }).join("");
    return '<div class="route-map history-custom-map" aria-label="' + payload.shortTitle + '全部点位路线地图"><svg viewBox="0 0 100 100" role="img"><defs><pattern id="history-grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M8 0H0V8" fill="none" stroke="#a5947c" stroke-width=".18" opacity=".28"></path></pattern></defs><rect width="100" height="100" fill="#efe5d5"></rect><rect width="100" height="100" fill="url(#history-grid)"></rect><polyline class="route-line" points="' + points + '"></polyline>' + markers + '<g class="north-arrow" transform="translate(89 12)"><path d="M0 7L3 -4L6 7L3 5Z"></path><text x="3" y="-6">N</text></g></svg><div class="map-caption"><span>' + payload.mapStyle + '点位相对位置 · 编号与游览顺序一致</span><span>非真实比例尺，不代替实际导航</span></div><ol class="history-route-legend">' + legend + '</ol></div>';
  }

  function historyDaysHtml(plan, departureDate) {
    return '<div class="days">' + plan.days.map(function (day, dayIndex) {
      var stops = day.map(function (spot, spotIndex) {
        var routeNumber = plan.order.findIndex(function (candidate) { return candidate.id === spot.id; }) + 1;
        return '<div class="stop history-stop"><i>' + routeNumber + '</i><span><small>' + spot.note + '</small><b>' + spot.name + '</b></span><a href="数智-红途-离线完整版.html?spot=' + spot.id + '">查看介绍</a></div>';
      }).join("");
      return '<section><header><b>DAY ' + (dayIndex + 1) + '</b><span>' + dateForDay(departureDate, dayIndex) + ' · ' + day.length + '处</span></header>' + stops + '</section>';
    }).join("") + '</div>';
  }

  function renderHistoryPlans(payload) {
    var plans = buildHistoryPlans(payload);
    var old = document.getElementById("history-results");
    if (old) old.remove();
    var originalResults = document.getElementById("results");
    var section = document.createElement("section");
    section.id = "history-results";
    section.className = "results show desktop-only history-results";
    section.innerHTML = '<div class="section results-inner"><div class="section-head light"><div><small>02 / HISTORY ROUTES</small><h2>本章研学路线</h2></div><p>本章所选景点全部进入行程；调整天数只改变每日安排。</p></div><div class="result-layout"><div class="plan-tabs">' + plans.map(function (plan, index) { return '<button type="button" data-history-plan="' + index + '" class="' + (index ? '' : 'active') + '"><span>0' + (index + 1) + '</span><div><small>' + plan.angle + '</small><b>' + plan.name + '</b></div><strong>' + plan.order.length + '<em>处</em></strong></button>'; }).join("") + '</div><article class="plan-detail" data-history-plan-detail></article></div></div>';
    originalResults.insertAdjacentElement("afterend", section);

    function showPlan(index) {
      var plan = plans[index];
      section.querySelectorAll("[data-history-plan]").forEach(function (button, buttonIndex) { button.classList.toggle("active", buttonIndex === index); });
      var warning = plan.tightDays ? '<p class="history-route-warning">当前有' + plan.tightDays + '天安排超过4处景点，团队可增加天数或压缩单点活动内容。</p>' : '';
      section.querySelector("[data-history-plan-detail]").innerHTML = '<div class="plan-title"><div><small>循着历史的足迹</small><h3>' + plan.name + '</h3><p>' + plan.reason + '</p></div></div><div class="history-plan-facts"><span>本章点位 <b>' + plan.order.length + '处</b></span><span>行程天数 <b>' + plan.days.length + '天</b></span><span>游览方式 <b>' + plan.angle + '</b></span></div>' + warning + historyMapHtml(plan, payload) + historyDaysHtml(plan, plannerFieldValue("出发日期")) + '<div class="plan-actions"><span>如需增减景点，请返回历史章节重新选择。</span></div>';
    }

    section.querySelectorAll("[data-history-plan]").forEach(function (button) {
      button.addEventListener("click", function () { showPlan(Number(button.dataset.historyPlan)); });
    });
    showPlan(0);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function installHistoryPlanner(payload) {
    var generate = document.querySelector("#planner .generate");
    if (!generate || generate.dataset.historyPlannerBound) return Boolean(generate);
    generate.dataset.historyPlannerBound = "true";
    generate.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      renderHistoryPlans(payload);
    }, true);
    return true;
  }

  function mountTransferBanner(payload) {
    var planner = document.getElementById("planner");
    if (!planner) return false;
    var oldBanner = document.querySelector(".history-transfer");
    if (oldBanner) oldBanner.remove();
    var banner = document.createElement("aside");
    banner.className = "history-transfer";
    var visibleNames = payload.spotNames.slice(0, 5).join("、");
    var more = payload.spotNames.length > 5 ? "等" + payload.spotNames.length + "处" : "";
    banner.innerHTML = '<div><small>循着历史的足迹 · 第' + payload.stageNumber + '章</small><strong>' + payload.shortTitle + '</strong><p>' + payload.daysLabel + ' · ' + payload.depthLabel + ' · ' + visibleNames + more + '</p></div><div class="history-transfer__actions"><span>调整日期与天数后，可查看1—2种完整游览次序</span><a href="history.html#' + payload.stageId + '">返回本章</a></div>';
    planner.insertAdjacentElement("beforebegin", banner);
    return true;
  }

  function constrainHistoryDays(payload) {
    if (!payload) return false;
    var daySelect = Array.prototype.find.call(document.querySelectorAll("#planner select"), function (candidate) {
      var dayOptions = Array.prototype.filter.call(candidate.options, function (option) {
        return /^[1-5]天$/.test(option.textContent.trim());
      });
      return dayOptions.length >= 3;
    });
    if (!daySelect) return false;
    var allowedDays = payload.days === "1" ? ["1天"] : ["2天", "3天"];
    Array.prototype.forEach.call(daySelect.options, function (option) {
      if (!/^[1-5]天$/.test(option.textContent.trim())) return;
      var isAllowed = allowedDays.indexOf(option.textContent.trim()) !== -1;
      option.disabled = !isAllowed;
      option.hidden = !isAllowed;
    });
    var selectedDay = daySelect.selectedIndex >= 0 ? daySelect.options[daySelect.selectedIndex].textContent.trim() : "";
    if (allowedDays.indexOf(selectedDay) === -1) {
      setPlannerSelect(payload.days === "1" ? "1天" : "3天");
    }
    daySelect.setAttribute("aria-label", payload.days === "1" ? "本章路线天数，固定为1天" : "本章路线天数，可选2天或3天");
    var dayHint = daySelect.parentElement && daySelect.parentElement.querySelector("small");
    var finalHint = payload.days === "1" ? "本章路线固定为1天" : "本章路线仅可选择2天或3天";
    if (dayHint && dayHint.textContent !== finalHint) dayHint.textContent = finalHint;
    return true;
  }

  function applyHistoryTransfer() {
    var payload = readHistoryTransfer();
    if (!payload || !document.getElementById("planner")) return !payload;
    activeHistoryPayload = payload;
    setPlannerSelect(payload.startCounty);
    setPlannerSelect(payload.days === "1" ? "1天" : "3天");
    setPlannerSelect(payload.purpose);
    window.setTimeout(function () {
      mountTransferBanner(payload);
      installHistoryPlanner(payload);
      document.body.classList.add("history-planning-mode");
      constrainHistoryDays(payload);
      var generate = document.querySelector("#planner .generate");
      if (generate) {
        var title = generate.querySelector("span");
        var note = generate.querySelector("small");
        if (title) title.textContent = "生成历史足迹路线";
        if (note) note.textContent = "本章全部点位 · 历史进程与区域衔接 · 最多2种次序";
      }
      document.getElementById("planner").scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    document.documentElement.dataset.historyTransferApplied = payload.stageId;
    return true;
  }

  function mountHistoryEntry() {
    var nav = document.querySelector(".topbar nav");
    if (nav && !nav.querySelector(".history-nav-link")) {
      var navLink = document.createElement("a");
      navLink.className = "history-nav-link";
      navLink.href = "history.html";
      navLink.textContent = "历史足迹";
      nav.appendChild(navLink);
    }

    var hero = document.querySelector(".hero");
    if (!hero) return false;
    if (document.querySelector(".history-entry")) return true;
    var section = document.createElement("section");
    section.className = "history-entry";
    section.innerHTML = '<div class="history-entry__head"><div><small class="history-entry__eyebrow">HISTORY TRAIL · 章节预览</small><h2>循着历史的足迹</h2></div><a class="history-entry__link" href="history.html">进入历史足迹 →</a></div><div class="history-entry__chapters"><span><b>01</b><small>工运与起义</small></span><span><b>02</b><small>井冈山道路</small></span><span><b>03</b><small>中央苏区</small></span><span><b>04</b><small>长征出发</small></span></div>';
    hero.insertAdjacentElement("afterend", section);
    return true;
  }

  function polishPublicationCopy() {
    var methodNotice = document.querySelector(".method>div>p");
    var finalMethodNotice = "开放时间与通行时间采用静态参考资料；临时闭馆、节假日调整及实时路况请在出行前以官方通知为准。";
    if (methodNotice && methodNotice.textContent !== finalMethodNotice) methodNotice.textContent = finalMethodNotice;
    document.querySelectorAll(".drawer .notice").forEach(function (notice) {
      var finalDrawerNotice = "开放信息为静态参考资料，出行前请核验场馆官方通知。";
      if (notice.textContent !== finalDrawerNotice) notice.textContent = finalDrawerNotice;
    });
    constrainHistoryDays(activeHistoryPayload);
  }

  function mountWhenReady() {
    polishPublicationCopy();
    var entryReady = mountHistoryEntry();
    var spotReady = openRequestedSpot();
    var transferReady = applyHistoryTransfer();
    if (entryReady && spotReady && transferReady) return;
    var root = document.getElementById("root");
    if (!root) return;
    var publicationObserver = new MutationObserver(polishPublicationCopy);
    publicationObserver.observe(root, { childList: true, subtree: true });
    var observer = new MutationObserver(function () {
      entryReady = mountHistoryEntry();
      spotReady = openRequestedSpot();
      transferReady = document.documentElement.dataset.historyTransferApplied ? true : applyHistoryTransfer();
      if (entryReady && spotReady && transferReady) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", mountWhenReady);
  } else {
    mountWhenReady();
  }
})();
