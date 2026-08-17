window.__ModuleLoader__.load({
	id: 'dsh-model-sync',
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var React = require('react');
		var h = React.createElement;

		var CSS_ID = 'dsh-model-sync/ui.css';
		var CSS = [
			'.msync-page{display:flex;flex-direction:column;gap:16px;max-width:760px;color:var(--dsw-alias-label-primary)}',
			'.msync-page h2{margin:0;font-size:16px;font-weight:600}',
			'.msync-page p.lead{margin:0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}',
			'.msync-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}',
			'.msync-row{display:flex;align-items:center;justify-content:space-between;gap:12px}',
			'.msync-row .name{font-size:13px;font-weight:600}',
			'.msync-row .hint{font-size:12px;color:var(--dsw-alias-label-tertiary)}',
			'.msync-feature-row{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:10px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:16px;cursor:pointer}',
			'.msync-feature-row .name{font-size:13px;font-weight:600}',
			'.msync-feature-row .hint{margin-top:2px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}',
			'.msync-feature-row .msync-switch{flex:none}',
			'.msync-btn{border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);border-radius:6px;padding:4px 10px;font:inherit;cursor:pointer}',
			'.msync-btn[disabled]{opacity:.45;cursor:default}',
			'.msync-btn.primary{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}',
			'.msync-switch{appearance:none;width:36px;height:20px;border-radius:999px;background:var(--dsw-alias-border-l2);position:relative;cursor:pointer;border:0}',
			'.msync-switch:checked{background:var(--dsw-alias-state-business-primary)}',
			'.msync-switch:before{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s}',
			'.msync-switch:checked:before{left:18px}',
			'.msync-models{display:flex;flex-wrap:wrap;gap:6px}',
			'.msync-models.scroll{flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px;max-width:100%}',
			'.msync-chip{font-size:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:2px 8px;white-space:nowrap;flex:none}',
			'.msync-chip.new{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}',
			'.msync-err{color:var(--dsw-alias-state-error-primary);font-size:12px;margin:0}',
			'.msync-update{font-size:12px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}',
			'.msync-details{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-3);padding:12px 14px}',
			'.msync-details summary{cursor:pointer;font-size:13px;font-weight:600;list-style:none;display:flex;align-items:center;gap:6px}',
			'.msync-details summary::-webkit-details-marker{display:none}',
			'.msync-details summary:before{content:"▸";font-size:11px;transition:transform .15s}',
			'.msync-details[open] summary:before{transform:rotate(90deg)}',
			'.msync-details .body{display:flex;flex-direction:column;gap:8px;margin-top:8px}',
			'.msync-usage-table{display:flex;flex-direction:column;gap:8px}',
			'.msync-usage-row{display:flex;align-items:flex-start;gap:10px;font-size:12px;color:var(--dsw-alias-label-secondary)}',
			'.msync-usage-row .u-label{min-width:64px;color:var(--dsw-alias-label-primary);font-weight:600;padding-top:1px}',
			'.msync-usage-row .u-value{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}',
			'.msync-usage-row .u-meta{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}',
			'.msync-bar{height:4px;border-radius:999px;background:var(--dsw-alias-border-l2);overflow:hidden}',
			'.msync-bar i{display:block;height:100%;border-radius:999px}',
			'.msync-ring{position:relative;display:inline-flex}',
			'.msync-ring svg{display:block}',
			// Composer trailing-row reorder: quota ring sits right of the model
			// seat (model + reasoning-effort trigger) and left of the context
			// meter. SlotOutlet anchors are display:contents divs (not flex
			// items), so order must target the element INSIDE each anchor
			// (data-slot names are the stable slot contract); ContextMeter is a
			// direct JSX child (hash class from the rc.6 bundle).
			'.uV2eYG_trailing > [data-slot="conversation.input.model"] > ._7KE1Ra_root{order:1}',
			'.uV2eYG_trailing > [data-slot="conversation.input.right"] > .msync-wrap{order:2}',
			'.uV2eYG_trailing > .JObwrW_root{order:3}',
			'.uV2eYG_trailing > *:not(.JObwrW_root){order:4}',
			'.msync-pop{position:absolute;bottom:calc(100% + 8px);right:0;left:auto;transform:none;min-width:280px;max-width:420px;padding:10px 12px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);box-shadow:var(--dsw-shadow-lv1);z-index:20;display:none}',
			'.msync-wrap:hover .msync-pop,.msync-wrap:focus-within .msync-pop{display:block}',
			'.msync-pop h4{margin:0 0 6px;font-size:12px}',
			'.msync-pop .line{font-size:12px;color:var(--dsw-alias-label-secondary);display:flex;justify-content:space-between;gap:10px}',
			'.msync-pop .prov{display:flex;flex-direction:column;gap:3px}',
			'.msync-wrap{position:relative;display:inline-flex;align-items:center}',
		].join('');

		function ensureCss() {
			if (typeof document === 'undefined') return;
			if (document.querySelector('style[data-plugin-css="' + CSS_ID + '"]')) return;
			var tag = document.createElement('style');
			tag.dataset.plugin = 'dsh-model-sync';
			tag.dataset.pluginCss = CSS_ID;
			tag.textContent = CSS;
			document.head.appendChild(tag);
		}

		var I18N = {
			zh: {
				navSync: '模型同步',
				navUsage: '用量详情',
				quota: '额度',
				syncLead: '从各提供方 /models 抓取新模型并写入 settings；额度与累计用量见「用量详情」。',
				refresh: '刷新',
				refreshing: '刷新中',
				pluginsToggle: '可选插件',
				pluginsHint: '可选插件使用 disabled 标志',
				syncToggleHint: '从提供方发现新模型并写入 settings',
				usageToggle: '模型用量查询',
				usageToggleHint: '查询额度与累计用量，并在输入框显示额度圆环',
				syncDisabled: '模型同步功能已关闭。',
				usageDisabled: '模型用量功能已关闭。',
				noBaseURL: '无 baseURL',
				applyN: '应用 {n} 个新模型',
				noNew: '无新模型',
				seeUsage: '额度与累计用量见「用量详情」',
				usageLead: '各供应商的额度窗口、累计用量与充值余额；余额百分比 = 当前余额 ÷ 基准（最后一次充值后的余额）。',
				updatedAt: '更新于 ',
				baselineBtn: '以当前余额为基准',
				baselineTitle: '以当前余额为新基准（充值后未自动检测到时手动校正）',
				noQuota: '无额度数据',
				win5h: '5 小时',
				win7d: '7 天',
				innerOuter: '内 7d / 外 5h',
				remaining: '剩余',
				reset: '重置',
				cumulative: '累计',
				apiBalance: 'API 余额',
				sessionQuota: '当前会话额度',
				unknownModel: '尚未识别当前模型',
				unknownSession: '尚未识别当前会话模型',
				yi: ' 亿',
				wan: ' 万',
				baselineRecorded: '基准记录于 ',
				times: '次',
				booster: '加量包',
				countdownDays: '{d} 天 {h} 小时后重置',
				countdownHours: '{h} 小时 {m} 分后重置',
				countdownMins: '{m} 分钟后重置',
				resetSoon: '即将重置',
			},
			en: {
				navSync: 'Model Sync',
				navUsage: 'Usage',
				quota: 'Quota',
				syncLead: 'Pull live /models into settings. Quotas and cumulative usage live on the Usage page.',
				refresh: 'Refresh',
				refreshing: 'Refreshing',
				pluginsToggle: 'Optional plugins',
				pluginsHint: 'Optional plugins use the disabled flag.',
				syncToggleHint: 'Discover provider models and write them into settings',
				usageToggle: 'Model usage queries',
				usageToggleHint: 'Query quotas and usage, and show quota rings in the composer',
				syncDisabled: 'Model Sync is disabled.',
				usageDisabled: 'Model Usage is disabled.',
				noBaseURL: 'no baseURL',
				applyN: 'Apply {n} new models',
				noNew: 'No new models',
				seeUsage: 'Quotas and cumulative usage are on the Usage page.',
				usageLead: 'Plan windows, cumulative usage, and API balance. Remaining % = current ÷ baseline (balance after the last top-up).',
				updatedAt: 'Updated ',
				baselineBtn: 'Use current balance as baseline',
				baselineTitle: 'Set the baseline to the current balance when a top-up was not auto-detected.',
				noQuota: 'No quota data',
				win5h: '5 hours',
				win7d: '7 days',
				innerOuter: 'Inner 7d / outer 5h',
				remaining: 'left',
				reset: 'resets',
				cumulative: 'used',
				apiBalance: 'API balance',
				sessionQuota: 'Current session quota',
				unknownModel: 'Current model not recognized',
				unknownSession: 'Current session model not recognized',
				yi: '00M',
				wan: '0k',
				baselineRecorded: 'Baseline set ',
				times: 'req',
				booster: 'Top-up pack',
				countdownDays: '{d}d {h}h left',
				countdownHours: '{h}h {m}m left',
				countdownMins: '{m}m left',
				resetSoon: 'resets soon',
			},
		};

		function activeLang() {
			try {
				var loc = pluginCtx && pluginCtx.get && pluginCtx.get('locale');
				var snap = loc && (loc.getLocale ? loc.getLocale() : loc.getSnapshot && loc.getSnapshot());
				return snap && snap.active === 'en' ? 'en' : 'zh';
			} catch (e) {
				return 'zh';
			}
		}

		function t(key) {
			var pack = I18N[activeLang()] || I18N.zh;
			return pack[key] || I18N.zh[key] || key;
		}

		function useLang() {
			var pair = React.useState(0);
			var bump = pair[1];
			React.useEffect(function () {
				var loc = pluginCtx && pluginCtx.get && pluginCtx.get('locale');
				function onChange() { bump(function (n) { return n + 1; }); }
				if (loc && typeof loc.subscribe === 'function') return loc.subscribe(onChange);
				if (pluginCtx && typeof pluginCtx.on === 'function') return pluginCtx.on('locale/change', onChange);
				return undefined;
			}, []);
			return activeLang();
		}

		function windowLabel(w) {
			if (!w) return '';
			if (w.key === '5h' || w.key === 'rate') return t('win5h');
			if (w.key === '7d') return t('win7d');
			return w.label;
		}

		function unitLabel(unit) {
			if (!unit) return '';
			if (unit === '次') return t('times');
			return unit;
		}

		function balanceRowLabel(b) {
			if (!b) return t('apiBalance');
			if (b.label === '加量包') return t('booster');
			return b.label || t('apiBalance');
		}

		function api(path, options) {
			return fetch('/agentteam/model-sync' + path, Object.assign({ headers: { accept: 'application/json', 'content-type': 'application/json' } }, options || {})).then(function (res) {
				return res.json().then(function (body) {
					if (!res.ok) throw new Error(body && body.error ? body.error : 'HTTP ' + res.status);
					return body;
				});
			});
		}

		function pluginEnabled(state, id) {
			return !!(state && state.plugins && state.plugins.some(function (plugin) {
				return plugin.id === id && plugin.enabled;
			}));
		}

		function pct(window) {
			if (!window || !window.limit) return 0;
			return Math.max(0, Math.min(1, window.remaining / window.limit));
		}

		function findWindow(windows, key) {
			if (!windows) return undefined;
			for (var i = 0; i < windows.length; i++) if (windows[i].key === key) return windows[i];
			return undefined;
		}

		function findBalance(providers) {
			// Icon-level balance: only providers WITHOUT plan windows get a
			// center dot (e.g. deepseek API credit). Providers that pair plan
			// windows with a top-up balance (e.g. kimi booster pack) show the
			// windows on the icon and keep the balance in the popup detail.
			if (!providers) return undefined;
			for (var i = 0; i < providers.length; i++) {
				var q = providers[i].quota || {};
				var b = q.balance;
				if (b && b.lastRecharge > 0 && !(q.windows && q.windows.length)) return b;
			}
			return undefined;
		}

		function balancePct(balance) {
			if (!balance || !(balance.lastRecharge > 0)) return undefined;
			return Math.max(0, Math.min(1, balance.current / balance.lastRecharge));
		}

		function compactNum(value) {
			var n = Number(value);
			if (!isFinite(n)) return String(value);
			var abs = Math.abs(n);
			if (activeLang() === 'en') {
				if (abs >= 1e9) return (n / 1e9).toFixed(1) + 'B';
				if (abs >= 1e6) return (n / 1e6).toFixed(1) + 'M';
				if (abs >= 1e3) return (n / 1e3).toFixed(1) + 'k';
				return String(Math.round(n * 100) / 100);
			}
			if (abs >= 1e8) return (n / 1e8).toFixed(1) + t('yi');
			if (abs >= 1e4) return (n / 1e4).toFixed(1) + t('wan');
			return String(Math.round(n * 100) / 100);
		}

		function money(unit, value) {
			if (unit === 'CNY') return '¥' + Number(value).toFixed(2);
			if (unit === 'USD') return '$' + Number(value).toFixed(2);
			if (unit && unit !== 'points' && unit !== 'UNIT_CURRENCY') return unit + ' ' + Number(value).toFixed(2);
			return compactNum(value);
		}

		function formatBalance(balance) {
			var p = balancePct(balance);
			if (p === undefined) return undefined;
			if (activeLang() === 'en') {
				return t('remaining') + ' ' + (p * 100).toFixed(1) + '% · now ' + money(balance.unit, balance.current) + ' / baseline ' + money(balance.unit, balance.lastRecharge);
			}
			return '剩余 ' + (p * 100).toFixed(1) + '% · 当前 ' + money(balance.unit, balance.current) + ' / 基准 ' + money(balance.unit, balance.lastRecharge);
		}

		function isLightTheme() {
			try {
				// dsh-client-ui-theme marks dark mode via body[data-ds-dark-theme].
				return typeof document !== 'undefined' && document.body !== null && !document.body.hasAttribute('data-ds-dark-theme');
			} catch {
				return false;
			}
		}

		function quotaColor(ratio) {
			// Remaining fraction 0..1. Anchors: 0 → dark red, 0.75 → green,
			// 1 → blue (low-attention neutral). Interpolated in HSL so hue
			// carries the meaning while perceived lightness stays even.
			// Two palettes: dark theme keeps mid-bright anchors; light theme
			// uses darker, more saturated anchors so every hue keeps ≥3:1
			// contrast on pale surfaces (mid green drops to ~1.4:1 there).
			var light = isLightTheme();
			var h0 = 0, s0 = light ? 0.7 : 0.65, l0 = light ? 0.38 : 0.42; // dark red
			var h1 = light ? 145 : 120, s1 = light ? 0.72 : 0.6, l1 = light ? 0.22 : 0.5; // green (deep forest green on light theme)
			var h2 = light ? 215 : 205, s2 = light ? 0.7 : 0.5, l2 = light ? 0.35 : 0.65; // blue / sky
			var h, s, l;
			if (ratio >= 0.75) {
				var t = (ratio - 0.75) / 0.25;
				h = h1 + (h2 - h1) * t;
				s = s1 + (s2 - s1) * t;
				l = l1 + (l2 - l1) * t;
			} else {
				var t = ratio / 0.75;
				h = h0 + (h1 - h0) * t;
				s = s0 + (s1 - s0) * t;
				l = l0 + (l1 - l0) * t;
			}
			return 'hsl(' + h.toFixed(0) + ',' + Math.round(s * 100) + '%,' + Math.round(l * 100) + '%)';
		}

		function DualRing(props) {
			var providers = props.providers || [];
			var windows = [];
			for (var pi = 0; pi < providers.length; pi++) {
				var qw = providers[pi].quota && providers[pi].quota.windows;
				if (qw) for (var wj = 0; wj < qw.length; wj++) windows.push(qw[wj]);
			}
			var quota = props.quota;
			var w5 = findWindow(windows, '5h') || findWindow(windows, 'rate') || findWindow(quota && quota.windows, '5h') || findWindow(quota && quota.windows, 'rate');
			var w7 = findWindow(windows, '7d') || findWindow(quota && quota.windows, '7d');
			var p5 = w5 ? pct(w5) : 0;
			var p7 = w7 ? pct(w7) : 0;
			var balance = findBalance(providers) || (quota && quota.balance);
			var bp = balancePct(balance);
			var balanceLabel = balanceRowLabel(balance);
			// Icon modes: dual rings only when BOTH windows exist; a single
			// quota (one window, or a balance-only provider) gets one ring.
			// Size: single ring matches the composer context meter (14px);
			// dual rings are 25% larger (17.5px).
			var winCount = (w5 ? 1 : 0) + (w7 ? 1 : 0);
			var single = null;
			var singleLabel = '';
			if (winCount === 2) {
				// dual rings
			} else if (winCount === 1) {
				var w1 = w5 || w7;
				single = pct(w1);
				singleLabel = windowLabel(w1) + ' ' + t('remaining') + ' ' + Math.round(single * 100) + '%';
			} else if (bp !== undefined) {
				single = bp;
				singleLabel = balanceLabel + ' ' + t('remaining') + ' ' + Math.round(bp * 100) + '%';
			}
			var title = winCount === 2 ? t('quota') : (t('quota') + ' · ' + singleLabel);
			// Slightly smaller than the composer context meter (14px) base:
			// single 12px, dual = single × 1.5 = 18px — then scaled ×1.2 overall.
			var SCALE = 1.2;
			var size = Math.round((winCount === 2 ? 18 : 12) * SCALE * 10) / 10;
			var cx = size / 2;
			var rOuter = (winCount === 2 ? 6.48 : 4.3) * SCALE;
			var rInner = 3.84 * SCALE;
			var strokeOuter = (winCount === 2 ? 1.68 : 1.5) * SCALE;
			var strokeInner = 1.44 * SCALE;
			var cOuter = 2 * Math.PI * rOuter;
			var cInner = 2 * Math.PI * rInner;
			return h('span', { className: 'msync-wrap', tabIndex: 0, title: title },
				h('span', { className: 'msync-ring', 'aria-label': t('quota') },
					h('svg', { width: size, height: size, viewBox: '0 0 ' + size + ' ' + size },
						winCount === 2
							? [
								h('circle', { key: 't5', cx: cx, cy: cx, r: rOuter, fill: 'none', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: strokeOuter }),
								h('circle', {
									key: 'a5', cx: cx, cy: cx, r: rOuter, fill: 'none',
									stroke: quotaColor(p5),
									strokeWidth: strokeOuter, strokeLinecap: 'round',
									strokeDasharray: String(cOuter),
									strokeDashoffset: String(cOuter * (1 - p5)),
									transform: 'rotate(-90 ' + cx + ' ' + cx + ')',
								}),
								h('circle', { key: 't7', cx: cx, cy: cx, r: rInner, fill: 'none', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: strokeInner }),
								h('circle', {
									key: 'a7', cx: cx, cy: cx, r: rInner, fill: 'none',
									stroke: quotaColor(p7),
									strokeWidth: strokeInner, strokeLinecap: 'round',
									strokeDasharray: String(cInner),
									strokeDashoffset: String(cInner * (1 - p7)),
									transform: 'rotate(-90 ' + cx + ' ' + cx + ')',
								}),
							]
							: [
								h('circle', { key: 't', cx: cx, cy: cx, r: rOuter, fill: 'none', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: strokeOuter }),
								single !== null
									? h('circle', {
										key: 'a', cx: cx, cy: cx, r: rOuter, fill: 'none',
										stroke: quotaColor(single),
										strokeWidth: strokeOuter, strokeLinecap: 'round',
										strokeDasharray: String(cOuter),
										strokeDashoffset: String(cOuter * (1 - single)),
										transform: 'rotate(-90 ' + cx + ' ' + cx + ')',
									})
									: null,
							],
					),
				),
				h('div', { className: 'msync-pop', role: 'dialog' },
					h('h4', null, props.model ? (props.provider + ' / ' + props.model) : t('sessionQuota')),
					providers.length === 0
						? h('div', { className: 'line' }, props.hint || t('unknownModel'))
						: providers.map(function (prov) {
							var q = prov.quota || {};
							var rows = q.windows || [];
							var cells = [];
							if (rows.length) {
								// One line per window so each quota (5h / 7d)
								// shows its own remaining % and reset countdown.
								rows.forEach(function (w) {
									cells.push(h('div', { key: 'w-' + w.key, className: 'line' },
										h('span', null, windowLabel(w)),
										h('span', null, t('remaining') + ' ' + Math.round(pct(w) * 100) + '% · ' + countdownText(w.resetAt)),
									));
								});
							} else if (q.reason && !q.balance) {
								cells.push(h('div', { key: 'r', className: 'line' }, h('span', null, ''), h('span', null, q.reason)));
							}
							var fb = q.balance && formatBalance(q.balance);
							if (fb) {
								cells.push(h('div', { key: 'b', className: 'line' },
									h('span', null, balanceRowLabel(q.balance)),
									h('span', null, fb),
								));
							}
							return h('div', { key: prov.id, className: 'prov' }, cells);
						}),
				),
			);
		}

		function SettingsPage(props) {
			ensureCss();
			useLang();
			var _s = React.useState(null);
			var state = _s[0];
			var setState = _s[1];
			var _e = React.useState('');
			var err = _e[0];
			var setErr = _e[1];
			var _b = React.useState(false);
			var busy = _b[0];
			var setBusy = _b[1];

			var load = React.useCallback(function () {
				setBusy(true);
				api('/state').then(function (next) {
					setState(next);
					setErr('');
				}).catch(function (error) {
					setErr(String(error.message || error));
				}).finally(function () {
					setBusy(false);
				});
			}, []);

			React.useEffect(function () {
				load();
			}, [load]);

			function toggle(id, enabled) {
				setBusy(true);
				api('/toggle', { method: 'POST', body: JSON.stringify({ id: id, enabled: enabled }) }).then(function (body) {
					setState(body.state);
				}).catch(function (error) {
					setErr(String(error.message || error));
				}).finally(function () {
					setBusy(false);
				});
			}

			function applyNew(provider) {
				var row = (state.providers || []).find(function (p) { return p.id === provider; });
				if (!row) return;
				var models = (row.discovered || []).filter(function (m) { return m.isNew; }).map(function (m) { return { id: m.id, name: m.name }; });
				if (!models.length) return;
				setBusy(true);
				api('/apply', { method: 'POST', body: JSON.stringify({ provider: provider, models: models }) }).then(function (body) {
					setState(body.state);
				}).catch(function (error) {
					setErr(String(error.message || error));
				}).finally(function () {
					setBusy(false);
				});
			}

			var syncActive = pluginEnabled(state, 'model-sync');
			var optionalPlugins = (state && state.plugins ? state.plugins : []).filter(function (plugin) {
				return plugin.id !== 'model-sync' && plugin.id !== 'model-sync-usage';
			});
			return h('div', { className: 'msync-page' },
				h('div', { className: 'msync-row' },
					h('div', null,
						h('h2', null, t('navSync')),
						h('p', { className: 'lead' }, t('syncLead')),
					),
					h('button', { className: 'msync-btn', disabled: busy, onClick: load }, busy ? t('refreshing') : t('refresh')),
				),
				err ? h('p', { className: 'msync-err' }, err) : null,
				h('label', { className: 'msync-feature-row' },
					h('div', null,
						h('div', { className: 'name' }, t('navSync')),
						h('div', { className: 'hint' }, t('syncToggleHint')),
					),
					h('input', {
						className: 'msync-switch',
						type: 'checkbox',
						checked: syncActive,
						disabled: busy || !state,
						onChange: function (ev) { toggle('model-sync', ev.target.checked); },
					}),
				),
				optionalPlugins.length ? h('details', { className: 'msync-details' },
					h('summary', null, t('pluginsToggle')),
					h('div', { className: 'body' },
						h('div', { className: 'hint' }, t('pluginsHint')),
						optionalPlugins.map(function (plugin) {
							return h('div', { key: plugin.id, className: 'msync-row' },
								h('div', null, h('div', { className: 'name' }, plugin.label), h('div', { className: 'hint' }, plugin.id)),
								h('input', {
									className: 'msync-switch',
									type: 'checkbox',
									checked: plugin.enabled,
									disabled: busy,
									onChange: function (ev) { toggle(plugin.id, ev.target.checked); },
								}),
							);
						}),
					),
				) : null,
				state && !syncActive ? h('p', { className: 'hint' }, t('syncDisabled')) : null,
				(syncActive && state && state.providers ? state.providers : []).map(function (provider) {
					var news = (provider.discovered || []).filter(function (m) { return m.isNew; });
					var q = provider.quota || {};
					var hasQuota = (q.windows && q.windows.length) || q.balance;
					return h('div', { key: provider.id, className: 'msync-card' },
						h('div', { className: 'msync-row' },
							h('div', null,
								h('div', { className: 'name' }, provider.id),
								h('div', { className: 'hint' }, provider.baseURL || t('noBaseURL')),
							),
							h('button', {
								className: 'msync-btn primary',
								disabled: busy || news.length === 0,
								onClick: function () { applyNew(provider.id); },
							}, news.length ? t('applyN').replace('{n}', String(news.length)) : t('noNew')),
						),
						h('div', { className: 'msync-models scroll' },
							(provider.discovered || []).map(function (model) {
								return h('span', { key: model.id, className: 'msync-chip' + (model.isNew ? ' new' : '') }, model.id);
							}),
						),
						provider.lastError ? h('p', { className: 'msync-err' }, provider.lastError) : null,
						hasQuota
							? h('p', { className: 'hint' }, t('seeUsage'))
							: (q.reason ? h('p', { className: 'hint' }, q.reason) : null),
					);
				}),
			);
		}

		function fmtTime(sec) {
			if (!sec) return '—';
			var d = new Date(sec * 1000);
			function pad(n) { return (n < 10 ? '0' : '') + n; }
			return (d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
		}

		function countdownText(resetAtSec) {
			if (!resetAtSec) return '';
			var diff = resetAtSec - Math.floor(Date.now() / 1000);
			if (diff <= 0) return t('resetSoon');
			var d = Math.floor(diff / 86400);
			var h = Math.floor((diff % 86400) / 3600);
			var m = Math.max(1, Math.floor((diff % 3600) / 60));
			if (d > 0) return t('countdownDays').replace('{d}', String(d)).replace('{h}', String(h));
			if (h > 0) return t('countdownHours').replace('{h}', String(h)).replace('{m}', String(m));
			return t('countdownMins').replace('{m}', String(m));
		}

		function UsageBar(ratio) {
			var p = ratio === undefined ? 0 : Math.max(0, Math.min(1, ratio));
			return h('div', { className: 'msync-bar' },
				h('i', { style: { width: Math.round(p * 100) + '%', background: quotaColor(p) } }),
			);
		}

		function windowUsageText(w) {
			var parts = [];
			if (w.usedRaw !== undefined && w.limitRaw !== undefined) {
				parts.push(t('cumulative') + ' ' + compactNum(w.usedRaw) + ' / ' + compactNum(w.limitRaw) + (w.rawUnit ? ' ' + unitLabel(w.rawUnit) : ''));
			}
			parts.push(t('remaining') + ' ' + Math.round(pct(w) * 100) + '%');
			parts.push(countdownText(w.resetAt));
			return parts;
		}

		function UsageRow(props) {
			return h('div', { className: 'msync-usage-row' },
				h('span', { className: 'u-label' }, props.label),
				h('div', { className: 'u-value' },
					h('div', { className: 'u-meta' }, props.cells.map(function (c, i) {
						return h('span', { key: i }, c);
					})),
					UsageBar(props.ratio),
				),
			);
		}

		function UsagePage(props) {
			ensureCss();
			useLang();
			var _s = React.useState(null);
			var state = _s[0];
			var setState = _s[1];
			var _e = React.useState('');
			var err = _e[0];
			var setErr = _e[1];
			var _b = React.useState(false);
			var busy = _b[0];
			var setBusy = _b[1];

			var load = React.useCallback(function () {
				setBusy(true);
				api('/state').then(function (next) {
					setState(next);
					setErr('');
				}).catch(function (error) {
					setErr(String(error.message || error));
				}).finally(function () {
					setBusy(false);
				});
			}, []);

			React.useEffect(function () {
				load();
				var timer = setInterval(load, 60000);
				return function () { clearInterval(timer); };
			}, [load]);

			function resetBaseline(provider) {
				setBusy(true);
				api('/baseline-reset', { method: 'POST', body: JSON.stringify({ provider: provider }) }).then(function (body) {
					setState(body.state);
					setErr('');
				}).catch(function (error) {
					setErr(String(error.message || error));
				}).finally(function () {
					setBusy(false);
				});
			}

			function toggleUsage(enabled) {
				setBusy(true);
				api('/toggle', { method: 'POST', body: JSON.stringify({ id: 'model-sync-usage', enabled: enabled }) }).then(function (body) {
					setState(body.state);
					setErr('');
				}).catch(function (error) {
					setErr(String(error.message || error));
				}).finally(function () {
					setBusy(false);
				});
			}

			var updated = 0;
			if (state && state.providers) {
				for (var i = 0; i < state.providers.length; i++) {
					var u = state.providers[i].quota && state.providers[i].quota.updatedAt;
					if (u > updated) updated = u;
				}
			}
			var usageActive = pluginEnabled(state, 'model-sync-usage');
			return h('div', { className: 'msync-page' },
				h('div', { className: 'msync-row' },
					h('div', null,
						h('h2', null, t('navUsage')),
						h('p', { className: 'lead' }, t('usageLead')),
					),
					h('div', { className: 'msync-row', style: { gap: '8px' } },
						updated ? h('span', { className: 'msync-update' }, t('updatedAt') + fmtTime(Math.floor(updated / 1000))) : null,
						h('button', { className: 'msync-btn', disabled: busy, onClick: load }, busy ? t('refreshing') : t('refresh')),
					),
				),
				err ? h('p', { className: 'msync-err' }, err) : null,
				h('label', { className: 'msync-feature-row' },
					h('div', null,
						h('div', { className: 'name' }, t('usageToggle')),
						h('div', { className: 'hint' }, t('usageToggleHint')),
					),
					h('input', {
						className: 'msync-switch',
						type: 'checkbox',
						checked: usageActive,
						disabled: busy || !state,
						onChange: function (ev) { toggleUsage(ev.target.checked); },
					}),
				),
				state && !usageActive ? h('p', { className: 'hint' }, t('usageDisabled')) : null,
				(usageActive && state && state.providers ? state.providers : []).map(function (provider) {
					var q = provider.quota || {};
					var rows = [];
					(q.windows || []).forEach(function (w) {
						rows.push(h(UsageRow, {
							key: 'w-' + w.key,
							label: windowLabel(w),
							cells: windowUsageText(w),
							ratio: pct(w),
						}));
					});
					var fb = q.balance && formatBalance(q.balance);
					if (fb) {
						var bCells = [fb];
						if (q.balance && q.balance.baselineAt) {
							bCells.push(t('baselineRecorded') + fmtTime(Math.floor(q.balance.baselineAt / 1000)));
						}
						rows.push(h(UsageRow, {
							key: 'b',
							label: balanceRowLabel(q.balance),
							cells: bCells,
							ratio: balancePct(q.balance),
						}));
					}
					return h('div', { key: provider.id, className: 'msync-card' },
						h('div', { className: 'msync-row' },
							h('div', { className: 'name' }, provider.id),
							q.balance
								? h('button', {
									className: 'msync-btn',
									disabled: busy,
									title: t('baselineTitle'),
									onClick: function () { resetBaseline(provider.id); },
								}, t('baselineBtn'))
								: null,
						),
						rows.length
							? h('div', { className: 'msync-usage-table' }, rows)
							: h('p', { className: 'hint' }, q.reason || t('noQuota')),
					);
				}),
			);
		}

		var pluginCtx;
		// Settings nav glyphs: dsh-client-ui-settings-general only maps built-in
		// section ids (models/agent-presets/plugins) to icons; every other
		// section falls back to the gear. We re-stamp the gear SVG with the
		// matching 16px outline glyph (copied from dsh-client-ui-primitives) by
		// nav-label text, keeping the existing navIcon wrapper class intact.
		var NAV_ICON_BODIES = {
			'模型同步': '<path fill="currentColor" d="M7.92136 0.349152C10.3744 0.349234 12.5564 1.5052 13.9557 3.29894L15.1281 2.12759C15.3303 1.92546 15.6767 2.06943 15.6767 2.35538V5.53923C15.6766 5.71626 15.5329 5.85976 15.3559 5.86002H12.171C11.8854 5.8597 11.7426 5.51465 11.9443 5.31249L12.9641 4.29056C11.8237 2.74305 9.98908 1.74106 7.92136 1.74097C4.46436 1.74097 1.66233 4.543 1.66233 8C1.66233 11.457 4.46436 14.259 7.92136 14.259C11.3782 14.2589 14.1804 11.4569 14.1804 8H15.5722C15.5722 12.2251 12.1465 15.6507 7.92136 15.6508C3.69614 15.6508 0.270508 12.2252 0.270508 8C0.270508 3.77478 3.69614 0.349152 7.92136 0.349152Z"/>',
			'Model Sync': '<path fill="currentColor" d="M7.92136 0.349152C10.3744 0.349234 12.5564 1.5052 13.9557 3.29894L15.1281 2.12759C15.3303 1.92546 15.6767 2.06943 15.6767 2.35538V5.53923C15.6766 5.71626 15.5329 5.85976 15.3559 5.86002H12.171C11.8854 5.8597 11.7426 5.51465 11.9443 5.31249L12.9641 4.29056C11.8237 2.74305 9.98908 1.74106 7.92136 1.74097C4.46436 1.74097 1.66233 4.543 1.66233 8C1.66233 11.457 4.46436 14.259 7.92136 14.259C11.3782 14.2589 14.1804 11.4569 14.1804 8H15.5722C15.5722 12.2251 12.1465 15.6507 7.92136 15.6508C3.69614 15.6508 0.270508 12.2252 0.270508 8C0.270508 3.77478 3.69614 0.349152 7.92136 0.349152Z"/>',
			'用量详情': '<path fill="currentColor" d="M10.8239 3.54733V4.78443H4.63437V3.54733H10.8239Z"/><path fill="currentColor" d="M10.8239 6.12629V7.36338H4.63437V6.12629H10.8239Z"/><path fill="currentColor" d="M9.073 8.70524V9.94234H4.63437V8.70524H9.073Z"/><path fill="currentColor" d="M9.13321 0.573526C10.0076 0.573525 10.7179 0.572522 11.285 0.63397C11.8645 0.696791 12.3743 0.831648 12.8193 1.1548C13.0776 1.34246 13.3056 1.57047 13.4933 1.82875C13.8164 2.2737 13.9513 2.7836 14.0141 3.36303C14.0755 3.93015 14.0745 4.64049 14.0745 5.51485V6.1757L12.7327 7.5629V5.51485C12.7327 4.61092 12.732 3.9862 12.6803 3.5081C12.6298 3.0427 12.5379 2.79497 12.4083 2.61654C12.3033 2.47211 12.176 2.34472 12.0315 2.23977C11.8531 2.11016 11.6054 2.01823 11.14 1.96777C10.6618 1.91601 10.0372 1.91539 9.13321 1.91539H6.32658C5.42262 1.91539 4.79796 1.91604 4.31983 1.96777C3.85451 2.01819 3.60672 2.11029 3.42827 2.23977C3.28392 2.34465 3.15643 2.47223 3.0515 2.61654C2.9219 2.79496 2.82997 3.04274 2.7795 3.5081C2.72774 3.9862 2.72712 4.61092 2.72712 5.51485V10.023C2.72712 10.9273 2.72773 11.5525 2.7795 12.0307C2.82992 12.4959 2.92205 12.7429 3.0515 12.9213C3.15645 13.0657 3.28384 13.1931 3.42827 13.2981C3.60676 13.4277 3.85408 13.5206 4.31983 13.5711C4.79797 13.6228 5.42259 13.6234 6.32658 13.6234H6.87057L5.57707 14.9593C5.03527 14.9556 4.57031 14.9467 4.17476 14.9039C3.59508 14.841 3.08558 14.7063 2.64048 14.383C2.38215 14.1953 2.15422 13.9684 1.96653 13.7101C1.64319 13.2649 1.50851 12.7546 1.4457 12.1748C1.38432 11.6076 1.38525 10.8974 1.38525 10.023V5.51485C1.38525 4.64049 1.38426 3.93015 1.4457 3.36303C1.50853 2.78363 1.64341 2.27368 1.96653 1.82875C2.15417 1.57059 2.38228 1.34239 2.64048 1.1548C3.08544 0.831805 3.59533 0.696762 4.17476 0.63397C4.74193 0.572552 5.45218 0.573525 6.32658 0.573526H9.13321Z"/><path fill="currentColor" d="M14.2193 14.9553H10.0124L11.3744 13.6134H14.2193V14.9553Z"/><path fill="currentColor" d="M8.24493 13.3711L7.49015 14.8806C7.40148 15.058 7.58961 15.2461 7.76695 15.1574L9.27651 14.4027L14.6147 9.09934L13.5832 8.06775L8.24493 13.3711Z"/>',
			'Usage': '<path fill="currentColor" d="M10.8239 3.54733V4.78443H4.63437V3.54733H10.8239Z"/><path fill="currentColor" d="M10.8239 6.12629V7.36338H4.63437V6.12629H10.8239Z"/><path fill="currentColor" d="M9.073 8.70524V9.94234H4.63437V8.70524H9.073Z"/><path fill="currentColor" d="M9.13321 0.573526C10.0076 0.573525 10.7179 0.572522 11.285 0.63397C11.8645 0.696791 12.3743 0.831648 12.8193 1.1548C13.0776 1.34246 13.3056 1.57047 13.4933 1.82875C13.8164 2.2737 13.9513 2.7836 14.0141 3.36303C14.0755 3.93015 14.0745 4.64049 14.0745 5.51485V6.1757L12.7327 7.5629V5.51485C12.7327 4.61092 12.732 3.9862 12.6803 3.5081C12.6298 3.0427 12.5379 2.79497 12.4083 2.61654C12.3033 2.47211 12.176 2.34472 12.0315 2.23977C11.8531 2.11016 11.6054 2.01823 11.14 1.96777C10.6618 1.91601 10.0372 1.91539 9.13321 1.91539H6.32658C5.42262 1.91539 4.79796 1.91604 4.31983 1.96777C3.85451 2.01819 3.60672 2.11029 3.42827 2.23977C3.28392 2.34465 3.15643 2.47223 3.0515 2.61654C2.9219 2.79496 2.82997 3.04274 2.7795 3.5081C2.72774 3.9862 2.72712 4.61092 2.72712 5.51485V10.023C2.72712 10.9273 2.72773 11.5525 2.7795 12.0307C2.82992 12.4959 2.92205 12.7429 3.0515 12.9213C3.15645 13.0657 3.28384 13.1931 3.42827 13.2981C3.60676 13.4277 3.85408 13.5206 4.31983 13.5711C4.79797 13.6228 5.42259 13.6234 6.32658 13.6234H6.87057L5.57707 14.9593C5.03527 14.9556 4.57031 14.9467 4.17476 14.9039C3.59508 14.841 3.08558 14.7063 2.64048 14.383C2.38215 14.1953 2.15422 13.9684 1.96653 13.7101C1.64319 13.2649 1.50851 12.7546 1.4457 12.1748C1.38432 11.6076 1.38525 10.8974 1.38525 10.023V5.51485C1.38525 4.64049 1.38426 3.93015 1.4457 3.36303C1.50853 2.78363 1.64341 2.27368 1.96653 1.82875C2.15417 1.57059 2.38228 1.34239 2.64048 1.1548C3.08544 0.831805 3.59533 0.696762 4.17476 0.63397C4.74193 0.572552 5.45218 0.573525 6.32658 0.573526H9.13321Z"/><path fill="currentColor" d="M14.2193 14.9553H10.0124L11.3744 13.6134H14.2193V14.9553Z"/><path fill="currentColor" d="M8.24493 13.3711L7.49015 14.8806C7.40148 15.058 7.58961 15.2461 7.76695 15.1574L9.27651 14.4027L14.6147 9.09934L13.5832 8.06775L8.24493 13.3711Z"/>',
		};

		function patchNavIcons() {
			if (typeof document === 'undefined') return;
			var navs = document.querySelectorAll('nav');
			for (var n = 0; n < navs.length; n++) {
				var buttons = navs[n].querySelectorAll('button');
				for (var i = 0; i < buttons.length; i++) {
					var btn = buttons[i];
					var body = NAV_ICON_BODIES[(btn.textContent || '').trim()];
					if (!body) continue;
					var svg = btn.querySelector('svg');
					if (!svg || svg.getAttribute('data-msync-nav')) continue;
					svg.setAttribute('data-msync-nav', '1');
					svg.setAttribute('width', '16');
					svg.setAttribute('height', '16');
					svg.setAttribute('viewBox', '0 0 16 16');
					svg.setAttribute('fill', 'none');
					svg.innerHTML = body;
				}
			}
		}

		function startNavIconPatcher() {
			if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
			if (window.__msyncNavPatcher) return;
			window.__msyncNavPatcher = true;
			var timer = null;
			function schedule() {
				if (timer) return;
				timer = setTimeout(function () { timer = null; patchNavIcons(); }, 150);
			}
			var observer = new MutationObserver(schedule);
			observer.observe(document.body, { childList: true, subtree: true });
			patchNavIcons();
		}

		function RingSeat(props) {
			ensureCss();
			useLang();
			var sessionId = props.sessionId || (props.session && props.session.sessionId);
			var _s = React.useState(null);
			var state = _s[0];
			var setState = _s[1];
			var _sel = React.useState(null);
			var selection = _sel[0];
			var setSelection = _sel[1];
			React.useEffect(function () {
				var alive = true;
				function tick() {
					api('/state').then(function (next) { if (alive) setState(next); }).catch(function () {});
				}
				tick();
				var timer = setInterval(tick, 60000);
				return function () { alive = false; clearInterval(timer); };
			}, []);
			React.useEffect(function () {
				var dirs = pluginCtx && pluginCtx.get('modelDirectories');
				if (!dirs || !sessionId) return;
				var dir;
				try { dir = dirs.directoryFor(sessionId); } catch (e) { return; }
				function pull() {
					var snap = dir.store.getSnapshot();
					var cur = snap && snap.current;
					setSelection(cur && cur.provider ? { provider: cur.provider, model: cur.model } : null);
				}
				pull();
				if (typeof dir.load === 'function') dir.load().catch(function () {});
				return dir.store.subscribe(pull);
			}, [sessionId]);
			var all = (state && state.providers) || [];
			var active = pluginEnabled(state, 'model-sync-usage');
			if (!active) return null;
			var filtered = [];
			if (selection && selection.provider) {
				for (var i = 0; i < all.length; i++) if (all[i].id === selection.provider) filtered.push(all[i]);
			}
			return h(DualRing, {
				providers: filtered,
				provider: selection && selection.provider,
				model: selection && selection.model,
				hint: selection ? undefined : t('unknownSession'),
			});
		}

		var inject = ['slots'];
		function apply(ctx) {
			pluginCtx = ctx;
			ensureCss();
			startNavIconPatcher();
			var slots = ctx.get('slots');
			if (slots === undefined) return;
			slots.inject('settings.section', function () {
				return slots.register({
					name: 'settings.section',
					id: 'model-sync',
					order: 16,
					label: function () { return t('navSync'); },
				}, SettingsPage);
			});
			slots.inject('settings.section', function () {
				return slots.register({
					name: 'settings.section',
					id: 'model-sync-usage',
					order: 17,
					label: function () { return t('navUsage'); },
				}, UsagePage);
			});
			slots.inject('conversation.input.right', function () {
				return slots.register({
					name: 'conversation.input.right',
					id: 'model-sync-quota',
					order: 20,
					label: function () { return t('quota'); },
				}, RingSeat);
			});
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	},
});
