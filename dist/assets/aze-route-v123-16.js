import { E as e, a as t } from "./vue-vendor-D4cUfCy9-aze16.js";
// src/state.ts
var n = "Reze-Route", r = t({
	settings: {},
	nodes: [],
	results: {},
	addressFamilies: {},
	admin: !1,
	busy: !1,
	status: "",
	jobs: {},
	helpers: {}
}), i = (e) => {
	r.value = {
		...r.value,
		...e
	};
};
function a(e) {
	let t = String(e.region || ""), n = [...t].map((e) => e.codePointAt(0)).filter((e) => e >= 127462 && e <= 127487), r = n.length >= 2 ? String.fromCharCode(n[0] - 127462 + 65, n[1] - 127462 + 65) : t.toUpperCase();
	return r === "CN" || r === "中国";
}
function o(e) {
	return (Array.isArray(e.tags) ? e.tags : String(e.tags || "").split(/[\s,;|]+/)).some((e) => typeof e == "string" && e.trim().toLowerCase() === "route-probe:paused");
}
function s(e) {
	return e.slice();
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
function c(e) {
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
function l(e, t, n) {
	return {
		code: e,
		label: t,
		grade: null,
		confidence: "inconclusive",
		rank: 0,
		evidence: n
	};
}
function u(e, t) {
	let n = -1, r = 0;
	return e.forEach((e, i) => {
		e.asns.some((e) => e.trim().toUpperCase() === t) && (n < 0 && (n = i), r += 1);
	}), [n, r];
}
function d(e) {
	let [t, n] = u(e, "AS4809"), [r, i] = u(e, "AS4134"), [a] = u(e, "AS23764");
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
	} : r >= 0 ? i <= 1 ? l("ct_destination_only", "仅见电信目的网", "only one AS4134 hop") : {
		code: "ct_163",
		label: "电信163",
		grade: "普通线路",
		confidence: "confirmed",
		rank: 2,
		evidence: "multiple AS4134 hops are present without premium backbone evidence"
	} : l("ct_unknown", "未见电信骨干", "AS4809, AS23764, and AS4134 are absent");
}
function f(e) {
	let [t] = u(e, "AS9929"), [n] = u(e, "AS10099"), [r, i] = u(e, "AS4837");
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
	} : r >= 0 ? i <= 1 ? l("cu_destination_only", "仅见联通目的网", "only one AS4837 hop") : {
		code: "cu_4837",
		label: "联通4837",
		grade: "普通线路",
		confidence: "confirmed",
		rank: 2,
		evidence: "multiple AS4837 hops are present without premium backbone evidence"
	} : l("cu_unknown", "未见联通骨干", "AS9929, AS10099, and AS4837 are absent");
}
function p(e) {
	let [t] = u(e, "AS58807"), [n] = u(e, "AS58453"), [r] = u(e, "AS9808");
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
	} : l("cm_unknown", "未见移动骨干", "AS58807, AS58453, and AS9808 are absent");
}
function m(e, t) {
	switch (c(e)) {
		case "CT": return d(t);
		case "CU": return f(t);
		case "CM": return p(t);
		default: return l("unknown_carrier", "线路证据不足", "unknown carrier");
	}
}
Object.freeze({
	CT: "电信动态混合",
	CU: "联通动态混合",
	CM: "移动动态混合"
});
// src/routeTag.ts
var h = {
	delayedAfterMs: 864e5,
	staleAfterMs: 6048e5
}, g = "transit-route:", _ = Object.freeze({
	CT: "电信",
	CU: "联通",
	CM: "移动"
}), v = Object.freeze({
	ct: "CT",
	cu: "CU",
	cm: "CM"
}), y = /^\d{1,10}$/;
function b(e) {
	return e.trim().toLowerCase().startsWith(g);
}
function x(e) {
	return e.split(".").map((e) => e.trim()).filter(Boolean).filter((e) => y.test(e)).map((e) => `AS${Number(e)}`);
}
function S(e, t) {
	if (e === null) return "unknown";
	let n = Math.max(0, t - e);
	return n >= h.staleAfterMs ? "stale" : n >= h.delayedAfterMs ? "delayed" : "fresh";
}
function C(e, t = Date.now()) {
	if (!e) return null;
	let n = e.split(";").map((e) => e.trim()).find(b);
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
		let n = v[e.slice(0, t).trim().toLowerCase()];
		if (!n || o.some((e) => e.carrier === n)) continue;
		let r = x(e.slice(t + 1));
		o.push({
			carrier: n,
			carrierLabel: _[n],
			asns: r,
			classification: m(n, r.map((e, t) => ({
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
		freshness: S(i, t),
		raw: n
	};
}
// src/routeProbeResults.ts
var w = 1e4, T = 256, E = 4096;
function D(e) {
	if (typeof e == "string") try {
		let t = JSON.parse(e);
		return t && typeof t == "object" && !Array.isArray(t) ? t : {};
	} catch {
		return {};
	}
	return e && typeof e == "object" && !Array.isArray(e) ? e : {};
}
function O(e) {
	let t = /* @__PURE__ */ new Map();
	for (let [n, r] of Object.entries(D(e))) {
		let e = n.trim();
		if (!e || e.length > T || typeof r != "string") continue;
		let i = r.trim();
		if (i.length > E) continue;
		let a = C(i);
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
	for (let e of n.slice(0, w)) r[e.uuid] = e.tag;
	return r;
}
function k(e, t, n) {
	let r = Object.hasOwn(n, e) ? n[e] : void 0, i = r ? C(r) : null, a = C(t);
	if (!i) return a?.raw ?? "";
	if (!a) return i.raw;
	let o = i.measuredAt ?? 0;
	return (a.measuredAt ?? 0) > o ? a.raw : i.raw;
}
function A(e, t, n) {
	let r = n ? new Set(n.map((e) => e.trim()).filter(Boolean)) : null, i = Object.create(null);
	for (let [t, n] of Object.entries(e)) (!r || r.has(t)) && (i[t] = n);
	for (let [e, n] of Object.entries(t)) {
		if (r && !r.has(e)) continue;
		let t = C(n);
		if (!t) continue;
		let a = i[e], o = a ? C(a) : null;
		(!o || (t.measuredAt ?? 0) >= (o.measuredAt ?? 0)) && (i[e] = t.raw);
	}
	return O(i);
}
// src/addressFamilies.ts
var j = "azeNodeAddressFamilies";
function M(e) {
	let t = e.split(".");
	return t.length !== 4 || t.some((e) => !/^(0|[1-9][0-9]{0,2})$/.test(e) || Number(e) > 255) ? null : t.map(Number);
}
function N(e, t) {
	if (typeof e != "string") return !1;
	let n = e.trim();
	if (t === "ipv4") {
		let e = M(n);
		return !!e && e.some((e) => e !== 0);
	}
	n.startsWith("[") && n.endsWith("]") && (n = n.slice(1, -1));
	let r = n.indexOf("%");
	if (r >= 0) {
		if (!/^[a-zA-Z0-9_.-]+$/.test(n.slice(r + 1))) return !1;
		n = n.slice(0, r);
	}
	if (n.includes(".")) {
		let e = n.lastIndexOf(":"), t = M(n.slice(e + 1));
		if (e < 0 || !t) return !1;
		n = n.slice(0, e + 1) + (t[0] << 8 | t[1]).toString(16) + ":" + (t[2] << 8 | t[3]).toString(16);
	}
	let i = n.split("::");
	if (i.length > 2) return !1;
	let a = i.flatMap((e) => e ? e.split(":") : []);
	return a.some((e) => !/^[0-9a-fA-F]{1,4}$/.test(e)) || (i.length === 1 ? a.length !== 8 : a.length >= 8) ? !1 : a.some((e) => parseInt(e, 16) !== 0);
}
function P(e) {
	try {
		typeof e == "string" && (e = JSON.parse(e));
	} catch {
		return {};
	}
	return !e || typeof e != "object" || Array.isArray(e) ? {} : Object.fromEntries(Object.entries(e).filter(([e, t]) => e && t && typeof t == "object" && typeof t.ipv4 == "boolean" && typeof t.ipv6 == "boolean").map(([e, t]) => [e, {
		ipv4: t.ipv4,
		ipv6: t.ipv6
	}]));
}
function F(e) {
	return Object.fromEntries(e.filter((e) => e && typeof e.uuid == "string" && e.uuid && (Object.hasOwn(e, "ipv4") || Object.hasOwn(e, "ipv6"))).map((e) => {
		let t = {};
		return Object.hasOwn(e, "ipv4") && (t.ipv4 = N(e.ipv4, "ipv4")), Object.hasOwn(e, "ipv6") && (t.ipv6 = N(e.ipv6, "ipv6")), [e.uuid, t];
	}));
}
function I(e, t, n) {
	return Object.fromEntries([...new Set(n)].sort().filter((n) => Object.hasOwn(e, n) || Object.hasOwn(t, n)).map((n) => {
		let r = Object.hasOwn(e, n) ? e[n] : void 0, i = Object.hasOwn(t, n) ? t[n] : void 0;
		return [n, {
			ipv4: i?.ipv4 ?? r?.ipv4 === !0,
			ipv6: i?.ipv6 ?? r?.ipv6 === !0
		}];
	}));
}
function L(e, t = {}) {
	let n = Object.hasOwn(t, e?.uuid) ? t[e.uuid] : void 0;
	return {
		ipv4: e && Object.hasOwn(e, "ipv4") ? N(e.ipv4, "ipv4") : n?.ipv4 === !0,
		ipv6: e && Object.hasOwn(e, "ipv6") ? N(e.ipv6, "ipv6") : n?.ipv6 === !0
	};
}
// src/service.ts
var R = "/api/transit-route-probe/v1", z = 0, B = Promise.resolve();
async function V(e, t, n = "include") {
	let r = await fetch(e, {
		credentials: n,
		cache: "no-store",
		method: t ? "POST" : "GET",
		headers: {
			Accept: "application/json",
			...e.startsWith(R) ? { "X-Transit-Route-Probe": "1" } : {},
			...t ? { "Content-Type": "application/json" } : {}
		},
		...t ? { body: JSON.stringify(t) } : {},
		signal: AbortSignal.timeout(15e3)
	});
	if (!r.ok) throw Error(`接口请求失败 (${r.status})`);
	let i = await r.json();
	return i?.data === void 0 ? i : i.data;
}
function H(e, t) {
	return e && t === "Reze-Route";
}
function U(e) {
	return O(Object.fromEntries(e.filter((e) => e.status === "completed" && e.tag).map((e) => [e.client, e.tag])));
}
function W(e) {
	i({
		settings: e.theme_settings || {},
		results: O(e.theme_settings?.pandaOpsRouteProbeResults),
		addressFamilies: P(e.theme_settings?.[j])
	});
}
function G(e) {
	let t = B.then(async () => {
		navigator.locks ? await navigator.locks.request("reze-route-settings", e) : await e();
	});
	return B = t.catch(() => {}), t;
}
async function K(e) {
	await G(async () => {
		let [t, r] = await Promise.all([V("/api/public"), V("/api/me")]);
		if (!H(!!r.logged_in, t.theme)) throw Error("登录已失效或主题已切换");
		let i = await V("/api/nodes", void 0, "omit");
		if (!Array.isArray(i)) throw Error("公开节点列表暂时无法读取");
		let a = i.filter((e) => e && typeof e.uuid == "string" && e.uuid).map((e) => e.uuid), o = { ...t.theme_settings || {} }, s = I(P(o[j]), e, a), c = JSON.stringify(s);
		if (o.azeNodeAddressFamilies === c || !Object.hasOwn(o, "azeNodeAddressFamilies") && c === "{}") {
			W(t);
			return;
		}
		o[j] = c, await V("/api/admin/theme/settings?theme=" + encodeURIComponent(n), o);
		let l = await V("/api/public");
		if (l.theme !== "Reze-Route" || JSON.stringify(P(l.theme_settings?.azeNodeAddressFamilies)) !== c) throw Error("IP 协议摘要保存校验失败");
		W(l);
	});
}
async function q() {
	let [e, t, n] = await Promise.all([
		V("/api/public"),
		V("/api/nodes"),
		V("/api/me")
	]);
	if (e.theme !== "Reze-Route") return !1;
	let r = Array.isArray(t) ? t : [];
	return W(e), i({
		nodes: r,
		admin: !!n.logged_in
	}), n.logged_in && Array.isArray(t) && await K(F(r)).catch(() => {}), !0;
}
async function J(e) {
	Object.keys(e).length && await G(async () => {
		let [t, r] = await Promise.all([V("/api/public"), V("/api/me")]);
		if (!H(!!r.logged_in, t.theme)) throw Error("登录已失效或主题已切换");
		let i = { ...t.theme_settings || {} }, a = O(i.pandaOpsRouteProbeResults), o = A(a, e);
		if (Object.keys(a).length === Object.keys(o).length && Object.entries(o).every(([e, t]) => a[e] === t)) {
			W(t);
			return;
		}
		i.pandaOpsRouteProbeResults = JSON.stringify(o), await V("/api/admin/theme/settings?theme=" + encodeURIComponent(n), i);
		let s = await V("/api/public");
		if (s.theme !== "Reze-Route") throw Error("主题已切换");
		let c = O(s.theme_settings?.pandaOpsRouteProbeResults);
		for (let [t, n] of Object.entries(e)) if (!c[t] || (C(c[t])?.measuredAt || 0) < (C(n)?.measuredAt || 0)) throw Error("结果保存校验失败");
		W(s);
	});
}
async function Y(e) {
	if (!(r.value.busy || !r.value.admin || document.hidden) && !(!e && (r.value.settings.azeRouteAuto === !1 || Date.now() - z < 9e5))) {
		i({ busy: !0 });
		try {
			if (!await q() || !r.value.admin) return;
			let t = r.value, n = t.nodes.filter((t) => !a(t) && !o(t) && (!e || t.uuid === e));
			if (!n.length) return;
			let s = await V(R + "/health");
			if (!s.ok || s.protocol !== 1) throw Error("回程插件未就绪");
			let c = await V(R + "/roster?clients=" + encodeURIComponent(n.map((e) => e.uuid).join(",")));
			i({ helpers: Object.fromEntries(c.clients.map((e) => [e.client, e])) });
			let l = n.filter((n) => {
				let r = c.clients.find((e) => e.client === n.uuid);
				if (!r?.helper_seen_at || Date.now() - r.helper_seen_at > 18e4 || (r.active_job_until || 0) > Date.now()) return !1;
				let i = C(k(n.uuid, n.tags, t.results));
				return e || !i?.measuredAt || i.freshness === "stale";
			}).map((e) => e.uuid);
			if (z = Date.now(), !l.length) {
				i({ status: "结果保持最新，未连接助手的节点暂不采集" });
				return;
			}
			let u = await V(R + "/enqueue", {
				clients: l,
				city: "beijing"
			}), d = Date.now() + 6e5, f = "";
			for (;;) {
				let e = Object.fromEntries(u.jobs.map((e) => [e.client, e]));
				i({ jobs: {
					...r.value.jobs,
					...e
				} });
				let t = U(u.jobs);
				Object.keys(t).length && JSON.stringify(t) !== f && (await J(t), f = JSON.stringify(t));
				let n = u.jobs.filter((e) => ["completed", "failed"].includes(e.status)).length;
				if (i({ status: `回程采集 ${n}/${u.jobs.length}，成功 ${Object.keys(t).length}` }), u.jobs.every((e) => ["completed", "failed"].includes(e.status))) break;
				if (Date.now() >= d) throw Error("本轮采集等待超时，保留上次成功结果");
				await new Promise((e) => setTimeout(e, 5e3));
				let [a, o] = await Promise.all([V("/api/public"), V("/api/me")]);
				if (!H(!!o.logged_in, a.theme)) throw Error("主题已切换或登录失效");
				u = await V(R + "/status?batch_id=" + encodeURIComponent(u.batch_id));
			}
		} catch (e) {
			z = Date.now(), i({ status: e instanceof Error ? e.message : "本次采集失败" });
		} finally {
			i({ busy: !1 });
		}
	}
}
async function X(e) {
	r.value.admin && !r.value.busy && (navigator.locks ? await navigator.locks.request("reze-route-collection", { ifAvailable: !0 }, async (t) => {
		t && await Y(e);
	}) : await Y(e));
}
function Z() {
	q().then((e) => {
		e && setTimeout(() => void X(), 8e3);
	}).catch(() => i({ status: "回程数据暂时无法读取" })), setInterval(() => {
		document.hidden || q().then((e) => {
			e && X();
		}).catch(() => {});
	}, 6e4);
}
// src/index.ts
Z();
var Q = {
	name: "IchigoAddressFamilyBadges",
	props: { node: {
		type: Object,
		required: !0
	} },
	setup(t) {
		return () => {
			let n = L(t.node, r.value.addressFamilies), i = ["ipv4", "ipv6"].filter((e) => n[e]);
			return i.length ? e("span", {
				class: "ichigo-ip-families",
				role: "group",
				"aria-label": "已上报的 IP 协议"
			}, i.map((t) => e("span", {
				key: t,
				class: ["ichigo-ip-badge", t === "ipv4" ? "ichigo-ip-badge--v4" : "ichigo-ip-badge--v6"],
				title: "节点已上报 " + (t === "ipv4" ? "IPv4" : "IPv6") + "；不代表公网连通性"
			}, t === "ipv4" ? "IPv4" : "IPv6"))) : null;
		};
	}
}, ee = [
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
	let t = e.filter((e) => e.hasData !== !1 && e.avgLoss !== 100).map((e) => e.avgLatency).filter((e) => Number.isFinite(e) && e >= 0), n = e.filter((e) => e.hasData !== !1).map((e) => e.avgLoss).filter((e) => Number.isFinite(e) && e >= 0 && e <= 100);
	return [
		{
			label: "拨测目标",
			value: e.length ? e.length + " 条" : "待配置"
		},
		{
			label: "最低延迟",
			value: t.length ? Math.round(Math.min(...t)) + " ms" : "等待采样"
		},
		{
			label: "最高丢包",
			value: n.length ? Math.max(...n).toFixed(1) + "%" : "等待采样"
		}
	];
}
var te = {
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
	setup(t) {
		return () => {
			let n = r.value, i = t.node, s = a(i), c = C(k(i.uuid, i.tags, n.results)), l = n.jobs[i.uuid], u = l && ["queued", "running"].includes(l.status), d = l?.status === "failed", f = c?.freshness === "stale", p = s ? "国内节点" : o(i) ? "已暂停" : u ? "采集中" : d ? "采集失败" : c ? f ? "结果已过期" : "已采集" : "等待采集", m = c?.measuredAt ? new Date(c.measuredAt).toLocaleString("zh-CN", {
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				hour12: !1
			}) : "", h = s ? "延迟拨测 · 独立延迟与丢包" : c ? "北京三网 · 更新 " + m : o(i) ? "此节点暂不采集回程" : d ? "本次失败 · 保留上次成功结果" : u ? "节点正在探测北京三网" : n.helpers[i.uuid]?.last_error ? "助手上次采集未成功" : "等待节点助手返回结果", g = s ? $(t.tasks).map((t, n) => e("div", {
				class: "aze-rp-tile aze-rp-local",
				key: n
			}, [
				e("span", { class: "aze-rp-carrier" }, t.label),
				e("strong", { class: "aze-rp-value" }, t.value),
				e("span", { class: "aze-rp-note" }, [
					"独立任务",
					"应答样本",
					"最近 1 小时"
				][n])
			])) : ee.map((t) => {
				let n = c?.entries.find((e) => e.carrier === t.key), r = n?.classification, i = r?.label || "待采集";
				i = r?.code.endsWith("_destination_only") ? "仅见目的网" : r?.confidence === "inconclusive" ? "证据不足" : i.replace(/^(电信|联通|移动)/, "");
				let a = n ? `${r?.label} · ${n.asns.join(" → ") || "无骨干跳点"} · ${r?.evidence}` : h;
				return e("div", {
					class: [
						"aze-rp-tile",
						t.tone,
						r?.confidence || "empty",
						f ? "stale" : ""
					],
					key: t.key,
					title: a
				}, [
					e("span", { class: "aze-rp-carrier" }, [e("i", {
						class: "aze-rp-icon",
						"aria-hidden": "true"
					}, t.icon), t.name]),
					e("strong", { class: "aze-rp-value" }, i),
					e("span", {
						class: "aze-rp-note",
						"data-route-grade": r?.grade || "ungraded"
					}, r?.grade || (n ? "不作线路定级" : "暂无线路证据"))
				]);
			});
			return e("section", {
				class: ["aze-route-panel", s ? "local" : "return"],
				"data-route-node": i.uuid,
				"aria-label": s ? "本地链路" : "三网回程"
			}, [
				e("div", { class: "aze-rp-head" }, [
					e("span", { class: "aze-rp-title" }, [e("span", {
						"aria-hidden": "true",
						class: "aze-rp-mark"
					}, s ? "◈" : "⇄"), s ? "本地链路" : "三网回程"]),
					e("span", { class: ["aze-rp-status", u ? "pending" : ""] }, p),
					n.admin && !s && !o(i) ? e("button", {
						type: "button",
						class: "aze-rp-refresh",
						title: n.status || "重新采集此节点三网回程",
						"aria-label": "重新采集 " + i.name + " 三网回程",
						disabled: n.busy,
						onClick: (e) => {
							e.stopPropagation(), X(i.uuid);
						},
						onKeydown: (e) => e.stopPropagation()
					}, [e("svg", {
						viewBox: "0 0 24 24",
						width: 11,
						height: 11,
						fill: "none",
						stroke: "currentColor",
						"stroke-width": 1.8,
						"stroke-linecap": "round",
						"stroke-linejoin": "round",
						"aria-hidden": "true"
					}, [e("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5" })])]) : null
				]),
				e("div", { class: "aze-rp-grid" }, g),
				e("div", {
					class: "aze-rp-foot",
					title: h
				}, [e("span", {
					class: "aze-rp-dot",
					"aria-hidden": "true"
				}), h])
			]);
		};
	}
};
export { Q as AddressFamilyBadges, te as RoutePanel, $ as domesticFacts, s as orderTasks };
