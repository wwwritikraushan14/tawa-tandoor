/* Tawa & Tandoor — frontend-only demo. No server, no database. */
var WHATSAPP_NUMBER = "918292160777";

/* Mobile menu */
(function () {
  var btn = document.getElementById("menuBtn");
  var links = document.getElementById("navLinks");
  if (!btn || !links) return;
  btn.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  links.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { links.classList.remove("open"); });
  });
})();

/* Scroll reveals */
(function () {
  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
})();

/* Menu tabs: All / Veg / Non-veg */
(function () {
  var tabs = document.querySelectorAll(".tab");
  var items = document.querySelectorAll(".menu-item");
  if (!tabs.length) return;
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      var f = tab.getAttribute("data-filter");
      items.forEach(function (it) {
        var kind = it.getAttribute("data-kind");
        it.classList.toggle("hidden", f !== "all" && kind !== f);
      });
      document.querySelectorAll(".menu-cat").forEach(function (head) {
        var show = false, el = head.nextElementSibling;
        while (el && !el.classList.contains("menu-cat")) {
          if (el.classList.contains("menu-item") && !el.classList.contains("hidden")) { show = true; break; }
          el = el.nextElementSibling;
        }
        head.classList.toggle("hidden", !show);
      });
    });
  });
})();

/* Gallery lightbox */
(function () {
  var imgs = Array.prototype.slice.call(document.querySelectorAll(".gal img"));
  var box = document.getElementById("lightbox");
  if (!box || !imgs.length) return;
  var big = document.getElementById("lbImg");
  var idx = 0, lastFocus = null;
  function show(i) {
    idx = (i + imgs.length) % imgs.length;
    big.src = imgs[idx].src;
    big.alt = imgs[idx].alt || "";
  }
  imgs.forEach(function (im, i) {
    im.setAttribute("tabindex", "0");
    im.setAttribute("role", "button");
    function open() { lastFocus = document.activeElement; box.classList.add("open"); show(i); }
    im.addEventListener("click", open);
    im.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
  function close() {
    box.classList.remove("open");
    if (lastFocus) lastFocus.focus();
  }
  document.getElementById("lbPrev").addEventListener("click", function () { show(idx - 1); });
  document.getElementById("lbNext").addEventListener("click", function () { show(idx + 1); });
  document.getElementById("lbClose").addEventListener("click", close);
  box.addEventListener("click", function (e) { if (e.target === box) close(); });
  document.addEventListener("keydown", function (e) {
    if (!box.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });
})();

/* Table booking form -> WhatsApp message */
(function () {
  var form = document.getElementById("bookForm");
  if (!form) return;
  var dateEl = document.getElementById("bkDate");
  var today = new Date();
  var iso = today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");
  dateEl.setAttribute("min", iso);

  function validIndianPhone(v) {
    var d = v.replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
    if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d);
  }
  function fmtDate(isoDate) {
    var parts = isoDate.split("-");
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("bkName").value.trim();
    var phone = document.getElementById("bkPhone").value.trim();
    var date = dateEl.value;
    var time = document.getElementById("bkTime").value;
    var guests = document.getElementById("bkGuests").value;
    var notes = document.getElementById("bkNotes").value.trim();
    var err = document.getElementById("bkErr");
    err.textContent = "";
    if (!name) { err.textContent = "Please enter your name."; return; }
    if (!validIndianPhone(phone)) {
      err.textContent = "Please enter a valid 10-digit Indian mobile number.";
      return;
    }
    if (!date) { err.textContent = "Please pick a date."; return; }
    if (date < iso) { err.textContent = "Please pick today or a future date."; return; }

    var key = "tt_last_booking";
    var now = Date.now();
    try {
      var last = JSON.parse(sessionStorage.getItem(key) || "null");
      if (last && now - last.t < 10 * 60 * 1000 && last.msg) {
        window.open(last.msg, "_blank");
        showConfirm(last.ref);
        return;
      }
    } catch (err2) { /* storage unavailable: continue normally */ }

    var d = new Date();
    var ref = "TT-" + String(d.getDate()).padStart(2, "0") +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(Math.floor(1000 + Math.random() * 9000));
    var lines = [
      "Hello Tawa & Tandoor, I would like to book a table.",
      "Name: " + name,
      "Phone: " + phone,
      "Date: " + fmtDate(date),
      "Time: " + time,
      "Guests: " + guests
    ];
    if (notes) lines.push("Notes: " + notes);
    lines.push("Booking ref: " + ref);
    lines.push("Please confirm my table. Thank you!");
    var msg = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
    try { sessionStorage.setItem(key, JSON.stringify({ t: now, msg: msg, ref: ref })); } catch (err3) {}
    showConfirm(ref);
    window.open(msg, "_blank");
  });

  function showConfirm(ref) {
    var c = document.getElementById("bookConfirm");
    document.getElementById("bookRef").textContent = ref;
    c.classList.add("show");
    c.scrollIntoView({ behavior: "smooth", block: "center" });
  }
})();
