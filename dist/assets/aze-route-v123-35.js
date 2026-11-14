import { B as e, E as t, a as n, f as r, w as i } from "./vue-vendor-D4cUfCy9-aze35.js";
// src/state.ts
var a = "Reze-Route", o = n({
	settings: {},
	nodes: [],
	pingTasks: [],
	pingTasksLoaded: !1,
	results: {},
	addressFamilies: {},
	admin: !1,
	busy: !1,
	status: "",
	jobs: {},
	helpers: {}
}), s = (e) => {
	o.value = {
		...o.value,
		...e
	};
};
function c(e) {
	let t = String(e.region || ""), n = [...t].map((e) => e.codePointAt(0)).filter((e) => e >= 127462 && e <= 127487), r = n.length >= 2 ? String.fromCharCode(n[0] - 127462 + 65, n[1] - 127462 + 65) : t.toUpperCase();
	return r === "CN" || r === "中国";
}
function l(e) {
	return (Array.isArray(e.tags) ? e.tags : String(e.tags || "").split(/[\s,;|]+/)).some((e) => typeof e == "string" && e.trim().toLowerCase() === "route-probe:paused");
}
function u(e) {
	let t = o.value.pingTasks.map((e, t) => ({
		task: e,
		index: t
	})).sort((e, t) => Number.isFinite(e.task.weight) && Number.isFinite(t.task.weight) && e.task.weight - t.task.weight || e.index - t.index).map((e) => e.task), n = new Map(t.map((e, t) => [String(e.id), t]));
	return e.map((e, t) => ({
		task: e,
		index: t
	})).sort((e, t) => {
		let r = n.get(String(e.task.id)), i = n.get(String(t.task.id));
		return r !== void 0 || i !== void 0 ? (r ?? 2 ** 53 - 1) - (i ?? 2 ** 53 - 1) || e.index - t.index : Number.isFinite(e.task.weight) && Number.isFinite(t.task.weight) && e.task.weight - t.task.weight || e.index - t.index;
	}).map((e) => e.task);
}
Object.freeze({
	AS4809: "电信 CN2",
	AS4134: "电信 163",
	AS23764: "电信 CTGNET",
	AS9929: "联通 9929",
	AS10099: "联通 CUG",
	AS4837: "联通 169",
	AS58807: "移动 CMIN2",
	AS58453: "移动 CMI",
	AS9808: "移动 CMNET"
}), Object.freeze([
	[[59, 43], "AS4809"],
	[[202, 97], "AS4134"],
	[[218, 105], "AS9929"],
	[[210, 51], "AS9929"],
	[[202, 77], "AS10099"],
	[[43, 252], "AS10099"],
	[[61, 14], "AS10099"],
	[[219, 158], "AS4837"],
	[[223, 118], "AS58453"],
	[[223, 119], "AS58453"],
	[[223, 120], "AS58453"],
	[[223, 121], "AS58453"],
	[[221, 183], "AS9808"],
	[[111, 24], "AS9808"],
	[[69, 194], "AS23764"],
	[[203, 22], "AS23764"]
]);
function d(e) {
	let t = e.trim().toUpperCase();
	switch (t) {
		case "CT":
		case "TELECOM":
		case "电信": return "CT";
		case "CU":
		case "UNICOM":
		case "联通": return "CU";
		case "CM":
		case "CMCC":
		case "MOBILE":
		case "移动": return "CM";
		default: return t;
	}
}
function f(e, t, n) {
	return {
		code: e,
		label: t,
		grade: null,
		confidence: "inconclusive",
		rank: 0,
		evidence: n
	};
}
function p(e, t) {
	let n = -1, r = 0;
	return e.forEach((e, i) => {
		e.asns.some((e) => e.trim().toUpperCase() === t) && (n < 0 && (n = i), r += 1);
	}), [n, r];
}
function m(e) {
	let [t, n] = p(e, "AS4809"), [r, i] = p(e, "AS4134"), [a] = p(e, "AS23764");
	return t >= 0 ? n < 2 ? {
		code: "ct_cn2_mixed",
		label: "电信CN2混合",
		grade: "优质线路",
		confidence: "mixed",
		rank: 3,
		evidence: "only one AS4809 hop; CN2 GIA is not confirmed"
	} : r < 0 || t < r && i <= 1 ? {
		code: "ct_cn2_gia",
		label: "电信CN2GIA",
		grade: "精品线路",
		confidence: "confirmed",
		rank: 5,
		evidence: "at least two AS4809 hops precede at most one AS4134 delivery hop"
	} : t < r ? {
		code: "ct_cn2_mixed",
		label: "电信CN2混合",
		grade: "优质线路",
		confidence: "mixed",
		rank: 3,
		evidence: "AS4809 is followed by multiple AS4134 backbone hops"
	} : {
		code: "ct_cn2_gt",
		label: "电信CN2GT",
		grade: "优质线路",
		confidence: "mixed",
		rank: 3,
		evidence: "AS4134 appears before the AS4809 segment"
	} : a >= 0 ? {
		code: "ct_ctgnet",
		label: "电信CTGNET",
		grade: "精品线路",
		confidence: "confirmed",
		rank: 4,
		evidence: "AS23764 is present"
	} : r >= 0 ? i <= 1 ? f("ct_destination_only", "仅见电信目的网", "only one AS4134 hop") : {
		code: "ct_163",
		label: "电信163",
		grade: "普通线路",
		confidence: "confirmed",
		rank: 2,
		evidence: "multiple AS4134 hops are present without premium backbone evidence"
	} : f("ct_unknown", "未见电信骨干", "AS4809, AS23764, and AS4134 are absent");
}
function h(e) {
	let [t] = p(e, "AS9929"), [n] = p(e, "AS10099"), [r, i] = p(e, "AS4837");
	return t >= 0 ? r >= 0 && r < t ? {
		code: "cu_9929_mixed",
		label: "联通9929混合",
		grade: "优质线路",
		confidence: "mixed",
		rank: 3,
		evidence: "AS4837 appears before the AS9929 segment"
	} : {
		code: "cu_9929",
		label: "联通9929",
		grade: "精品线路",
		confidence: "confirmed",
		rank: 5,
		evidence: "AS9929 is present without an earlier AS4837 segment"
	} : n >= 0 ? {
		code: "cu_cug",
		label: "联通CUG",
		grade: "优质线路",
		confidence: "confirmed",
		rank: 3,
		evidence: "AS10099 is present without AS9929"
	} : r >= 0 ? i <= 1 ? f("cu_destination_only", "仅见联通目的网", "only one AS4837 hop") : {
		code: "cu_4837",
		label: "联通4837",
		grade: "普通线路",
		confidence: "confirmed",
		rank: 2,
		evidence: "multiple AS4837 hops are present without premium backbone evidence"
	} : f("cu_unknown", "未见联通骨干", "AS9929, AS10099, and AS4837 are absent");
}
function g(e) {
	let [t] = p(e, "AS58807"), [n] = p(e, "AS58453"), [r] = p(e, "AS9808");
	return t >= 0 ? n >= 0 && n < t ? {
		code: "cm_cmin2_mixed",
		label: "移动CMIN2混合",
		grade: "优质线路",
		confidence: "mixed",
		rank: 3,
		evidence: "AS58453 appears before the AS58807 segment"
	} : {
		code: "cm_cmin2",
		label: "移动CMIN2",
		grade: "精品线路",
		confidence: "confirmed",
		rank: 5,
		evidence: "AS58807 is present without an earlier AS58453 segment"
	} : n >= 0 ? {
		code: "cm_cmi",
		label: "移动CMI",
		grade: "普通线路",
		confidence: "confirmed",
		rank: 2,
		evidence: "AS58453 is present without CMIN2 evidence"
	} : r >= 0 ? {
		code: "cm_cmnet",
		label: "移动CMNET",
		grade: "普通线路",
		confidence: "confirmed",
		rank: 2,
		evidence: "AS9808 is present without international premium backbone evidence"
	} : f("cm_unknown", "未见移动骨干", "AS58807, AS58453, and AS9808 are absent");
}
function _(e, t) {
	switch (d(e)) {
		case "CT": return m(t);
		case "CU": return h(t);
		case "CM": return g(t);
		default: return f("unknown_carrier", "线路证据不足", "unknown carrier");
	}
}
Object.freeze({
	CT: "电信动态混合",
	CU: "联通动态混合",
	CM: "移动动态混合"
});
// src/routeTag.ts
var v = {
	delayedAfterMs: 864e5,
	staleAfterMs: 6048e5
}, y = "transit-route:", b = Object.freeze({
	CT: "电信",
	CU: "联通",
	CM: "移动"
}), ee = Object.freeze({
	ct: "CT",
	cu: "CU",
	cm: "CM"
}), te = /^\d{1,10}$/;
function ne(e) {
	return e.trim().toLowerCase().startsWith(y);
}
function re(e) {
	return e.split(".").map((e) => e.trim()).filter(Boolean).filter((e) => te.test(e)).map((e) => `AS${Number(e)}`);
}
function ie(e, t) {
	if (e === null) return "unknown";
	let n = Math.max(0, t - e);
	return n >= v.staleAfterMs ? "stale" : n >= v.delayedAfterMs ? "delayed" : "fresh";
}
function x(e, t = Date.now()) {
	if (!e) return null;
	let n = e.split(";").map((e) => e.trim()).find(ne);
	if (!n) return null;
	let r = n.slice(14).trim(), i = null, a = r.lastIndexOf("@");
	if (a >= 0) {
		let e = Number(r.slice(a + 1).trim());
		r = r.slice(0, a), Number.isInteger(e) && e > 0 && (i = e * 1e3);
	}
	let o = [];
	for (let e of r.split(",")) {
		let t = e.indexOf("=");
		if (t < 0) continue;
		let n = ee[e.slice(0, t).trim().toLowerCase()];
		if (!n || o.some((e) => e.carrier === n)) continue;
		let r = re(e.slice(t + 1));
		o.push({
			carrier: n,
			carrierLabel: b[n],
			asns: r,
			classification: _(n, r.map((e, t) => ({
				distance: t + 1,
				asns: [e]
			})))
		});
	}
	if (!o.length) return null;
	let s = [
		"CT",
		"CU",
		"CM"
	];
	return o.sort((e, t) => s.indexOf(e.carrier) - s.indexOf(t.carrier)), {
		entries: o,
		measuredAt: i,
		freshness: ie(i, t),
		raw: n
	};
}
// src/routeProbeResults.ts
var ae = 1e4, oe = 256, se = 4096;
function S(e) {
	if (typeof e == "string") try {
		let t = JSON.parse(e);
		return t && typeof t == "object" && !Array.isArray(t) ? t : {};
	} catch {
		return {};
	}
	return e && typeof e == "object" && !Array.isArray(e) ? e : {};
}
function C(e) {
	let t = /* @__PURE__ */ new Map();
	for (let [n, r] of Object.entries(S(e))) {
		let e = n.trim();
		if (!e || e.length > oe || typeof r != "string") continue;
		let i = r.trim();
		if (i.length > se) continue;
		let a = x(i);
		if (a?.raw === i) {
			let n = {
				uuid: e,
				tag: i,
				measuredAt: a.measuredAt ?? 0
			}, r = t.get(e);
			(!r || n.measuredAt >= r.measuredAt) && t.set(e, n);
		}
	}
	let n = [...t.values()].sort((e, t) => t.measuredAt - e.measuredAt || e.uuid.localeCompare(t.uuid)), r = Object.create(null);
	for (let e of n.slice(0, ae)) r[e.uuid] = e.tag;
	return r;
}
function w(e, t, n) {
	let r = Object.hasOwn(n, e) ? n[e] : void 0, i = r ? x(r) : null, a = x(t);
	if (!i) return a?.raw ?? "";
	if (!a) return i.raw;
	let o = i.measuredAt ?? 0;
	return (a.measuredAt ?? 0) > o ? a.raw : i.raw;
}
function ce(e, t, n) {
	let r = n ? new Set(n.map((e) => e.trim()).filter(Boolean)) : null, i = Object.create(null);
	for (let [t, n] of Object.entries(e)) (!r || r.has(t)) && (i[t] = n);
	for (let [e, n] of Object.entries(t)) {
		if (r && !r.has(e)) continue;
		let t = x(n);
		if (!t) continue;
		let a = i[e], o = a ? x(a) : null;
		(!o || (t.measuredAt ?? 0) >= (o.measuredAt ?? 0)) && (i[e] = t.raw);
	}
	return C(i);
}
// src/addressFamilies.ts
var T = "azeNodeAddressFamilies";
function E(e) {
	let t = e.split(".");
	return t.length !== 4 || t.some((e) => !/^(0|[1-9][0-9]{0,2})$/.test(e) || Number(e) > 255) ? null : t.map(Number);
}
function D(e, t) {
	if (typeof e != "string") return !1;
	let n = e.trim();
	if (t === "ipv4") {
		let e = E(n);
		return !!e && e.some((e) => e !== 0);
	}
	n.startsWith("[") && n.endsWith("]") && (n = n.slice(1, -1));
	let r = n.indexOf("%");
	if (r >= 0) {
		if (!/^[a-zA-Z0-9_.-]+$/.test(n.slice(r + 1))) return !1;
		n = n.slice(0, r);
	}
	if (n.includes(".")) {
		let e = n.lastIndexOf(":"), t = E(n.slice(e + 1));
		if (e < 0 || !t) return !1;
		n = n.slice(0, e + 1) + (t[0] << 8 | t[1]).toString(16) + ":" + (t[2] << 8 | t[3]).toString(16);
	}
	let i = n.split("::");
	if (i.length > 2) return !1;
	let a = i.flatMap((e) => e ? e.split(":") : []);
	return a.some((e) => !/^[0-9a-fA-F]{1,4}$/.test(e)) || (i.length === 1 ? a.length !== 8 : a.length >= 8) ? !1 : a.some((e) => parseInt(e, 16) !== 0);
}
function O(e) {
	try {
		typeof e == "string" && (e = JSON.parse(e));
	} catch {
		return {};
	}
	return !e || typeof e != "object" || Array.isArray(e) ? {} : Object.fromEntries(Object.entries(e).filter(([e, t]) => e && t && typeof t == "object" && ["ipv4", "ipv6"].some((e) => typeof t[e] == "boolean") && ["ipv4", "ipv6"].every((e) => !Object.hasOwn(t, e) || typeof t[e] == "boolean")).map(([e, t]) => [e, Object.fromEntries(["ipv4", "ipv6"].filter((e) => typeof t[e] == "boolean").map((e) => [e, t[e]]))]));
}
function k(e) {
	return Object.fromEntries(e.filter((e) => e && typeof e.uuid == "string" && e.uuid).map((e) => {
		let t = {};
		for (let n of ["ipv4", "ipv6"]) Object.hasOwn(e, n) ? D(e[n], n) ? t[n] = !0 : typeof e[n] == "string" && [
			"",
			n === "ipv4" ? "0.0.0.0" : "::",
			...n === "ipv6" ? ["0:0:0:0:0:0:0:0"] : []
		].includes(e[n].trim()) && (t[n] = !1) : t[n] = !1;
		return [e.uuid, t];
	}).filter(([, e]) => Object.keys(e).length));
}
function A(e, t, n) {
	return Object.fromEntries([...new Set(n)].sort().filter((n) => Object.hasOwn(e, n) || Object.hasOwn(t, n)).map((n) => {
		let r = Object.hasOwn(e, n) ? e[n] : void 0, i = Object.hasOwn(t, n) ? t[n] : void 0;
		return [n, {
			...r,
			...i
		}];
	}));
}
function j(e, t = {}) {
	let n = { ...Object.hasOwn(t, e?.uuid) ? t[e.uuid] : void 0 };
	for (let t of ["ipv4", "ipv6"]) D(e?.[t], t) && (n[t] = !0);
	return n;
}
function le(e, t = {}) {
	let n = j(e, t);
	return {
		ipv4: n.ipv4 === !0,
		ipv6: n.ipv6 === !0
	};
}
// src/service.ts
var M = "/api/transit-route-probe/v1", N = 0, P = Promise.resolve();
async function F(e, t, n = "include") {
	let r = await fetch(e, {
		credentials: n,
		cache: "no-store",
		method: t ? "POST" : "GET",
		headers: {
			Accept: "application/json",
			...e.startsWith(M) ? { "X-Transit-Route-Probe": "1" } : {},
			...t ? { "Content-Type": "application/json" } : {}
		},
		...t ? { body: JSON.stringify(t) } : {},
		signal: AbortSignal.timeout(15e3)
	});
	if (!r.ok) throw Error(`接口请求失败 (${r.status})`);
	let i = await r.json();
	return i?.data === void 0 ? i : i.data;
}
function I(e, t) {
	return e && t === "Reze-Route";
}
function ue(e) {
	return C(Object.fromEntries(e.filter((e) => e.status === "completed" && e.tag).map((e) => [e.client, e.tag])));
}
function L(e) {
	s({
		settings: e.theme_settings || {},
		results: C(e.theme_settings?.pandaOpsRouteProbeResults),
		addressFamilies: O(e.theme_settings?.[T])
	});
}
function R(e) {
	let t = P.then(async () => {
		navigator.locks ? await navigator.locks.request("reze-route-settings", e) : await e();
	});
	return P = t.catch(() => {}), t;
}
async function z(e) {
	await R(async () => {
		let [t, n] = await Promise.all([F("/api/public"), F("/api/me")]);
		if (!I(!!n.logged_in, t.theme)) throw Error("登录已失效或主题已切换");
		let r = await F("/api/nodes", void 0, "omit");
		if (!Array.isArray(r)) throw Error("公开节点列表暂时无法读取");
		let i = r.filter((e) => e && typeof e.uuid == "string" && e.uuid).map((e) => e.uuid), o = { ...t.theme_settings || {} }, s = A(O(o[T]), e, i), c = JSON.stringify(s);
		if (o.azeNodeAddressFamilies === c || !Object.hasOwn(o, "azeNodeAddressFamilies") && c === "{}") {
			L(t);
			return;
		}
		o[T] = c, await F("/api/admin/theme/settings?theme=" + encodeURIComponent(a), o);
		let l = await F("/api/public");
		if (l.theme !== "Reze-Route" || JSON.stringify(O(l.theme_settings?.azeNodeAddressFamilies)) !== c) throw Error("IP 协议摘要保存校验失败");
		L(l);
	});
}
async function B() {
	let [e, t, n, r] = await Promise.all([
		F("/api/public"),
		F("/api/nodes"),
		F("/api/me"),
		F("/api/task/ping").catch(() => null)
	]);
	if (e.theme !== "Reze-Route") return !1;
	let i = Array.isArray(t) ? t : [];
	if (L(e), s({
		nodes: i,
		admin: !!n.logged_in,
		...Array.isArray(r) ? {
			pingTasks: r,
			pingTasksLoaded: !0
		} : {}
	}), n.logged_in) {
		let e = await F("/api/admin/client/list").catch(() => null);
		Array.isArray(e) && await z(k(e)).catch(() => {});
	}
	return !0;
}
async function V(e) {
	Object.keys(e).length && await R(async () => {
		let [t, n] = await Promise.all([F("/api/public"), F("/api/me")]);
		if (!I(!!n.logged_in, t.theme)) throw Error("登录已失效或主题已切换");
		let r = { ...t.theme_settings || {} }, i = C(r.pandaOpsRouteProbeResults), o = ce(i, e);
		if (Object.keys(i).length === Object.keys(o).length && Object.entries(o).every(([e, t]) => i[e] === t)) {
			L(t);
			return;
		}
		r.pandaOpsRouteProbeResults = JSON.stringify(o), await F("/api/admin/theme/settings?theme=" + encodeURIComponent(a), r);
		let s = await F("/api/public");
		if (s.theme !== "Reze-Route") throw Error("主题已切换");
		let c = C(s.theme_settings?.pandaOpsRouteProbeResults);
		for (let [t, n] of Object.entries(e)) if (!c[t] || (x(c[t])?.measuredAt || 0) < (x(n)?.measuredAt || 0)) throw Error("结果保存校验失败");
		L(s);
	});
}
async function H(e) {
	if (!(o.value.busy || !o.value.admin || document.hidden) && !(!e && (o.value.settings.azeRouteAuto === !1 || Date.now() - N < 9e5))) {
		s({ busy: !0 });
		try {
			if (!await B() || !o.value.admin) return;
			let t = o.value, n = t.nodes.filter((t) => !c(t) && !l(t) && (!e || t.uuid === e));
			if (!n.length) return;
			let r = await F(M + "/health");
			if (!r.ok || r.protocol !== 1) throw Error("回程插件未就绪");
			let i = await F(M + "/roster?clients=" + encodeURIComponent(n.map((e) => e.uuid).join(",")));
			s({ helpers: Object.fromEntries(i.clients.map((e) => [e.client, e])) });
			let a = n.filter((n) => {
				let r = i.clients.find((e) => e.client === n.uuid);
				if (!r?.helper_seen_at || Date.now() - r.helper_seen_at > 18e4 || (r.active_job_until || 0) > Date.now()) return !1;
				let a = x(w(n.uuid, n.tags, t.results));
				return e || !a?.measuredAt || a.freshness === "stale";
			}).map((e) => e.uuid);
			if (N = Date.now(), !a.length) {
				s({ status: "结果保持最新，未连接助手的节点暂不采集" });
				return;
			}
			let u = await F(M + "/enqueue", {
				clients: a,
				city: "beijing"
			}), d = Date.now() + 6e5, f = "";
			for (;;) {
				let e = Object.fromEntries(u.jobs.map((e) => [e.client, e]));
				s({ jobs: {
					...o.value.jobs,
					...e
				} });
				let t = ue(u.jobs);
				Object.keys(t).length && JSON.stringify(t) !== f && (await V(t), f = JSON.stringify(t));
				let n = u.jobs.filter((e) => ["completed", "failed"].includes(e.status)).length;
				if (s({ status: `回程采集 ${n}/${u.jobs.length}，成功 ${Object.keys(t).length}` }), u.jobs.every((e) => ["completed", "failed"].includes(e.status))) break;
				if (Date.now() >= d) throw Error("本轮采集等待超时，保留上次成功结果");
				await new Promise((e) => setTimeout(e, 5e3));
				let [r, i] = await Promise.all([F("/api/public"), F("/api/me")]);
				if (!I(!!i.logged_in, r.theme)) throw Error("主题已切换或登录失效");
				u = await F(M + "/status?batch_id=" + encodeURIComponent(u.batch_id));
			}
		} catch (e) {
			N = Date.now(), s({ status: e instanceof Error ? e.message : "本次采集失败" });
		} finally {
			s({ busy: !1 });
		}
	}
}
async function U(e) {
	o.value.admin && !o.value.busy && (navigator.locks ? await navigator.locks.request("reze-route-collection", { ifAvailable: !0 }, async (t) => {
		t && await H(e);
	}) : await H(e));
}
function de() {
	B().then((e) => {
		e && setTimeout(() => void U(), 8e3);
	}).catch(() => s({ status: "回程数据暂时无法读取" })), setInterval(() => {
		document.hidden || B().then((e) => {
			e && U();
		}).catch(() => {});
	}, 6e4);
}
// src/visitorInfo.ts
var W = "ichigo:visitor-network:v1", G = 18e5, fe = 3e5, pe = [
	"https://ipwho.is/",
	"https://ipapi.co/json/",
	"https://api.ip.sb/geoip"
], K = (e) => typeof e == "string" ? e.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 160) : "";
function q(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return null;
	let t = e;
	if (t.success === !1 || t.error === !0) return null;
	let n = K(t.ip);
	return !D(n, "ipv4") && !D(n, "ipv6") ? null : {
		ip: n,
		city: K(t.city),
		region: K(t.region),
		country: K(t.country_name || t.country),
		org: K(t.org || t.connection?.org || t.connection?.isp || t.organization || t.isp)
	};
}
function me(e, t = Date.now()) {
	try {
		let n = JSON.parse(e.getItem(W) || "null");
		if (!n || !Number.isFinite(n.at) || n.at > t || t - n.at > (n.data ? G : fe)) return null;
		let r = n.data === null ? null : q(n.data);
		return n.data !== null && !r ? null : { data: r };
	} catch {
		return null;
	}
}
function he(e) {
	try {
		sessionStorage.setItem(W, JSON.stringify({
			at: Date.now(),
			data: e
		}));
	} catch {}
}
async function ge(e) {
	for (let t of pe) {
		if (e.aborted) return null;
		let n = new AbortController(), r = () => n.abort();
		e.addEventListener("abort", r, { once: !0 });
		let i = setTimeout(r, 6e3);
		try {
			let e = await fetch(t, {
				signal: n.signal,
				credentials: "omit",
				referrerPolicy: "no-referrer",
				headers: { Accept: "application/json" }
			});
			if (e.ok) {
				let t = q(await e.json());
				if (t) return t;
			}
		} catch {} finally {
			clearTimeout(i), e.removeEventListener("abort", r);
		}
	}
	return null;
}
function _e(e) {
	return {
		os: /Android/i.test(e) ? "Android" : /iPhone|iPad|iPod/i.test(e) ? "iOS" : /Windows/i.test(e) ? "Windows" : /Mac/i.test(e) ? "macOS" : /Linux/i.test(e) ? "Linux" : "当前设备",
		browser: /Edg(?:e|A|iOS)?\//i.test(e) ? "Edge" : /Firefox|FxiOS/i.test(e) ? "Firefox" : /Chrome|CriOS/i.test(e) ? "Chrome" : /Safari/i.test(e) ? "Safari" : "浏览器"
	};
}
var J = (e) => t("svg", {
	viewBox: "0 0 24 24",
	width: 14,
	height: 14,
	fill: "none",
	stroke: "currentColor",
	"stroke-width": 1.7,
	"stroke-linecap": "round",
	"stroke-linejoin": "round",
	"aria-hidden": "true"
}, [t("path", { d: e })]), ve = () => J("M6 6l12 12M18 6 6 18"), Y = () => J("M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"), ye = () => J("M4 4h16v12H4zM2 20h20M8 16v4m8-4v4"), X = () => J("M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2"), be = {
	name: "IchigoVisitorInfo",
	props: {
		enabled: Boolean,
		admin: Boolean
	},
	setup(a) {
		let o = n({
			loading: !0,
			data: null
		}), s = n(!1), c = n(!1), l = n(null), u = window.matchMedia("(min-width:1952px)"), d = n(u.matches), f = null, p = 0, m, h = _e(navigator.userAgent);
		function g() {
			p++, f?.abort(), f = null;
		}
		function _() {
			s.value = !0, g();
		}
		async function v() {
			if (g(), !a.enabled || s.value) return;
			let e = null;
			try {
				e = me(sessionStorage);
			} catch {}
			if (e) {
				o.value = {
					loading: !1,
					data: e.data
				};
				return;
			}
			let t = p;
			f = new AbortController(), o.value = {
				loading: !0,
				data: null
			};
			let n = await ge(f.signal);
			t === p && (f = null, o.value = {
				loading: !1,
				data: n
			}, he(n));
		}
		function y() {
			window.matchMedia("(max-width:767px)").matches && (c.value = !0, clearTimeout(m), m = setTimeout(() => {
				c.value = !1;
			}, 700));
		}
		let b = (e) => {
			d.value = e.matches;
		};
		return i(() => a.enabled, (e) => {
			e ? (s.value = !1, v()) : g();
		}, { immediate: !0 }), r(() => {
			window.addEventListener("scroll", y, { passive: !0 }), u.addEventListener("change", b);
		}), e(() => {
			g(), clearTimeout(m), window.removeEventListener("scroll", y), u.removeEventListener("change", b);
		}), () => {
			if (!a.enabled || s.value) return null;
			let { data: e, loading: n } = o.value, r = e?.ip || (n ? "获取网络信息…" : "网络信息暂不可用"), i = [e?.city, e?.region].filter((e, t, n) => e && n.indexOf(e) === t).join(" · ") || e?.country || (n ? "定位中" : "未知地区"), u = a.admin ? "管理员" : "访客", f = () => t("button", {
				type: "button",
				class: "ichigo-visitor-close",
				"aria-label": "关闭访客信息",
				title: "关闭访客信息",
				onClick: _
			}, [ve()]), p = l.value === null ? d.value : l.value;
			return t("aside", {
				class: "ichigo-visitor",
				"aria-label": "访客网络信息"
			}, [t("section", {
				class: ["ichigo-visitor-card", l.value === !0 ? "is-open" : l.value === !1 ? "is-collapsed" : ""],
				"aria-label": u + "信息"
			}, [
				t("div", { class: "ichigo-visitor-head" }, [
					t("span", { class: "ichigo-visitor-avatar" }, [X()]),
					t("div", { class: "ichigo-visitor-identity" }, [t("strong", null, u), t("span", { title: i }, i)]),
					f()
				]),
				t("p", { class: "ichigo-visitor-welcome" }, e ? "欢迎来自 " + (e.city || e.country || "远方") + " 的你" : n ? "正在获取公网出口信息" : "欢迎访问，公网定位暂不可用"),
				t("div", { class: "ichigo-visitor-details" }, [
					t("div", null, [ye(), t("span", null, h.os + " · " + h.browser)]),
					t("div", null, [Y(), t("span", {
						class: "ichigo-visitor-ip",
						title: r
					}, r)]),
					t("div", null, [t("span", {
						class: "ichigo-visitor-detail-mark",
						"aria-hidden": "true"
					}, "◇"), t("span", { title: e?.org || "" }, e?.org || (n ? "正在获取运营商" : "运营商未知"))]),
					t("div", null, [t("span", {
						class: "ichigo-visitor-detail-mark",
						"aria-hidden": "true"
					}, "◷"), t("span", null, (/* @__PURE__ */ new Date()).toLocaleDateString("zh-CN", {
						year: "numeric",
						month: "long",
						day: "numeric"
					}))])
				]),
				t("span", { class: "ichigo-visitor-note" }, "IP 归属仅供参考")
			]), t("div", {
				class: ["ichigo-visitor-bar", c.value ? "is-scrolling" : ""],
				"aria-label": "当前访客网络"
			}, [
				Y(),
				t("span", { class: "ichigo-visitor-bar-label" }, "你的 IP"),
				t("strong", { title: r }, r),
				e?.country ? t("span", { class: "ichigo-visitor-country" }, e.country) : null,
				e?.org ? t("span", {
					class: "ichigo-visitor-org",
					title: e.org
				}, e.org) : null,
				t("button", {
					type: "button",
					class: "ichigo-visitor-expand",
					"aria-label": p ? "收起访客信息" : "展开访客信息",
					"aria-expanded": p,
					title: p ? "收起访客信息" : "展开访客信息",
					onClick: () => {
						l.value = !p;
					}
				}, [X()]),
				f()
			])]);
		};
	}
};
// src/index.ts
de();
var xe = {
	name: "IchigoAddressFamilyBadges",
	props: { node: {
		type: Object,
		required: !0
	} },
	setup(e) {
		return () => {
			let n = le(e.node, o.value.addressFamilies), r = ["ipv4", "ipv6"].filter((e) => n[e]);
			return r.length ? t("span", {
				class: "ichigo-ip-families",
				role: "group",
				"aria-label": "已上报的 IP 协议"
			}, r.map((e) => t("span", {
				key: e,
				class: ["ichigo-ip-badge", e === "ipv4" ? "ichigo-ip-badge--v4" : "ichigo-ip-badge--v6"],
				title: "节点已上报 " + (e === "ipv4" ? "IPv4" : "IPv6") + "；不代表公网连通性"
			}, e === "ipv4" ? "IPv4" : "IPv6"))) : null;
		};
	}
};
function Z(e) {
	return /(?:ipv|v)\s*6/i.test(e.name || "") ? "ipv6" : /(?:ipv|v)\s*4/i.test(e.name || "") ? "ipv4" : void 0;
}
function Q(e) {
	return e.hasData !== !1 && e.avgLoss < 100 && (e.validSamples === void 0 || e.validSamples > 0);
}
function Se(e, t) {
	let n = o.value, r = j(e, n.addressFamilies), i = new Map(t.map((e) => [String(e.id), e])), a = n.pingTasksLoaded || n.pingTasks.length ? n.pingTasks.filter((t) => !Object.hasOwn(t, "clients") || Array.isArray(t.clients) && t.clients.includes(e.uuid)) : t;
	for (let e of a) {
		let t = i.get(String(e.id)), n = Z(e);
		n && t && Q(t) && (r[n] = !0);
	}
	return u(a.map((e) => {
		let t = i.get(String(e.id)), n = Z(e), a = n && r[n] === !1, o = {
			...t,
			...e,
			name: e.name || t?.name || "探测目标",
			hasData: t?.hasData === !0,
			avgLatency: t?.avgLatency ?? 0,
			avgLoss: t?.avgLoss ?? 0,
			latencyBars: t?.latencyBars || [],
			lossBars: t?.lossBars || [],
			familyUnavailable: !!a,
			familyLabel: a ? "无 " + (n === "ipv4" ? "IPv4" : "IPv6") : "",
			family: n
		};
		return a ? {
			...o,
			hasData: !1,
			latencyDisplay: "—",
			lossDisplay: "—",
			latencyBars: [],
			lossBars: []
		} : {
			...o,
			latencyDisplay: o.hasData ? Q(o) ? o.avgLatency < 1 ? "<1 ms" : Math.round(o.avgLatency) + " ms" : "不可达" : "—",
			lossDisplay: o.hasData ? o.avgLoss.toFixed(1) + "%" : "—"
		};
	}));
}
var Ce = {
	name: "IchigoPingTaskName",
	props: { task: {
		type: Object,
		required: !0
	} },
	setup(e) {
		return () => {
			let n = e.task, r = Z(n), i = r ? n.name.replace(/\s*(?:ipv|v)\s*[46]\s*$/i, "") : n.name;
			return [t("span", {
				class: "ichigo-ping-task-name",
				title: n.name,
				"aria-label": n.name
			}, [t("span", { class: "ichigo-ping-label" }, i), r ? t("span", { class: "ichigo-ping-version" }, r === "ipv4" ? "V4" : "V6") : null]), n.familyUnavailable && r !== "ipv6" ? t("span", { class: "ichigo-ping-family-none" }, n.familyLabel) : null];
		};
	}
}, we = [
	{
		key: "CT",
		name: "电信",
		icon: "电",
		tone: "telecom"
	},
	{
		key: "CU",
		name: "联通",
		icon: "联",
		tone: "unicom"
	},
	{
		key: "CM",
		name: "移动",
		icon: "移",
		tone: "mobile"
	}
];
function $(e) {
	let t = e.filter(Q).map((e) => e.avgLatency).filter((e) => Number.isFinite(e) && e >= 0), n = e.filter((e) => e.hasData !== !1).map((e) => e.avgLoss).filter((e) => Number.isFinite(e) && e >= 0 && e <= 100);
	return [
		{
			label: "拨测目标",
			value: e.length ? e.length + " 条" : "待配置"
		},
		{
			label: "最低延迟",
			value: t.length ? Math.min(...t) < 1 ? "<1 ms" : Math.round(Math.min(...t)) + " ms" : "等待采样"
		},
		{
			label: "最高丢包",
			value: n.length ? Math.max(...n).toFixed(1) + "%" : "等待采样"
		}
	];
}
var Te = {
	name: "AzeRoutePanel",
	props: {
		node: {
			type: Object,
			required: !0
		},
		tasks: {
			type: Array,
			default: () => []
		}
	},
	setup(e) {
		return () => {
			let n = o.value, r = e.node, i = c(r), a = x(w(r.uuid, r.tags, n.results)), s = n.jobs[r.uuid], u = s && ["queued", "running"].includes(s.status), d = s?.status === "failed", f = a?.freshness === "stale", p = i ? "国内节点" : l(r) ? "已暂停" : u ? "采集中" : d ? "采集失败" : a ? f ? "结果已过期" : "已采集" : "等待采集", m = a?.measuredAt ? new Date(a.measuredAt).toLocaleString("zh-CN", {
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				hour12: !1
			}) : "", h = i ? e.tasks.length ? e.tasks.length + " 线拨测 · 独立延迟与丢包" : "独立拨测 · 等待采样" : a ? "北京三网 · 更新 " + m : l(r) ? "此节点暂不采集回程" : d ? "本次失败 · 保留上次成功结果" : u ? "节点正在探测北京三网" : n.helpers[r.uuid]?.last_error ? "助手上次采集未成功" : "等待节点助手返回结果", g = i ? $(e.tasks).map((e, n) => t("div", {
				class: "aze-rp-tile aze-rp-local",
				key: n
			}, [
				t("span", { class: "aze-rp-carrier" }, e.label),
				t("strong", { class: "aze-rp-value" }, e.value),
				t("span", { class: "aze-rp-note" }, [
					"独立任务",
					"应答样本",
					"最近 1 小时"
				][n])
			])) : we.map((e) => {
				let n = a?.entries.find((t) => t.carrier === e.key), r = n?.classification, i = r?.label || "待采集";
				i = r?.code.endsWith("_destination_only") ? "仅见目的网" : r?.confidence === "inconclusive" ? "证据不足" : i.replace(/^(电信|联通|移动)/, "");
				let o = n ? `${r?.label} · ${n.asns.join(" → ") || "无骨干跳点"} · ${r?.evidence}` : h;
				return t("div", {
					class: [
						"aze-rp-tile",
						e.tone,
						r?.confidence || "empty",
						f ? "stale" : ""
					],
					key: e.key,
					title: o
				}, [
					t("span", { class: "aze-rp-carrier" }, [t("i", {
						class: "aze-rp-icon",
						"aria-hidden": "true"
					}, e.icon), e.name]),
					t("strong", { class: "aze-rp-value" }, i),
					t("span", {
						class: "aze-rp-note",
						"data-route-grade": r?.grade || "ungraded"
					}, r?.grade || (n ? "不作线路定级" : "暂无线路证据"))
				]);
			});
			return t("section", {
				class: ["aze-route-panel", i ? "local" : "return"],
				"data-route-node": r.uuid,
				"aria-label": i ? "本地链路" : "三网回程"
			}, [
				t("div", { class: "aze-rp-head" }, [
					t("span", { class: "aze-rp-title" }, [t("span", {
						"aria-hidden": "true",
						class: "aze-rp-mark"
					}, i ? "◈" : "⇄"), i ? "本地链路" : "三网回程"]),
					t("span", { class: ["aze-rp-status", u ? "pending" : ""] }, p),
					n.admin && !i && !l(r) ? t("button", {
						type: "button",
						class: "aze-rp-refresh",
						title: n.status || "重新采集此节点三网回程",
						"aria-label": "重新采集 " + r.name + " 三网回程",
						disabled: n.busy,
						onClick: (e) => {
							e.stopPropagation(), U(r.uuid);
						},
						onKeydown: (e) => e.stopPropagation()
					}, [t("svg", {
						viewBox: "0 0 24 24",
						width: 11,
						height: 11,
						fill: "none",
						stroke: "currentColor",
						"stroke-width": 1.8,
						"stroke-linecap": "round",
						"stroke-linejoin": "round",
						"aria-hidden": "true"
					}, [t("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5" })])]) : null
				]),
				t("div", { class: "aze-rp-grid" }, g),
				t("div", {
					class: "aze-rp-foot",
					title: h
				}, [t("span", {
					class: "aze-rp-dot",
					"aria-hidden": "true"
				}), h])
			]);
		};
	}
};
export { xe as AddressFamilyBadges, Ce as PingTaskName, Te as RoutePanel, be as VisitorInfo, $ as domesticFacts, Se as nodePingTasks, u as orderTasks };
