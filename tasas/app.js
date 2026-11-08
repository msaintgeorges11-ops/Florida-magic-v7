(function () {
  var A = window.APP;
  var $ = function (id) { return document.getElementById(id); };
  var rates = null, failed = false;
  function fmt(n) {
    return new Intl.NumberFormat(A.locale, { maximumFractionDigits: n < 1 ? 6 : 2 }).format(n);
  }
  function convert() {
    if (failed) { $("result").textContent = A.err; return; }
    if (!rates) { $("result").textContent = A.loading; return; }
    var a = parseFloat($("amount").value) || 0;
    var f = $("from").value, t = $("to").value;
    $("result").textContent = fmt(a) + " " + f + " = " + fmt(a / rates[f] * rates[t]) + " " + t;
  }
  function fillTable() {
    document.querySelectorAll("[data-code]").forEach(function (td) {
      var v = rates[td.getAttribute("data-code")];
      if (v) td.textContent = fmt(v);
    });
  }
  function fillAmounts() {
    if (!A.from) return;
    document.querySelectorAll("[data-amt]").forEach(function (td) {
      var n = parseFloat(td.getAttribute("data-amt"));
      td.textContent = fmt(n / rates[A.from] * rates[A.to]);
    });
  }
  ["amount", "from", "to"].forEach(function (id) { $(id).addEventListener("input", convert); });
  $("swap").addEventListener("click", function () {
    var f = $("from").value; $("from").value = $("to").value; $("to").value = f; convert();
  });
  convert();
  fetch("https://open.er-api.com/v6/latest/USD")
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.result !== "success") throw new Error("api");
      rates = d.rates;
      $("updated").textContent = A.updated + new Date(d.time_last_update_unix * 1000).toLocaleString(A.locale);
      fillTable(); fillAmounts(); convert();
    })
    .catch(function () { failed = true; convert(); });
})();
