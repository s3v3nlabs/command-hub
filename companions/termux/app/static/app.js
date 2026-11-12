/* Workspace chip filter — local only. Featured routes mirror hub presets. */
(function () {
  var chips = document.getElementById("ws-chips");
  var grid = document.getElementById("mod-grid");
  var empty = document.getElementById("mod-empty");
  var tagline = document.getElementById("ws-tagline");
  if (!chips || !grid) return;

  var lines = {};
  var buttons = chips.querySelectorAll(".chip");
  for (var i = 0; i < buttons.length; i++) {
    lines[buttons[i].getAttribute("data-ws")] = {
      featured: (buttons[i].getAttribute("data-featured") || "")
        .split(",")
        .map(function (s) { return s.trim(); })
        .filter(Boolean),
      label: buttons[i].textContent,
    };
  }

  function apply(id) {
    var preset = lines[id] || { featured: [] };
    var featured = preset.featured;
    var mods = grid.querySelectorAll(".mod");
    var shown = 0;
    for (var j = 0; j < mods.length; j++) {
      var route = mods[j].getAttribute("data-route") || "";
      var vis = !featured.length || featured.indexOf(route) !== -1;
      mods[j].classList.toggle("hidden", !vis);
      if (vis) shown += 1;
    }
    if (empty) empty.hidden = shown > 0;
    for (var k = 0; k < buttons.length; k++) {
      var on = buttons[k].getAttribute("data-ws") === id;
      buttons[k].classList.toggle("active", on);
      buttons[k].setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (tagline) {
      var t = {
        red: "Offense — recon → kill-chain → engagement reporting.",
        blue: "Defense — Heimdall, ATT&CK heatmap, deception, audit.",
        tiger: "Full-spectrum purple — attack, detect, replay, report.",
        investigator: "OSINT, entity graph, evidence, intelligence.",
        all: "No preset — show everything.",
      };
      tagline.textContent = t[id] || "";
    }
    try { localStorage.setItem("companion-workspace", id); } catch (e) {}
  }

  chips.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".chip");
    if (!btn) return;
    apply(btn.getAttribute("data-ws"));
  });

  var saved = "all";
  try { saved = localStorage.getItem("companion-workspace") || "all"; } catch (e) {}
  apply(saved);
})();
