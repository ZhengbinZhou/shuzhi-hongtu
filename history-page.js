(function () {
  var host = document.getElementById("history-chapters");
  var current = document.getElementById("history-current");
  var detailHost = document.getElementById("history-stage-content");
  if (!host || !current || !detailHost || !window.HISTORY_STAGES) return;

  var planDialog = document.createElement("dialog");
  planDialog.className = "history-route-dialog";
  planDialog.setAttribute("aria-label", "规划本章路线");
  document.body.appendChild(planDialog);

  planDialog.addEventListener("click", function (event) {
    if (event.target === planDialog || event.target.closest("[data-plan-close]")) planDialog.close();
  });

  var routePreferences = {};

  var plannerPresets = {
    "stage-01": { startCounty: "安源区", priority: "重大事件", supplement: "群众支前" },
    "stage-02": { startCounty: "井冈山市", priority: "军事斗争", supplement: "革命精神" },
    "stage-03": { startCounty: "瑞金市", priority: "政权建设", supplement: "群众支前" },
    "stage-04": { startCounty: "于都县", priority: "长征文化", supplement: "革命精神" }
  };

  function selectedRouteSpots(stage, depth) {
    if (depth === "must") {
      var featuredIds = stage.featuredSpots.map(function (spot) { return spot.id; });
      return stage.mapNodes.filter(function (spot) { return featuredIds.indexOf(spot.id) !== -1; });
    }
    return stage.mapNodes.slice();
  }

  function transferToPlanner(stage, preference) {
    var preset = plannerPresets[stage.id];
    var selectedSpots = selectedRouteSpots(stage, preference.depth);
    var payload = {
      stageId: stage.id,
      stageNumber: stage.number,
      stageTitle: stage.title,
      shortTitle: stage.shortTitle,
      period: stage.period,
      days: preference.days,
      daysLabel: preference.days === "1" ? "1日" : "2—3日",
      depth: preference.depth,
      depthLabel: preference.depth === "must" ? "必到点" : "深度研学",
      spotIds: selectedSpots.map(function (spot) { return spot.id; }),
      spotNames: selectedSpots.map(function (spot) { return spot.name; }),
      spotPositions: selectedSpots.map(function (spot) { return { id: spot.id, name: spot.name, note: spot.note, x: spot.x, y: spot.y }; }),
      mapStyle: stage.mapStyle,
      startCounty: preset.startCounty,
      priority: preset.priority,
      supplement: preset.supplement,
      experience: preference.depth === "must" ? "现场观察" : "深度讲解",
      purpose: preference.depth === "must" ? "思政学习" : "社会实践"
    };
    try { window.localStorage.setItem("shujing-history-transfer", JSON.stringify(payload)); } catch (error) {}
    var params = new URLSearchParams();
    params.set("historyStage", payload.stageId);
    params.set("historyDays", payload.days);
    params.set("historyDepth", payload.depth);
    params.set("historySpots", payload.spotIds.join(","));
    window.location.href = "数智-红途-离线完整版.html?" + params.toString() + "#planner";
  }

  function openPlanDialog(stage) {
    var preference = routePreferences[stage.id] || { days: "1", depth: "must" };
    routePreferences[stage.id] = preference;
    var spotChips = stage.mapNodes.map(function (spot, spotIndex) {
      return '<a data-route-spot="' + spot.id + '" href="数智-红途-离线完整版.html?spot=' + spot.id + '"><i>' + (spotIndex + 1) + '</i>' + spot.name + '</a>';
    }).join("");
    planDialog.innerHTML = '<div class="route-prep"><header><div><small>ROUTE WORKSPACE · ' + stage.number + '</small><h2>规划“' + stage.shortTitle + '”路线</h2><p>' + stage.period + ' · ' + stage.mapNodes.length + '个本章点位</p></div><button type="button" data-plan-close aria-label="关闭规划窗口">×</button></header><section><small>本章点位</small><div class="route-prep__spots">' + spotChips + '</div></section><section class="route-prep__settings" aria-label="路线偏好"><div class="route-prep__choice"><span>行程时长</span><div class="route-prep__options"><button type="button" data-route-days="1">1日</button><button type="button" data-route-days="3">2—3日</button></div></div><div class="route-prep__choice"><span>研学深度</span><div class="route-prep__options"><button type="button" data-route-depth="must">必到点</button><button type="button" data-route-depth="deep">深度研学</button></div></div></section><div class="route-prep__selection" aria-live="polite"><b data-route-count></b><span data-route-summary></span></div><footer><p>选择将随章节点位一起带入现有智能规划；主页继续完成时间可行性、内容匹配与历史顺序校验。</p><button type="button" data-plan-close>返回本章</button><button type="button" data-route-submit>带入智能规划</button></footer></div>';

    planDialog.querySelector("header small").textContent = "循着历史的足迹 · 第" + stage.number + "章";
    planDialog.querySelector("footer p").textContent = "所选点位将带入路线安排；日期与天数用于确定每日游览次序。";

    function syncRoutePreference() {
      var selected = selectedRouteSpots(stage, preference.depth);
      planDialog.querySelectorAll("[data-route-days]").forEach(function (button) {
        var active = button.dataset.routeDays === preference.days;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      planDialog.querySelectorAll("[data-route-depth]").forEach(function (button) {
        var active = button.dataset.routeDepth === preference.depth;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      planDialog.querySelectorAll("[data-route-spot]").forEach(function (link) {
        link.classList.toggle("is-route-selected", selected.some(function (spot) { return spot.id === link.dataset.routeSpot; }));
      });
      planDialog.querySelector("[data-route-count]").textContent = selected.length + "个点位";
      planDialog.querySelector("[data-route-summary]").textContent = preference.depth === "must" ? "已选本章代表性必到点，适合紧凑行程。" : "已选本章全部点位，生成路线时将全部纳入。";
    }

    planDialog.querySelectorAll("[data-route-days]").forEach(function (button) {
      button.addEventListener("click", function () { preference.days = button.dataset.routeDays; syncRoutePreference(); });
    });
    planDialog.querySelectorAll("[data-route-depth]").forEach(function (button) {
      button.addEventListener("click", function () { preference.depth = button.dataset.routeDepth; syncRoutePreference(); });
    });
    planDialog.querySelector("[data-route-submit]").addEventListener("click", function () { transferToPlanner(stage, preference); });
    syncRoutePreference();
    planDialog.showModal();
  }

  host.innerHTML = window.HISTORY_STAGES.map(function (stage, index) {
    var quoteText = stage.quote.join("");
    return '<button class="timeline-stage' + (index === 0 ? ' is-active' : '') + '" type="button" data-index="' + index + '" aria-pressed="' + (index === 0 ? 'true' : 'false') + '"><span class="timeline-stage__head"><b>' + stage.number + '</b><span><strong>' + stage.shortTitle + '</strong><small>' + stage.period + '</small></span></span><span class="timeline-stage__body"><figure><img src="' + stage.artwork + '" alt="' + (stage.artworkCaption || stage.representative) + '"><figcaption>' + (stage.artworkCaption || stage.representative) + '</figcaption></figure><span class="timeline-stage__verse"><img class="timeline-stage__calligraphy" src="' + stage.calligraphy + '" alt="' + quoteText + '"><small>' + stage.quoteSource + '</small><i aria-hidden="true">' + stage.seal + '</i></span></span></button>';
  }).join("");

  function renderStageDetail(stage, index) {
    if (!stage.events || !stage.qa) {
      detailHost.innerHTML = "";
      return;
    }

    var events = stage.events.map(function (event) {
      return '<li><time>' + event.year + '</time><div><h4>' + event.title + '</h4><p>' + event.text + '</p></div></li>';
    }).join("");
    var nodes = stage.mapNodes.map(function (node, nodeIndex) {
      return '<a class="map-pin" href="数智-红途-离线完整版.html?spot=' + node.id + '" style="--x:' + node.x + '%;--y:' + node.y + '%" title="查看' + node.name + '介绍" aria-label="查看' + node.name + '介绍"><i>' + (nodeIndex + 1) + '</i></a>';
    }).join("");
    var legend = stage.mapNodes.map(function (node, nodeIndex) {
      return '<li><a href="数智-红途-离线完整版.html?spot=' + node.id + '" aria-label="查看' + node.name + '介绍"><i>' + (nodeIndex + 1) + '</i><span><b>' + node.name + '</b><small>' + node.note + '</small></span></a></li>';
    }).join("");
    var spots = stage.featuredSpots.map(function (spot) {
      return '<a class="history-spot-card" href="数智-红途-离线完整版.html?spot=' + spot.id + '" aria-label="查看' + spot.name + '介绍"><img src="' + spot.image + '" alt="' + spot.name + '"><span><small>' + spot.region + '</small><strong>' + spot.name + '</strong><em>查看景点介绍</em></span></a>';
    }).join("");

    detailHost.innerHTML = '<article class="chapter-detail"><header class="chapter-masthead"><span>' + stage.number + '</span><div><small>' + stage.period + '</small><h2>' + stage.title + '</h2><p>' + stage.intro + '</p></div></header><div class="chapter-core"><section class="route-map route-map--' + stage.mapTheme + '" aria-label="' + stage.shortTitle + '景点相对地理位置地图"><div class="route-map__label"><small>' + stage.mapStyle + '</small><strong>' + stage.shortTitle + '·景点相对位置</strong></div><div class="route-map__canvas"><img class="route-map__image" src="' + stage.mapImage + '" alt="' + stage.shortTitle + '景点相对地理位置地图">' + nodes + '<span class="route-map__north">N</span></div><ol class="route-map__legend">' + legend + '</ol><p>地图不采用真实比例尺，仅保留全部点位之间的大致方位关系，不代替实际导航。</p></section><section class="event-ledger"><div class="section-title"><small>HISTORICAL EVENTS</small><h3>阶段事件</h3></div><ol>' + events + '</ol></section></div><section class="chapter-spots"><div class="section-title"><small>REPRESENTATIVE SITES</small><h3>代表景点</h3></div><div class="history-spot-grid">' + spots + '</div></section><section class="history-quiz"><div class="history-quiz__copy"><small>研学问答</small><h3 id="quiz-question"></h3><p id="quiz-answer" hidden></p></div><div class="history-quiz__actions"><button id="quiz-refresh" type="button">换一题</button><button id="quiz-toggle" type="button">查看答案</button></div></section></article>';
    var mapSection = detailHost.querySelector(".route-map");
    var mapNote = mapSection && mapSection.querySelector(":scope > p");
    if (mapSection) mapSection.setAttribute("aria-description", "点位为相对位置示意，不采用真实比例尺，不代替实际导航。");
    if (mapNote) {
      mapNote.className = "route-map__quote";
      mapNote.innerHTML = "“" + stage.mapQuote + "”<cite>——" + stage.mapQuoteSource + "</cite>";
    }

    var chapterTitle = detailHost.querySelector(".chapter-masthead h2");
    if (chapterTitle && stage.titleSource) {
      var titleSource = document.createElement("p");
      titleSource.className = "chapter-title-source";
      titleSource.textContent = stage.titleSource;
      chapterTitle.insertAdjacentElement("afterend", titleSource);
    }
    if (stage.sources && stage.sources.length) {
      var sourceSection = document.createElement("section");
      sourceSection.className = "chapter-sources";
      sourceSection.innerHTML = '<small>RELATED READING</small><h3>相关文章与资料</h3><ul>' + stage.sources.map(function (source) {
        return '<li><a href="' + source.url + '" target="_blank" rel="noopener noreferrer">' + source.label + '</a></li>';
      }).join("") + '</ul>';
      detailHost.querySelector(".chapter-detail").appendChild(sourceSection);
    }

    var questionNode = document.getElementById("quiz-question");
    var answerNode = document.getElementById("quiz-answer");
    var refreshButton = document.getElementById("quiz-refresh");
    var toggleButton = document.getElementById("quiz-toggle");
    var questionIndex = -1;

    function nextQuestion() {
      var next = questionIndex;
      while (stage.qa.length > 1 && next === questionIndex) next = Math.floor(Math.random() * stage.qa.length);
      questionIndex = next < 0 ? 0 : next;
      questionNode.textContent = stage.qa[questionIndex].question;
      answerNode.textContent = stage.qa[questionIndex].answer;
      answerNode.hidden = true;
      toggleButton.textContent = "查看答案";
    }

    refreshButton.addEventListener("click", nextQuestion);
    toggleButton.addEventListener("click", function () {
      answerNode.hidden = !answerNode.hidden;
      toggleButton.textContent = answerNode.hidden ? "查看答案" : "收起答案";
    });
    nextQuestion();
  }

  function showStage(index) {
    var stage = window.HISTORY_STAGES[index];
    host.querySelectorAll(".timeline-stage").forEach(function (button, buttonIndex) {
      var active = buttonIndex === index;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    current.innerHTML = '<div><small>当前章节 · ' + stage.number + '</small><h3>' + stage.title + '</h3><blockquote>“' + stage.stageQuote + '”<cite>——' + stage.stageQuoteSource + '</cite></blockquote></div><button class="history-plan-open" type="button">规划本章路线</button>';
    current.querySelector(".history-plan-open").addEventListener("click", function () { openPlanDialog(stage); });
    renderStageDetail(stage, index);
  }

  host.addEventListener("click", function (event) {
    var button = event.target.closest(".timeline-stage");
    if (!button) return;
    showStage(Number(button.dataset.index));
  });

  var requestedStageIndex = window.HISTORY_STAGES.findIndex(function (stage) { return "#" + stage.id === window.location.hash; });
  showStage(requestedStageIndex < 0 ? 0 : requestedStageIndex);
})();
